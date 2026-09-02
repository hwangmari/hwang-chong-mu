// 팀 토너먼트(더블 엘리미네이션) 도메인 타입.
// 교류전(TennisEvent)과 달리 "팀"이 참가 단위이고, 대진은 고정 템플릿(template.ts)에서 앞 경기 결과로 채워진다.
import type { RuleSettings } from "../rules";

export type TeamPlayer = {
  name: string;
  seed: 1 | 2 | 3 | 4; // 팀 내 시드
};

export type TeamEntry = {
  seed: number; // 팀 간 시드 1~8 (대진표 자리)
  name: string;
  players: TeamPlayer[]; // 4명
};

// 경기 자리에 누가 오는지: 시드팀 / 앞 경기 승자 / 앞 경기 패자
export type SlotRef =
  | { kind: "seed"; seed: number }
  | { kind: "winner"; of: number }
  | { kind: "loser"; of: number };

export type Stage =
  | "r1" // 1라운드
  | "wb-semi" // 승자조 4강
  | "wb-final" // 승자조 결승
  | "lb-r1" // 패자조 1라운드
  | "lb-r2" // 패자조 2라운드
  | "lb-semi" // 패자조 준결승
  | "lb-final" // 패자조 결승
  | "grand-final" // 그랜드 파이널
  | "reset" // 리셋 재경기 (패자조 출신이 그랜드 파이널을 이기면)
  | "place-7-8"
  | "place-5-6"
  | "place-3-4";

export type TemplateMatch = {
  no: number;
  stage: Stage;
  label: string; // 예) "승자조 4강"
  block: number; // 같은 시간대(동시 진행) 묶음 번호 (1부터)
  court: "A" | "B" | "C" | "D";
  a: SlotRef;
  b: SlotRef;
  // 리셋 재경기는 조건부: 그랜드 파이널을 패자조 출신이 이겼을 때만 열린다
  conditional?: "reset";
};

export type ScheduleBlock = {
  no: number;
  title: string; // 예) "승자조 4강 + 패자조 1R"
  time: string; // "13:30 — 14:00"
  note?: string;
};

export type TournamentEvent = {
  id: string;
  kind: "tournament";
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // 첫 경기 시작 HH:mm (개회식은 그 전)
  timeTbd: boolean; // 시간 미정 표시
  place: string;
  minutesPerMatch: number; // 30
  gamesToWin: number; // 6
  courts: number; // 4
  teams: TeamEntry[]; // 8팀
  beforeNote: string; // 개회식/몸풀기
  afterNote: string; // 시상식/폐회식
  rules: RuleSettings; // 저장 호환용 (토너먼트에선 쓰지 않음)
  builtIn?: boolean;
};

// 해석된 경기: 템플릿 + 지금까지 결과로 채운 팀
export type ResolvedMatch = {
  template: TemplateMatch;
  teamA: TeamEntry | null;
  teamB: TeamEntry | null;
  aLabel: string; // 팀이 아직 없을 때 "1라운드 1경기 승자" 같은 설명
  bLabel: string;
  status: "hidden" | "waiting" | "ready" | "playing" | "done";
  winner: TeamEntry | null;
  loser: TeamEntry | null;
  scoreA: number | null;
  scoreB: number | null;
};

export type Placement = { rank: number; team: TeamEntry | null; how: string };

// 매치 내 페어 교체 규칙 (4게임 단위, A→B→C 고정)
export const PAIR_ROTATION: { key: "A" | "B" | "C"; seeds: [1 | 2 | 3 | 4, 1 | 2 | 3 | 4]; games: string }[] = [
  { key: "A", seeds: [2, 4], games: "1~4게임" },
  { key: "B", seeds: [1, 3], games: "5~8게임" },
  { key: "C", seeds: [1, 2], games: "9~12게임 (연장 시)" },
];

export const STAGE_COLOR: Record<Stage, string> = {
  r1: "#1e3a8a",
  "wb-semi": "#1d4ed8",
  "wb-final": "#1d4ed8",
  "lb-r1": "#9f1239",
  "lb-r2": "#9f1239",
  "lb-semi": "#be123c",
  "lb-final": "#be123c",
  "grand-final": "#b45309",
  reset: "#b45309",
  "place-7-8": "#64748b",
  "place-5-6": "#64748b",
  "place-3-4": "#64748b",
};
