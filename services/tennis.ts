// 테니스 교류전 저장 (tennis_events: 대진표 / tennis_scores: 점수).
// 방 공유형 서비스(장소잡기 등)처럼 로그인 없이 링크만 있으면 누구나 점수를 넣는다.
// 표는 anon permissive 정책 — 실제 통제는 "링크를 아는 사람만"이라는 전제.
import { supabase } from "@/lib/supabase";
import { normalizeRules } from "@/app/tennis/rules";
import type {
  Court,
  Match,
  MatchScore,
  Player,
  Round,
  TennisEvent,
} from "@/app/tennis/types";
import type { TeamEntry, TournamentEvent } from "@/app/tennis/tournament/types";
import { normalizeRoster } from "@/app/tennis/tournament/roster";
import type {
  GeneralEvent,
  GeneralGroup,
  GeneralMatch,
  GeneralSettings,
  GeneralTeam,
} from "@/app/tennis/general/types";

// === 점수 ===

type ScoreRow = {
  event_id: string;
  match_no: number;
  score_a: number;
  score_b: number;
  court: Court | null;
  started_at: string | null;
  finished_at: string | null;
  tiebreak_a: number | null;
  tiebreak_b: number | null;
};

function toScore(row: ScoreRow): MatchScore {
  return {
    matchNo: row.match_no,
    scoreA: row.score_a,
    scoreB: row.score_b,
    court: row.court ?? undefined,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    tiebreakA: row.tiebreak_a ?? undefined,
    tiebreakB: row.tiebreak_b ?? undefined,
  };
}

export async function fetchTennisScores(eventId: string): Promise<MatchScore[]> {
  const { data, error } = await supabase
    .from("tennis_scores")
    .select("event_id, match_no, score_a, score_b, court, started_at, finished_at, tiebreak_a, tiebreak_b")
    .eq("event_id", eventId)
    .order("match_no", { ascending: true });
  if (error) throw error;
  return (data as ScoreRow[] | null)?.map(toScore) ?? [];
}

// "지금 시작": 코트와 시작 시각만 기록한다 (점수는 아직 0:0, finished_at 없음 = 진행 중)
export async function startTennisMatch(
  eventId: string,
  matchNo: number,
  court: Court,
  startedAt: string,
): Promise<void> {
  const { error } = await supabase.from("tennis_scores").upsert(
    {
      event_id: eventId,
      match_no: matchNo,
      score_a: 0,
      score_b: 0,
      court,
      started_at: startedAt,
      finished_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,match_no" },
  );
  if (error) throw error;
}

// 점수 저장(완료). court·startedAt·finishedAt은 클라이언트가 기존 값을 이어서 넘긴다
export async function saveTennisScore(
  eventId: string,
  score: MatchScore,
): Promise<void> {
  const { error } = await supabase.from("tennis_scores").upsert(
    {
      event_id: eventId,
      match_no: score.matchNo,
      score_a: score.scoreA,
      score_b: score.scoreB,
      court: score.court ?? null,
      started_at: score.startedAt ?? null,
      finished_at: score.finishedAt ?? new Date().toISOString(),
      tiebreak_a: score.tiebreakA ?? null,
      tiebreak_b: score.tiebreakB ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,match_no" },
  );
  if (error) throw error;
}

export async function deleteTennisScore(
  eventId: string,
  matchNo: number,
): Promise<void> {
  const { error } = await supabase
    .from("tennis_scores")
    .delete()
    .eq("event_id", eventId)
    .eq("match_no", matchNo);
  if (error) throw error;
}

// === 교류전(대진표) ===

type EventRow = {
  id: string;
  kind: "exchange" | "tournament" | "general" | null;
  title: string;
  date: string;
  start_time: string;
  place: string;
  courts: number;
  minutes_per_match: number;
  after_note: string;
  players: Player[];
  rounds: Round[];
  // matches·teams는 종류마다 모양이 다르다 (교류전 Match[] / 토너먼트 TeamEntry[] / 일반 대회 GeneralMatch[]).
  // kind로 나눠 읽으므로 여기서는 unknown으로 두고 읽는 곳에서 형을 밝힌다.
  matches: unknown;
  teams: unknown;
  rules: unknown;
  config: Record<string, unknown> | null; // 종류별 설정 (토너먼트: gamesToWin·timeTbd·beforeNote / 일반 대회: settings·groups·knockoutBuilt)
};

function toEvent(row: EventRow): TennisEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    place: row.place ?? "",
    courts: row.courts,
    minutesPerMatch: row.minutes_per_match,
    afterNote: row.after_note ?? "",
    players: row.players ?? [],
    rounds: row.rounds ?? [],
    matches: (row.matches as Match[] | null) ?? [],
    rules: normalizeRules(row.rules),
  };
}

function toTournament(row: EventRow): TournamentEvent {
  const cfg = row.config ?? {};
  return {
    id: row.id,
    kind: "tournament",
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    timeTbd: typeof cfg.timeTbd === "boolean" ? cfg.timeTbd : false,
    place: row.place ?? "",
    minutesPerMatch: row.minutes_per_match,
    gamesToWin: typeof cfg.gamesToWin === "number" ? cfg.gamesToWin : 6,
    courts: row.courts,
    teams: (row.teams as TeamEntry[] | null) ?? [],
    roster: normalizeRoster(cfg.roster), // 예전 저장분(이름만 있는 배열)도 읽힌다
    beforeNote: typeof cfg.beforeNote === "string" ? cfg.beforeNote : "",
    afterNote: row.after_note ?? "",
    rules: normalizeRules(row.rules),
  };
}

// === 일반 대회 ===
// 저장본이 낡았거나 일부가 빠져 있어도 화면이 죽지 않도록 방어적으로 읽는다.

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  format: "league",
  gamesToWin: 6,
  useTiebreak: true,
  thirdPlace: false,
  shuffled: false,
  groupBy: "size",
  groupSize: 4,
  groupCount: 2,
  advancePerGroup: 2,
  timeTbd: false,
  beforeNote: "",
};

function normalizeGeneralTeams(value: unknown): GeneralTeam[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
    .map((t, i) => ({
      id: typeof t.id === "string" && t.id ? t.id : `t${i + 1}`,
      seed: typeof t.seed === "number" ? t.seed : i + 1,
      name: typeof t.name === "string" ? t.name : `${i + 1}팀`,
      players: Array.isArray(t.players) ? t.players.filter((p): p is string => typeof p === "string") : [],
    }));
}

// 경기 자리(a/b)에 kind가 제대로 든 것만 통과시킨다.
// (typeof null === "object"라 null 검사를 따로 해야 화면에서 자리를 읽다 멈추지 않는다)
function isGeneralSlot(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const kind = (value as Record<string, unknown>).kind;
  return kind === "team" || kind === "winner" || kind === "loser" || kind === "groupRank" || kind === "bye";
}

function normalizeGeneralMatches(value: unknown): GeneralMatch[] {
  if (!Array.isArray(value)) return [];
  return value.filter((m): m is GeneralMatch => {
    if (typeof m !== "object" || m === null) return false;
    const row = m as Record<string, unknown>;
    return Number.isInteger(row.no) && isGeneralSlot(row.a) && isGeneralSlot(row.b);
  });
}

function normalizeGeneralGroups(value: unknown): GeneralGroup[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map((g) => ({
      id: typeof g.id === "string" ? g.id : "",
      label: typeof g.label === "string" ? g.label : `${typeof g.id === "string" ? g.id : ""}조`,
      teamIds: Array.isArray(g.teamIds) ? g.teamIds.filter((x): x is string => typeof x === "string") : [],
    }))
    .filter((g) => g.id !== "");
}

function normalizeGeneralSettings(value: unknown): GeneralSettings {
  const cfg = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const pick = <T,>(key: string, fallback: T, ok: (v: unknown) => boolean): T =>
    ok(cfg[key]) ? (cfg[key] as T) : fallback;
  const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const isBool = (v: unknown) => typeof v === "boolean";
  return {
    format: pick("format", DEFAULT_GENERAL_SETTINGS.format, (v) => v === "league" || v === "knockout" || v === "groups"),
    gamesToWin: pick("gamesToWin", 6, isNum),
    useTiebreak: pick("useTiebreak", true, isBool),
    thirdPlace: pick("thirdPlace", false, isBool),
    shuffled: pick("shuffled", false, isBool),
    groupBy: pick("groupBy", "size" as const, (v) => v === "size" || v === "count"),
    groupSize: pick("groupSize", 4, isNum),
    groupCount: pick("groupCount", 2, isNum),
    advancePerGroup: pick("advancePerGroup", 2 as 1 | 2, (v) => v === 1 || v === 2),
    timeTbd: pick("timeTbd", false, isBool),
    beforeNote: pick("beforeNote", "", (v) => typeof v === "string"),
  };
}

function toGeneral(row: EventRow): GeneralEvent {
  const cfg = row.config ?? {};
  return {
    id: row.id,
    kind: "general",
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    place: row.place ?? "",
    courts: row.courts,
    minutesPerMatch: row.minutes_per_match,
    afterNote: row.after_note ?? "",
    teams: normalizeGeneralTeams(row.teams),
    matches: normalizeGeneralMatches(row.matches),
    groups: normalizeGeneralGroups(cfg.groups),
    knockoutBuilt: cfg.knockoutBuilt === true,
    settings: normalizeGeneralSettings(cfg.settings),
    rules: normalizeRules(row.rules),
  };
}

const EVENT_COLUMNS =
  "id, kind, title, date, start_time, place, courts, minutes_per_match, after_note, players, rounds, matches, rules, teams, config";

export type AnyTennisEvent = TennisEvent | TournamentEvent | GeneralEvent;

export function isTournament(event: AnyTennisEvent): event is TournamentEvent {
  return (event as TournamentEvent).kind === "tournament";
}

export function isGeneral(event: AnyTennisEvent): event is GeneralEvent {
  return (event as GeneralEvent).kind === "general";
}

export async function fetchTennisEvent(id: string): Promise<AnyTennisEvent | null> {
  const { data, error } = await supabase
    .from("tennis_events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as EventRow;
  if (row.kind === "tournament") return toTournament(row);
  if (row.kind === "general") return toGeneral(row);
  return toEvent(row);
}

// 새 토너먼트 만들기: 화면에서 만든 대회는 uuid 문자열 id를 받는다
export async function createTournament(input: Omit<TournamentEvent, "id" | "builtIn">): Promise<TournamentEvent> {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return upsertTournament({ ...input, id });
}

// 토너먼트 저장 (코드에 든 대회를 처음 편집할 때도 같은 id로 통째로 저장)
export async function upsertTournament(event: TournamentEvent): Promise<TournamentEvent> {
  const { data, error } = await supabase
    .from("tennis_events")
    .upsert(
      {
        id: event.id,
        kind: "tournament",
        title: event.title,
        date: event.date,
        start_time: event.startTime,
        place: event.place,
        courts: event.courts,
        minutes_per_match: event.minutesPerMatch,
        after_note: event.afterNote,
        players: [],
        rounds: [],
        matches: [],
        rules: event.rules,
        teams: event.teams,
        config: { gamesToWin: event.gamesToWin, timeTbd: event.timeTbd, beforeNote: event.beforeNote, roster: event.roster },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return toTournament(data as EventRow);
}

// 새 일반 대회 만들기: 화면에서 만든 대회는 uuid 문자열 id를 받는다
export async function createGeneral(input: Omit<GeneralEvent, "id" | "builtIn">): Promise<GeneralEvent> {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return upsertGeneral({ ...input, id });
}

// 일반 대회 저장 (대진·조·설정을 통째로). 조별 대회의 결선을 뒤에 붙일 때도 이걸 쓴다
export async function upsertGeneral(event: GeneralEvent): Promise<GeneralEvent> {
  const { data, error } = await supabase
    .from("tennis_events")
    .upsert(
      {
        id: event.id,
        kind: "general",
        title: event.title,
        date: event.date,
        start_time: event.startTime,
        place: event.place,
        courts: event.courts,
        minutes_per_match: event.minutesPerMatch,
        after_note: event.afterNote,
        players: [],
        rounds: [],
        matches: event.matches,
        rules: event.rules,
        teams: event.teams,
        config: {
          settings: event.settings,
          groups: event.groups,
          knockoutBuilt: event.knockoutBuilt,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return toGeneral(data as EventRow);
}

export type NewTennisEvent = Omit<TennisEvent, "id" | "builtIn">;

export async function createTennisEvent(input: NewTennisEvent): Promise<TennisEvent> {
  const { data, error } = await supabase
    .from("tennis_events")
    .insert({
      kind: "exchange",
      title: input.title,
      date: input.date,
      start_time: input.startTime,
      place: input.place,
      courts: input.courts,
      minutes_per_match: input.minutesPerMatch,
      after_note: input.afterNote,
      players: input.players,
      rounds: input.rounds,
      matches: input.matches,
      rules: input.rules,
    })
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return toEvent(data as EventRow);
}

// 코드에 든 교류전을 처음 편집할 때: 같은 id로 통째로 저장한다 (이후엔 이 표의 내용을 쓴다)
export async function upsertTennisEvent(event: TennisEvent): Promise<TennisEvent> {
  const { data, error } = await supabase
    .from("tennis_events")
    .upsert(
      {
        id: event.id,
        kind: "exchange",
        title: event.title,
        date: event.date,
        start_time: event.startTime,
        place: event.place,
        courts: event.courts,
        minutes_per_match: event.minutesPerMatch,
        after_note: event.afterNote,
        players: event.players,
        rounds: event.rounds,
        matches: event.matches,
        rules: event.rules,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return toEvent(data as EventRow);
}

// 대진표(라운드·경기)만 고친다. 선수 명단은 같이 넘겨 일관성을 유지한다
export async function updateTennisBracket(
  id: string,
  input: Pick<TennisEvent, "players" | "rounds" | "matches">,
): Promise<TennisEvent> {
  const { data, error } = await supabase
    .from("tennis_events")
    .update({
      players: input.players,
      rounds: input.rounds,
      matches: input.matches,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return toEvent(data as EventRow);
}
