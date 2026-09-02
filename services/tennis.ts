// 테니스 교류전 저장 (tennis_events: 대진표 / tennis_scores: 점수).
// 방 공유형 서비스(장소잡기 등)처럼 로그인 없이 링크만 있으면 누구나 점수를 넣는다.
// 표는 anon permissive 정책 — 실제 통제는 "링크를 아는 사람만"이라는 전제.
import { supabase } from "@/lib/supabase";
import type {
  Match,
  MatchScore,
  Player,
  Round,
  TennisEvent,
} from "@/app/tennis/types";

// === 점수 ===

type ScoreRow = {
  event_id: string;
  match_no: number;
  score_a: number;
  score_b: number;
  finished_at: string | null;
};

function toScore(row: ScoreRow): MatchScore {
  return {
    matchNo: row.match_no,
    scoreA: row.score_a,
    scoreB: row.score_b,
    finishedAt: row.finished_at ?? undefined,
  };
}

export async function fetchTennisScores(eventId: string): Promise<MatchScore[]> {
  const { data, error } = await supabase
    .from("tennis_scores")
    .select("event_id, match_no, score_a, score_b, finished_at")
    .eq("event_id", eventId)
    .order("match_no", { ascending: true });
  if (error) throw error;
  return (data as ScoreRow[] | null)?.map(toScore) ?? [];
}

// finished_at은 payload에 넣지 않는다 → 처음 저장할 때만 기본값(now)이 들어가고, 점수를 고쳐도 유지된다
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
  };
}

const EVENT_COLUMNS =
  "id, title, date, start_time, place, courts, minutes_per_match, after_note, players, rounds, matches";

export async function fetchTennisEvent(id: string): Promise<TennisEvent | null> {
  const { data, error } = await supabase
    .from("tennis_events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toEvent(data as EventRow) : null;
}

export type NewTennisEvent = Omit<TennisEvent, "id" | "builtIn">;

export async function createTennisEvent(input: NewTennisEvent): Promise<TennisEvent> {
  const { data, error } = await supabase
    .from("tennis_events")
    .insert({
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
    })
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
