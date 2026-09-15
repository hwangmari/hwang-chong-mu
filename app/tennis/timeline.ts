// 경기 순서 목록 → 코트별 진행 시간표 (순수 함수).
// 규칙: 목록 순서대로, "가장 먼저 비는 코트"에 "선수 4명이 모두 자유로울 때" 들어간다.
// 이미 시작/완료된 경기는 기록된 실제 코트·시각을 쓰고, 그 뒤 경기들의 예상 시각을 다시 계산한다.
import { toClock, toMinutes } from "./format";
import { isFinished, type Court, type Match, type ScoreMap, type TennisEvent } from "./types";

export type MatchStatus =
  | "done" // 점수 저장됨
  | "playing" // "지금 시작"을 눌러 진행 중
  | "ready" // 빈 코트가 있고 선수 4명이 다른 경기 중이 아니라 지금 시작할 수 있음
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
  now: number | null; // 예상 시각 계산에 쓴 현재 시각(분). 행사일이 아니면 null
  clock: number; // 실제 현재 시각(분). 경과 시간 표시에 쓴다
  minutesPerMatch: number;
  occupiedCourts: Set<Court>; // 지금 경기가 진행 중인 코트
};

// 진행 중 경기의 경과 분·진행률(0~1)
export function elapsedOf(timeline: Timeline, t: MatchTiming): { minutes: number; ratio: number } | null {
  if (t.status !== "playing") return null;
  const minutes = Math.max(0, timeline.clock - t.expectedStart);
  return { minutes, ratio: Math.min(1, minutes / Math.max(1, timeline.minutesPerMatch)) };
}

// 완료된 경기의 실제 플레이 시간(분). 시작 기록이 없으면(점수만 바로 넣은 경우) null
export function playedMinutes(score: { startedAt?: string; finishedAt?: string } | null | undefined): number | null {
  if (!score?.startedAt || !score.finishedAt) return null;
  const ms = new Date(score.finishedAt).getTime() - new Date(score.startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 60000);
}

// 이 경기를 이 코트에서 지금 시작할 수 있는지
export function canStartOn(timeline: Timeline, t: MatchTiming, court: Court, people: string[]): boolean {
  if (t.status !== "ready" && t.status !== "waiting") return false;
  if (timeline.occupiedCourts.has(court)) return false;
  return people.every((n) => !timeline.busyPlayers.has(n));
}

function isoToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function courtLetters(count: number): Court[] {
  return (["A", "B", "C", "D"] as Court[]).slice(0, Math.max(1, Math.min(4, count)));
}

export function buildTimeline(
  event: TennisEvent,
  scores: ScoreMap,
  now: number | null, // 오늘이 행사일이면 현재 시각(분), 아니면 null (예상 시각 계산용)
  clock: number = new Date().getHours() * 60 + new Date().getMinutes(), // 실제 현재 시각(분)
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
  // 진행 중 경기의 선수·코트를 먼저 파악한다 (순서상 뒤에 있는 경기가 진행 중일 수도 있으므로)
  for (const match of event.matches) {
    const score = scores[match.no];
    if (score?.startedAt && !isFinished(score)) {
      for (const n of [...match.teamA, ...match.teamB]) busyPlayers.add(n);
      if (score.court) playingOn.set(score.court, match);
    }
  }
  // 1단계: 아직 시작 안 한 경기의 상태를 대진 순서대로 정한다.
  //  - 선수 4명이 모두 비어 있고 빈 코트가 있으면 '시작 가능'. 단 빈 코트 수만큼만(앞 순서부터).
  //  - 선수가 코트에 있는 경기는 코트를 잡아 두지 않는다 → 뒤 라운드 경기가 먼저 들어갈 수 있다 (2026-09-15).
  const freeCourtCount = courts.length - playingOn.size;
  let idleAhead = 0;
  const pendingStatus = new Map<number, MatchStatus>();
  for (const match of event.matches) {
    const score = scores[match.no];
    if (score && (isFinished(score) || score.startedAt)) continue;
    const playersIdle = [...match.teamA, ...match.teamB].every((n) => !busyPlayers.has(n));
    pendingStatus.set(match.no, playersIdle && idleAhead < freeCourtCount ? "ready" : "waiting");
    if (playersIdle) idleAhead += 1;
  }

  // 2단계: 시간표 흉내. 끝난/진행 중 → 시작 가능(지금 비어 있는 코트로) → 대기 순으로 코트를 배정한다.
  // 대기 경기가 먼저 코트를 잡아 두면 시작 가능한 경기가 '경기 중인 코트'로 표시되고 예상 시각이 한 경기 밀리던 문제를 막는다 (리뷰 2026-09-15).
  const rank = (m: Match) => {
    const s = pendingStatus.get(m.no);
    return s === undefined ? 0 : s === "ready" ? 1 : 2;
  };
  const ordered = event.matches.map((match, index) => ({ match, index })).sort((x, y) => rank(x.match) - rank(y.match) || x.index - y.index);

  for (const { match, index } of ordered) {
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
      end = Math.max(start + dur, now ?? clock);
      status = "playing";
      playingOn.set(court, match);
      for (const n of people) busyPlayers.add(n);
    } else {
      status = pendingStatus.get(match.no) ?? "waiting";
      // 시작 가능한 경기는 지금 비어 있는 코트 중 하나로, 대기 경기는 가장 먼저 비는 코트로
      court = status === "ready" ? earliestCourt(courtFree, courts.filter((c) => !playingOn.has(c))) : earliestCourt(courtFree);
      const courtAt = courtFree.get(court) ?? eventStart;
      // 아직 시작 안 한 경기는 아무리 빨라도 "지금" 이후에 시작한다
      start = Math.max(courtAt, playersAt, now ?? eventStart);
      end = start + dur;
      waitingPlayers = people.filter((n) => (playerFree.get(n) ?? eventStart) > courtAt);
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
  }

  const courtStatus: CourtStatus[] = courts.map((court) => ({
    court,
    playing: playingOn.get(court) ?? null,
    next: nextOn.get(court) ?? null,
    freeAt: courtFree.get(court) ?? eventStart,
  }));

  const expectedEnd = Math.max(eventStart, ...[...byMatch.values()].map((t) => t.expectedEnd));

  return {
    byMatch,
    courts: courtStatus,
    expectedEnd,
    busyPlayers,
    now,
    clock,
    minutesPerMatch: dur,
    occupiedCourts: new Set(playingOn.keys()),
  };
}

function earliestCourt(courtFree: Map<Court, number>, only?: Court[]): Court {
  let best: Court = only?.[0] ?? "A";
  let bestAt = Number.POSITIVE_INFINITY;
  for (const [court, at] of courtFree) {
    if (only && !only.includes(court)) continue;
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

// 대기 중인 경기가 왜 기다리는지 한 줄로. 카드·다음 순서 목록·위에 붙는 띠가 같은 문구를 쓴다 (2026-09-15)
export function describeWait(timeline: Timeline, t: MatchTiming, people: string[], courtCount: number): string {
  const onCourt = people.filter((n) => timeline.busyPlayers.has(n));
  if (onCourt.length > 0) return `🎾 ${onCourt.join(", ")} 경기 중 · 끝나면 시작`;
  if (timeline.occupiedCourts.size >= courtCount) return `코트가 모두 경기 중 · 비면 시작 (예상 ${toClock(t.expectedStart)})`;
  if (t.waitingPlayers.length > 0) return `${t.waitingPlayers.join(", ")} 경기 끝나면 시작 (예상 ${toClock(t.expectedStart)})`;
  return `예상 ${toClock(t.expectedStart)}`;
}

export function describeTiming(t: MatchTiming): string {
  if (t.status === "done") return `완료 ${toClock(t.expectedEnd)} · 코트 ${t.court}`;
  if (t.status === "playing") return `진행 중 · 코트 ${t.court} · ${toClock(t.expectedStart)} 시작`;
  // 아직 시작 전인 경기는 어느 코트로 갈지 정해지지 않았으므로 코트는 보여주지 않는다
  if (t.status === "ready") return "지금 시작 가능 · 빈 코트를 골라 시작하세요";
  const who = t.waitingPlayers.length > 0 ? ` · ${t.waitingPlayers.join(", ")} 경기 끝나면` : "";
  return `예상 ${toClock(t.expectedStart)}${who}`;
}
