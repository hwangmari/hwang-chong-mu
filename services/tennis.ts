// 테니스 교류전 점수 저장 (tennis_scores).
// 방 공유형 서비스(장소잡기 등)처럼 로그인 없이 링크만 있으면 누구나 점수를 넣는다.
// 표는 anon permissive 정책 — 실제 통제는 "링크를 아는 사람만"이라는 전제.
import { supabase } from "@/lib/supabase";
import type { MatchScore } from "@/app/tennis/types";

type Row = {
  event_id: string;
  match_no: number;
  score_a: number;
  score_b: number;
};

function toScore(row: Row): MatchScore {
  return { matchNo: row.match_no, scoreA: row.score_a, scoreB: row.score_b };
}

export async function fetchTennisScores(eventId: string): Promise<MatchScore[]> {
  const { data, error } = await supabase
    .from("tennis_scores")
    .select("event_id, match_no, score_a, score_b")
    .eq("event_id", eventId)
    .order("match_no", { ascending: true });
  if (error) throw error;
  return (data as Row[] | null)?.map(toScore) ?? [];
}

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
