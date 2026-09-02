// 날짜·시간 표시 도우미 (순수 함수)
import type { MatchType, TennisEvent } from "./types";
import { MATCH_TYPE_LABEL } from "./types";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

// "HH:mm" → 분
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 분 → "HH:mm"
export function toClock(minutes: number): string {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 라운드별 "10:00 — 10:45" 문자열
export function roundTime(startTime: string, minutesPerMatch: number, roundIndex: number) {
  const start = toMinutes(startTime) + roundIndex * minutesPerMatch;
  return `${toClock(start)} — ${toClock(start + minutesPerMatch)}`;
}

export function endTime(event: Pick<TennisEvent, "startTime" | "minutesPerMatch" | "rounds">) {
  return toClock(toMinutes(event.startTime) + event.rounds.length * event.minutesPerMatch);
}

// "2026-09-19" → "2026. 09. 19 (토)"
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const weekday = WEEKDAY[new Date(y, m - 1, d).getDay()];
  return `${y}. ${String(m).padStart(2, "0")}. ${String(d).padStart(2, "0")} (${weekday})`;
}

// "2026. 09. 19 (토) 10:00 — 16:00"
export function formatEventDate(event: TennisEvent): string {
  return `${formatDate(event.date)} ${event.startTime} — ${endTime(event)}`;
}

// 한 라운드의 종목 구성 → "남자 복식 × 2", "여자 복식 + 남자 복식"
export function roundLabel(types: MatchType[]): string {
  const counts = new Map<MatchType, number>();
  for (const type of types) counts.set(type, (counts.get(type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([type, n]) => (n > 1 ? `${MATCH_TYPE_LABEL[type]} × ${n}` : MATCH_TYPE_LABEL[type]))
    .join(" + ");
}
