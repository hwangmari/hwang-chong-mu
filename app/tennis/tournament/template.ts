// 8팀 더블 엘리미네이션 + 순위결정전 고정 템플릿.
// 출처: 대회 운영 스펙 (63OPEN). 시간대(block)마다 동시에 진행되는 경기와 코트가 정해져 있다.
import type { ScheduleBlock, TemplateMatch } from "./types";

const seed = (n: number) => ({ kind: "seed", seed: n }) as const;
const winner = (of: number) => ({ kind: "winner", of }) as const;
const loser = (of: number) => ({ kind: "loser", of }) as const;

export const DOUBLE_ELIM_8: TemplateMatch[] = [
  // 1라운드 (전원 참가, 4경기)
  { no: 1, stage: "r1", label: "1라운드", block: 1, court: "A", a: seed(1), b: seed(2) },
  { no: 2, stage: "r1", label: "1라운드", block: 1, court: "B", a: seed(3), b: seed(4) },
  { no: 3, stage: "r1", label: "1라운드", block: 1, court: "C", a: seed(5), b: seed(6) },
  { no: 4, stage: "r1", label: "1라운드", block: 1, court: "D", a: seed(7), b: seed(8) },
  // 승자조 4강 + 패자조 1라운드
  { no: 5, stage: "wb-semi", label: "승자조 4강", block: 2, court: "A", a: winner(1), b: winner(2) },
  { no: 6, stage: "wb-semi", label: "승자조 4강", block: 2, court: "B", a: winner(3), b: winner(4) },
  { no: 7, stage: "lb-r1", label: "패자조 1R", block: 2, court: "C", a: loser(1), b: loser(2) },
  { no: 8, stage: "lb-r1", label: "패자조 1R", block: 2, court: "D", a: loser(3), b: loser(4) },
  // 승자조 결승 + 패자조 2라운드 + 7-8위전
  { no: 9, stage: "wb-final", label: "승자조 결승", block: 3, court: "A", a: winner(5), b: winner(6) },
  // 패자조 2R: 같은 조끼리 다시 붙지 않도록 엇갈려 배치
  { no: 10, stage: "lb-r2", label: "패자조 2R", block: 3, court: "B", a: winner(7), b: loser(6) },
  { no: 11, stage: "lb-r2", label: "패자조 2R", block: 3, court: "C", a: winner(8), b: loser(5) },
  { no: 12, stage: "place-7-8", label: "7-8위전", block: 3, court: "D", a: loser(7), b: loser(8) },
  // 패자조 준결승 + 5-6위전
  { no: 13, stage: "lb-semi", label: "패자조 준결승", block: 4, court: "A", a: winner(10), b: winner(11) },
  { no: 14, stage: "place-5-6", label: "5-6위전", block: 4, court: "B", a: loser(10), b: loser(11) },
  // 패자조 결승
  { no: 15, stage: "lb-final", label: "패자조 결승", block: 5, court: "A", a: winner(13), b: loser(9) },
  // 그랜드 파이널 + 3-4위전
  { no: 16, stage: "grand-final", label: "그랜드 파이널", block: 6, court: "A", a: winner(9), b: winner(15) },
  { no: 17, stage: "place-3-4", label: "3-4위전", block: 6, court: "B", a: loser(13), b: loser(15) },
  // 리셋 재경기 (패자조 출신 = 16번의 B팀이 이겼을 때만)
  { no: 18, stage: "reset", label: "리셋 재경기", block: 7, court: "A", a: winner(9), b: winner(15), conditional: "reset" },
];

// 시간대는 첫 경기 시작 시각 + 30분 단위로 계산한다 (format.ts roundTime과 같은 방식)
export const BLOCKS: Omit<ScheduleBlock, "time">[] = [
  { no: 1, title: "1라운드 (4경기)" },
  { no: 2, title: "승자조 4강 + 패자조 1R", note: "4코트 풀가동" },
  { no: 3, title: "승자조 결승 + 패자조 2R + 7-8위전", note: "4코트 풀가동" },
  { no: 4, title: "패자조 준결승 + 5-6위전", note: "A·B 코트만" },
  { no: 5, title: "패자조 결승", note: "A 코트만" },
  { no: 6, title: "그랜드 파이널 + 3-4위전", note: "A·B 코트" },
  { no: 7, title: "리셋 재경기", note: "패자조 출신이 그랜드 파이널을 이겼을 때만" },
];

export const TEAM_COUNT = 8;
export const PLAYERS_PER_TEAM = 4;
