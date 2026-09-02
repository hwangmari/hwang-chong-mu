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
  kind: "exchange" | "tournament" | null;
  title: string;
  date: string;
  start_time: string;
  place: string;
  courts: number;
  minutes_per_match: number;
  after_note: string;
  players: Player[];
  rounds: Round[];
  matches: Match[];
  rules: unknown;
  teams: TeamEntry[] | null;
  config: Record<string, unknown> | null; // 토너먼트 설정 (gamesToWin, timeTbd, beforeNote)
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
    matches: row.matches ?? [],
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
    teams: row.teams ?? [],
    roster: Array.isArray(cfg.roster) ? (cfg.roster as unknown[]).filter((x): x is string => typeof x === "string") : [],
    beforeNote: typeof cfg.beforeNote === "string" ? cfg.beforeNote : "",
    afterNote: row.after_note ?? "",
    rules: normalizeRules(row.rules),
  };
}

const EVENT_COLUMNS =
  "id, kind, title, date, start_time, place, courts, minutes_per_match, after_note, players, rounds, matches, rules, teams, config";

export type AnyTennisEvent = TennisEvent | TournamentEvent;

export function isTournament(event: AnyTennisEvent): event is TournamentEvent {
  return (event as TournamentEvent).kind === "tournament";
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
  return row.kind === "tournament" ? toTournament(row) : toEvent(row);
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
