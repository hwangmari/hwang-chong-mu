// 대진표 데이터. 출처: "한화시스템x한화생명 교류전.pdf" (검증 완료본, 2026-09-19)
// 새 교류전이 생기면 이 파일에 이벤트를 하나 더 추가하고 EVENTS에 넣는다.
import type { Match, Player, Round, TennisEvent } from "./types";

const PLAYERS: Player[] = [
  // 남자 12명 (각 3회 출전)
  { name: "박종연", gender: "M", years: 10 },
  { name: "이용훈", gender: "M", years: 7 },
  { name: "이민재", gender: "M", years: 3 },
  { name: "이창호", gender: "M", years: 3 },
  { name: "박철용", gender: "M", years: 2.5 },
  { name: "김동현", gender: "M", years: 2 },
  { name: "이광오", gender: "M", years: 2 },
  { name: "남계승", gender: "M", years: 1.5 },
  { name: "정현일", gender: "M", years: 3 },
  { name: "손종일", gender: "M", years: 3 },
  { name: "이필환", gender: "M", years: 2 },
  { name: "차종근", gender: "M", years: 1 },
  // 여자 7명 (각 4회 출전)
  { name: "서지수", gender: "F", years: 4 },
  { name: "안혜림", gender: "F", years: 1.5 },
  { name: "남희수", gender: "F", years: 3 },
  { name: "황혜경", gender: "F", years: 2 },
  { name: "이준영", gender: "F", years: 2 },
  { name: "이선민", gender: "F", years: 1 },
  { name: "정해인", gender: "F", years: 1 },
];

const ROUNDS: Round[] = [
  { no: 1, label: "남자 복식 × 2", time: "10:00 — 10:45" },
  { no: 2, label: "여자 복식 + 남자 복식", time: "10:45 — 11:30" },
  { no: 3, label: "여자 복식 + 남자 복식", time: "11:30 — 12:15" },
  { no: 4, label: "혼합 복식 × 2", time: "12:15 — 13:00" },
  { no: 5, label: "혼합 복식 × 2", time: "13:00 — 13:45" },
  { no: 6, label: "혼합 복식 × 2", time: "13:45 — 14:30" },
  { no: 7, label: "혼합 복식 × 2", time: "14:30 — 15:15" },
  { no: 8, label: "혼합 복식 × 2", time: "15:15 — 16:00" },
];

const MATCHES: Match[] = [
  { no: 1, round: 1, court: "A", type: "men", teamA: ["박종연", "이용훈"], teamB: ["정현일", "손종일"] },
  { no: 2, round: 1, court: "B", type: "men", teamA: ["이민재", "남계승"], teamB: ["이창호", "이광오"] },
  { no: 3, round: 2, court: "A", type: "women", teamA: ["서지수", "이선민"], teamB: ["남희수", "안혜림"] },
  { no: 4, round: 2, court: "B", type: "men", teamA: ["박철용", "김동현"], teamB: ["손종일", "이필환"] },
  { no: 5, round: 3, court: "A", type: "women", teamA: ["안혜림", "정해인"], teamB: ["황혜경", "이준영"] },
  { no: 6, round: 3, court: "B", type: "men", teamA: ["박종연", "이필환"], teamB: ["이용훈", "차종근"] },
  { no: 7, round: 4, court: "A", type: "mixed", teamA: ["이민재", "이선민"], teamB: ["박철용", "서지수"] },
  { no: 8, round: 4, court: "B", type: "mixed", teamA: ["이광오", "이준영"], teamB: ["손종일", "남희수"] },
  { no: 9, round: 5, court: "A", type: "mixed", teamA: ["김동현", "황혜경"], teamB: ["정현일", "정해인"] },
  { no: 10, round: 5, court: "B", type: "mixed", teamA: ["남계승", "서지수"], teamB: ["이창호", "안혜림"] },
  { no: 11, round: 6, court: "A", type: "mixed", teamA: ["이용훈", "안혜림"], teamB: ["이민재", "황혜경"] },
  { no: 12, round: 6, court: "B", type: "mixed", teamA: ["박종연", "서지수"], teamB: ["이창호", "남희수"] },
  { no: 13, round: 7, court: "A", type: "mixed", teamA: ["김동현", "이준영"], teamB: ["이필환", "황혜경"] },
  { no: 14, round: 7, court: "B", type: "mixed", teamA: ["이광오", "정해인"], teamB: ["차종근", "이선민"] },
  { no: 15, round: 8, court: "A", type: "mixed", teamA: ["박철용", "남희수"], teamB: ["남계승", "이준영"] },
  { no: 16, round: 8, court: "B", type: "mixed", teamA: ["정현일", "이선민"], teamB: ["차종근", "정해인"] },
];

export const HANWHA_2026_09: TennisEvent = {
  id: "hanwha-2026-09-19",
  title: "한화시스템 × 한화생명 테니스 교류전",
  date: "2026-09-19",
  startTime: "10:00",
  place: "상천체육문화연수원",
  minutesPerMatch: 45,
  courts: 2,
  afterNote: "16:00 경기 종료 → 샤워 & 정리 → 17:00~ 저녁 식사 (19명 전원)",
  players: PLAYERS,
  rounds: ROUNDS,
  matches: MATCHES,
  builtIn: true,
};

export const EVENTS: TennisEvent[] = [HANWHA_2026_09];

export function findBuiltInEvent(id: string): TennisEvent | null {
  return EVENTS.find((event) => event.id === id) ?? null;
}

export function matchLabel(no: number) {
  return `M${String(no).padStart(2, "0")}`;
}
