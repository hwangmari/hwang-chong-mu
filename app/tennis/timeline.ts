// 경기 순서 목록 → 코트별 진행 시간표 (순수 함수).
// 규칙: 목록 순서대로, "가장 먼저 비는 코트"에 "선수 4명이 모두 자유로울 때" 들어간다.
// 이미 시작/완료된 경기는 기록된 실제 코트·시각을 쓰고, 그 뒤 경기들의 예상 시각을 다시 계산한다.
import { toClock, toMinutes } from "./format";
import { isFinished, type Court, type Match, type ScoreMap, type TennisEvent } from "./types";

export type MatchStatus =
  | "done" // 점수 저장됨
  | "playing" // "지금 시작"을 눌러 진행 중
  | "ready" // 코트도 비고 선수도 자유로워 지금 시작할 수 있음 (행사 당일에만)
  | "waiting"; // 코트나 선수를 기다리는 중

export type MatchTiming = {
  matchNo: number;
  position: number; // 목록에서 몇 번째 (1부터)
  court: Court; // 실제 코트(시작/완료) 또는 예상 코트
  expectedStart: number; // 분 (하루 기준)
  expectedEnd: number;
  status: MatchStatus;
  waitingPlayers: string[]; // 아직 다른 경기에 묶여 있어 기다리는 선수들
};

export type CourtStatus = {
  court: Court;
  playing: Match | null; // 지금 이 코트에서 뛰는 경기
  next: Match | null; // 이 코트에 예상되는 다음 경기
  freeAt: number; // 이 코트가 비는 예상 시각(분)
};

export type Timeline = {
  byMatch: Map<number, MatchTiming>;
  courts: CourtStatus[];
  expectedEnd: number; // 마지막 경기 예상 종료(분)
  // 지금 이 선수가 뛰고 있는지 (지금 시작 버튼 활성/비활성에 씀)
  busyPlayers: Set<string>;
};

function isoToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function courtLetters(count: number): Court[] {
  return (["A", "B"] as Court[]).slice(0, Math.max(1, Math.min(2, count)));
}

export function buildTimeline(
  event: TennisEvent,
  scores: ScoreMap,
  now: number | null, // 오늘이 행사일이면 현재 시각(분), 아니면 null
): Timeline {
  const dur = event.minutesPerMatch;
  const eventStart = toMinutes(event.startTime);
  const courts = courtLetters(event.courts);
  const courtFree = new Map<Court, number>(courts.map((c) => [c, eventStart]));
  const playerFree = new Map<string, number>();
  const byMatch = new Map<number, MatchTiming>();
  const playingOn = new Map<Court, Match>();
  const nextOn = new Map<Court, Match>();
  const busyPlayers = new Set<string>();

  event.matches.forEach((match, index) => {
    const people = [...match.teamA, ...match.teamB];
    const score = scores[match.no];
    const playersAt = Math.max(eventStart, ...people.map((n) => playerFree.get(n) ?? eventStart));

    let court: Court;
    let start: number;
    let end: number;
    let status: MatchStatus;
    let waitingPlayers: string[] = [];

    if (score && isFinished(score)) {
      court = score.court ?? earliestCourt(courtFree);
      end = score.finishedAt ? isoToMinutes(score.finishedAt) : (courtFree.get(court) ?? eventStart) + dur;
      start = score.startedAt ? isoToMinutes(score.startedAt) : Math.max(eventStart, end - dur);
      status = "done";
    } else if (score?.startedAt) {
      court = score.court ?? earliestCourt(courtFree);
      start = isoToMinutes(score.startedAt);
      end = Math.max(start + dur, now ?? start + dur);
      status = "playing";
      playingOn.set(court, match);
      for (const n of people) busyPlayers.add(n);
    } else {
      court = earliestCourt(courtFree);
      const courtAt = courtFree.get(court) ?? eventStart;
      // 아직 시작 안 한 경기는 아무리 빨라도 "지금" 이후에 시작한다 (과거로 잡히면 뒤 경기까지 시작 가능으로 보임)
      start = Math.max(courtAt, playersAt, now ?? eventStart);
      end = start + dur;
      waitingPlayers = people.filter((n) => (playerFree.get(n) ?? eventStart) > courtAt);
      // 행사 당일이고 코트·선수가 지금 비어 있으면 바로 시작할 수 있는 상태
      const courtIdle = !playingOn.has(court) && courtAt <= (now ?? -1);
      status = now !== null && courtIdle && start <= now ? "ready" : "waiting";
      if (!nextOn.has(court)) nextOn.set(court, match);
    }

    byMatch.set(match.no, {
      matchNo: match.no,
      position: index + 1,
      court,
      expectedStart: start,
      expectedEnd: end,
      status,
      waitingPlayers,
    });

    courtFree.set(court, Math.max(courtFree.get(court) ?? eventStart, end));
    for (const n of people) playerFree.set(n, Math.max(playerFree.get(n) ?? eventStart, end));
  });

  const courtStatus: CourtStatus[] = courts.map((court) => ({
    court,
    playing: playingOn.get(court) ?? null,
    next: nextOn.get(court) ?? null,
    freeAt: courtFree.get(court) ?? eventStart,
  }));

  const expectedEnd = Math.max(eventStart, ...[...byMatch.values()].map((t) => t.expectedEnd));

  return { byMatch, courts: courtStatus, expectedEnd, busyPlayers };
}

function earliestCourt(courtFree: Map<Court, number>): Court {
  let best: Court = "A";
  let bestAt = Number.POSITIVE_INFINITY;
  for (const [court, at] of courtFree) {
    if (at < bestAt) {
      bestAt = at;
      best = court;
    }
  }
  return best;
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
  if (t.status === "done") return `완료 ${toClock(t.expectedEnd)} · 코트 ${t.court}`;
  if (t.status === "playing") return `진행 중 · 코트 ${t.court} · ${toClock(t.expectedStart)} 시작`;
  if (t.status === "ready") return `지금 시작 가능 · 코트 ${t.court}`;
  const who = t.waitingPlayers.length > 0 ? ` · ${t.waitingPlayers.join(", ")} 경기 끝나면` : "";
  return `예상 ${toClock(t.expectedStart)} · 코트 ${t.court}${who}`;
}
