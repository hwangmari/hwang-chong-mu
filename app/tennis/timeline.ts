// 실제 진행에 맞춘 시간표 (순수 함수).
// 대진표 순서는 그대로 두고, "그 코트가 비고 + 선수 4명이 모두 자유로울 때" 다음 경기가 시작된다고 보고
// 끝난 경기의 실제 종료 시각(finishedAt)으로 남은 경기의 예상 시각을 다시 계산한다.
import { toClock, toMinutes } from "./format";
import type { Match, ScoreMap, TennisEvent } from "./types";

export type MatchStatus = "done" | "playing" | "waiting";

export type MatchTiming = {
  matchNo: number;
  plannedStart: number; // 분 (하루 기준)
  expectedStart: number;
  expectedEnd: number;
  status: MatchStatus;
  // 대기 중일 때 무엇을 기다리는지: 코트가 비길 / 선수가 오길
  waitingFor: "court" | "players" | null;
  waitingPlayers: string[]; // 다른 코트에서 아직 뛰고 있는 선수들
};

export type CourtStatus = {
  court: Match["court"];
  current: Match | null; // 진행 중이거나 곧 시작할 경기
  next: Match | null;
};

export type Timeline = {
  byMatch: Map<number, MatchTiming>;
  courts: CourtStatus[];
  // 실제 진행이 예정보다 빠른지(음수)/늦은지(양수), 마지막 경기 기준 분
  driftMinutes: number;
};

// ISO 시각 → 그날의 분. 날짜가 달라도(자정 넘김 등) 대략 맞도록 시·분만 쓴다
function isoToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function buildTimeline(
  event: TennisEvent,
  scores: ScoreMap,
  now: number | null, // 오늘이 행사일이면 현재 시각(분), 아니면 null
): Timeline {
  const dur = event.minutesPerMatch;
  const eventStart = toMinutes(event.startTime);
  const courtFree = new Map<string, number>();
  const playerFree = new Map<string, number>();
  const playerWhere = new Map<string, number>(); // 선수가 마지막으로 잡혀 있는 경기 번호
  const byMatch = new Map<number, MatchTiming>();

  const ordered = [...event.matches].sort((a, b) => a.round - b.round || a.no - b.no);

  for (const match of ordered) {
    const plannedStart = eventStart + (match.round - 1) * dur;
    const people = [...match.teamA, ...match.teamB];
    const score = scores[match.no];

    const courtAt = courtFree.get(match.court) ?? eventStart;
    const playersAt = Math.max(eventStart, ...people.map((n) => playerFree.get(n) ?? eventStart));
    let expectedStart = Math.max(courtAt, playersAt);
    let expectedEnd: number;
    let status: MatchStatus;

    if (score) {
      // 끝난 경기: 실제 종료 시각을 쓴다 (없으면 예정대로 끝났다고 본다)
      expectedEnd = score.finishedAt ? isoToMinutes(score.finishedAt) : plannedStart + dur;
      expectedStart = Math.min(expectedStart, Math.max(eventStart, expectedEnd - dur));
      status = "done";
    } else if (now !== null && expectedStart <= now) {
      // 시작할 수 있었고 아직 점수가 없으면 진행 중으로 본다
      status = "playing";
      expectedEnd = Math.max(expectedStart + dur, now);
    } else {
      status = "waiting";
      expectedEnd = expectedStart + dur;
    }

    const waitingPlayers =
      status === "waiting"
        ? people.filter((n) => (playerFree.get(n) ?? eventStart) > courtAt)
        : [];
    const waitingFor: MatchTiming["waitingFor"] =
      status !== "waiting" ? null : waitingPlayers.length > 0 ? "players" : "court";

    byMatch.set(match.no, {
      matchNo: match.no,
      plannedStart,
      expectedStart,
      expectedEnd,
      status,
      waitingFor,
      waitingPlayers,
    });

    courtFree.set(match.court, expectedEnd);
    for (const n of people) {
      playerFree.set(n, expectedEnd);
      playerWhere.set(n, match.no);
    }
  }

  const courtKeys = [...new Set(ordered.map((m) => m.court))].sort();
  const courts: CourtStatus[] = courtKeys.map((court) => {
    const pending = ordered.filter((m) => m.court === court && byMatch.get(m.no)?.status !== "done");
    return { court, current: pending[0] ?? null, next: pending[1] ?? null };
  });

  const last = ordered[ordered.length - 1];
  const lastTiming = last ? byMatch.get(last.no) : undefined;
  const driftMinutes = lastTiming
    ? lastTiming.expectedEnd - (lastTiming.plannedStart + dur)
    : 0;

  return { byMatch, courts, driftMinutes };
}

// 오늘이 행사일이면 현재 시각(분), 아니면 null
export function nowMinutesIfEventDay(eventDate: string, at = new Date()): number | null {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  if (`${y}-${m}-${d}` !== eventDate) return null;
  return at.getHours() * 60 + at.getMinutes();
}

export function describeTiming(t: MatchTiming): string {
  if (t.status === "done") return `완료 ${toClock(t.expectedEnd)}`;
  if (t.status === "playing") return `진행 중 · ${toClock(t.expectedStart)} 시작`;
  const shifted = t.expectedStart !== t.plannedStart;
  return shifted
    ? `예정 ${toClock(t.plannedStart)} → 예상 ${toClock(t.expectedStart)}`
    : `예정 ${toClock(t.plannedStart)}`;
}
