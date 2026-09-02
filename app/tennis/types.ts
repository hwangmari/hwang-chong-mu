// 테니스 교류전 도메인 타입.
// 대진표(선수·라운드·경기)는 data.ts에 코드로 들어 있고, 점수만 저장소(tennis_scores)에 쌓인다.

export type Gender = "M" | "F";

export type MatchType = "men" | "women" | "mixed";

export type Player = {
  name: string;
  gender: Gender;
  years: number; // 구력(년)
};

export type Round = {
  no: number;
  label: string; // 예) "남자 복식 × 2"
  time: string; // 예) "10:00 — 10:45"
};

export type Match = {
  no: number; // M01 → 1
  round: number;
  court: "A" | "B";
  type: MatchType;
  teamA: [string, string]; // 선수 이름 2명
  teamB: [string, string];
};

export type TennisEvent = {
  id: string; // 저장소 키 (event_id)
  title: string;
  date: string; // 표시용
  place: string;
  minutesPerMatch: number;
  courts: number;
  afterNote: string; // 경기 후 일정 (저녁 식사 등)
  players: Player[];
  rounds: Round[];
  matches: Match[];
};

// 한 경기의 게임 스코어. 예) 6:4 → scoreA 6, scoreB 4
export type MatchScore = {
  matchNo: number;
  scoreA: number;
  scoreB: number;
};

export type ScoreMap = Record<number, MatchScore>;

// 승점 규칙: 승 3점 · 무 1점 · 패 0점 (같은 게임 수면 무승부)
export const POINTS = { win: 3, draw: 1, loss: 0 } as const;

export const MATCH_TYPE_LABEL: Record<MatchType, string> = {
  men: "남자 복식",
  women: "여자 복식",
  mixed: "혼합 복식",
};

export const MATCH_TYPE_SHORT: Record<MatchType, string> = {
  men: "남복",
  women: "여복",
  mixed: "혼복",
};

// 카드 왼쪽 띠·칩 색 (PDF 대진표 색을 따른다: 남복 남색, 여복 자주, 혼복 주황)
export const MATCH_TYPE_COLOR: Record<MatchType, string> = {
  men: "#1e3a8a",
  women: "#9f1239",
  mixed: "#ea580c",
};

export const GENDER_LABEL: Record<Gender, string> = {
  M: "남",
  F: "여",
};

export const GENDER_COLOR: Record<Gender, string> = {
  M: "#1d4ed8",
  F: "#be123c",
};

// === 집계(파생) 타입 — standings.ts가 만든다 ===

export type MatchOutcome = "win" | "draw" | "loss";

export type PlayerStanding = {
  player: Player;
  played: number; // 점수가 들어간 경기 수
  scheduled: number; // 대진표상 총 출전 경기 수
  wins: number;
  draws: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
  diff: number; // 득실
  points: number; // 승점
  rank: number;
};

// 선수 한 명의 경기 일정 한 줄 (선수 탭용)
export type PlayerMatchView = {
  match: Match;
  round: Round;
  partner: string;
  opponents: [string, string];
  side: "A" | "B";
  score: MatchScore | null;
  outcome: MatchOutcome | null;
};
