// 일반 대회(2인 복식 팀) 도메인 타입.
// 교류전(개인 승점)·팀 토너먼트(8팀 고정 템플릿)와 달리 팀 수가 자유롭고,
// 진행 방식을 풀리그 / 조별 리그 + 결선 / 토너먼트 중에 고른다.
// 대진(matches)은 대회를 만들 때 한 번만 계산해 저장한다 — 경기 번호가 점수(tennis_scores.match_no)와 묶여 있어서다.
import type { RuleSettings } from "../rules";
import type { Court } from "../types";

export type GeneralFormat = "league" | "knockout" | "groups";

// 참가 팀 = 2인 복식 한 팀. id는 만든 뒤 절대 바뀌지 않는다 (경기가 이 id를 가리킨다)
export type GeneralTeam = {
  id: string; // "t1" ~ "t32"
  seed: number; // 1부터. 입력 순서(또는 섞은 순서) = 시드
  name: string;
  players: string[]; // 0~2명. 비어 있어도 된다
};

export type GeneralGroup = { id: string; label: string; teamIds: string[] }; // id "A"~"H"

// 경기 자리: 확정 팀 / 앞 경기 승·패 / 조 순위 / 부전승 빈자리
export type GeneralSlot =
  | { kind: "team"; teamId: string }
  | { kind: "winner"; of: number }
  | { kind: "loser"; of: number }
  | { kind: "groupRank"; group: string; rank: number }
  | { kind: "bye" };

export type GeneralStage = "league" | "group" | "ko";

export type GeneralMatch = {
  no: number; // tennis_scores.match_no. 만든 뒤 고정 (리그·조별 1번부터, 조별 대회의 결선은 1001번부터)
  stage: GeneralStage;
  round: number; // 리그·조별: 라운드 번호 / 결선: 1 = 첫 라운드
  groupId?: string; // 조별 경기일 때 "A"~"H"
  label: string; // "3라운드", "A조 2라운드", "4강", "결승", "3-4위전"
  block: number; // 동시에 진행하는 묶음 (1부터). 시간표 계산용
  court: Court; // 계획 코트 (실제 코트는 시작할 때 고른다)
  a: GeneralSlot;
  b: GeneralSlot;
};

export type GeneralSettings = {
  format: GeneralFormat;
  gamesToWin: number; // 기본 6
  useTiebreak: boolean; // 기본 true (6:5면 7점 타이브레이크)
  thirdPlace: boolean; // knockout·groups 결선의 3-4위전
  shuffled: boolean; // 만들 때 팀 순서를 섞었는지 (기록용, 화면 배지)
  groupBy: "size" | "count"; // groups 전용: 한 조 인원으로 나눌지, 조 개수로 나눌지
  groupSize: number; // 3~5
  groupCount: number; // 2~8
  advancePerGroup: 1 | 2;
  timeTbd: boolean;
  beforeNote: string;
};

export type GeneralEvent = {
  id: string;
  kind: "general";
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  place: string;
  courts: number; // 1~4
  minutesPerMatch: number;
  afterNote: string;
  teams: GeneralTeam[];
  matches: GeneralMatch[]; // 리그·조별은 만들 때 전부. 조별 대회의 결선은 나중에 뒤에 붙는다
  groups: GeneralGroup[]; // groups 모드에서만 채운다
  knockoutBuilt: boolean; // groups: 결선 대진이 이미 만들어졌는지
  settings: GeneralSettings;
  rules: RuleSettings; // 저장 호환용 (일반 대회에선 쓰지 않는다)
  builtIn?: boolean;
};

// resolve.ts가 점수와 합쳐 만드는 파생 타입
export type ResolvedGeneralMatch = {
  match: GeneralMatch;
  teamA: GeneralTeam | null;
  teamB: GeneralTeam | null;
  aLabel: string; // 팀이 아직 없을 때 "A조 1위" / "4강 1001번 승자"
  bLabel: string;
  status: "waiting" | "ready" | "playing" | "done";
  winner: GeneralTeam | null;
  loser: GeneralTeam | null;
  scoreA: number | null;
  scoreB: number | null;
};

export type TeamStanding = {
  team: GeneralTeam;
  groupId?: string;
  played: number;
  scheduled: number;
  wins: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
  diff: number;
  rank: number;
  advancing: boolean; // groups: 상위 N에 들었는지
};

export const FORMAT_LABEL: Record<GeneralFormat, string> = {
  league: "풀리그",
  groups: "조별 리그 + 결선",
  knockout: "토너먼트",
};

export const FORMAT_HINT: Record<GeneralFormat, string> = {
  league: "모든 팀이 서로 한 번씩 붙고, 승수로 순위를 매겨요.",
  groups: "조로 나눠 조별 리그를 돌고, 조에서 올라간 팀끼리 결선을 해요.",
  knockout: "한 번 지면 끝나요. 팀 수가 2의 거듭제곱이 아니면 앞 시드가 부전승으로 올라가요.",
};

// 경기 카드 왼쪽 띠 색 (교류전 MATCH_TYPE_COLOR와 같은 방식의 고정 색)
export const STAGE_COLOR: Record<GeneralStage, string> = {
  league: "#1d4ed8",
  group: "#0f766e",
  ko: "#b45309",
};

export const STAGE_LABEL: Record<GeneralStage, string> = {
  league: "리그",
  group: "조별 리그",
  ko: "결선",
};

// 조 라벨 (A~H)
export const GROUP_IDS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

// 방식별 팀 수 한계 — 풀리그 12팀(66경기)까지, 나머지는 32팀까지
export const MAX_TEAMS: Record<GeneralFormat, number> = {
  league: 12,
  knockout: 32,
  groups: 32,
};

export const MIN_TEAMS: Record<GeneralFormat, number> = {
  league: 3,
  knockout: 3,
  groups: 6,
};
