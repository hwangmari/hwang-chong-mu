export type WorkoutRoom = {
  id: string;
  name: string;
  createdAt: string;
};

export type WorkoutSession = {
  roomId: string;
  roomName: string;
  password: string;
};

// =========================
// 러닝
// =========================
export type RunningType =
  | "zone2"
  | "interval"
  | "lsd"
  | "tempo"
  | "easy"
  | "race"
  | "other";

export const RUNNING_TYPE_LABEL: Record<RunningType, string> = {
  zone2: "zone2런",
  interval: "인터벌",
  lsd: "LSD (장거리)",
  tempo: "템포런",
  easy: "가볍게",
  race: "대회",
  other: "기타",
};

export type RunningEnvironment = "outdoor" | "indoor";

export const RUNNING_ENVIRONMENT_LABEL: Record<RunningEnvironment, string> = {
  outdoor: "실외",
  indoor: "실내 (러닝머신)",
};

// 실외는 거리 기준, 실내(트레드밀)는 속도+경사도+시간 기준으로 기록.
// 모든 필드는 optional 이어서 두 시나리오 모두 표현 가능.
export type RunningInterval = {
  id: string;
  distanceKm?: number;
  durationSec: number;
  speedKmh?: number;
  inclineLevel?: number;
  paceSec?: number;
  heartRate?: number;
};

export type RunningRecord = {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  runType: RunningType;
  environment: RunningEnvironment;
  distanceKm: number;
  durationSec: number;
  avgPaceSec?: number;
  avgHeartRate?: number;
  avgCadence?: number;
  calories?: number;
  intervals?: RunningInterval[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

// =========================
// 헬스 (웨이트)
// =========================
export type GymBodyPart =
  | "chest"
  | "back"
  | "shoulder"
  | "leg"
  | "arm"
  | "abs"
  | "fullbody"
  | "other";

export const GYM_BODY_PART_LABEL: Record<GymBodyPart, string> = {
  chest: "가슴",
  back: "등",
  shoulder: "어깨",
  leg: "하체",
  arm: "팔",
  abs: "복근",
  fullbody: "전신",
  other: "기타",
};

export type GymSetType = "normal" | "warmup" | "drop" | "failure";

export const GYM_SET_TYPE_LABEL: Record<GymSetType, string> = {
  normal: "본세트",
  warmup: "워밍업",
  drop: "드랍셋",
  failure: "실패까지",
};

export type GymDropSet = {
  weight: number;
  reps: number;
};

export type GymSet = {
  id: string;
  weight: number;
  reps: number;
  type: GymSetType;
  dropSets?: GymDropSet[];
  note?: string;
};

export type GymEquipment =
  | "dumbbell"
  | "barbell"
  | "kettlebell"
  | "plate"
  | "cable"
  | "medicineball";

export const GYM_EQUIPMENT_LABEL: Record<GymEquipment, string> = {
  dumbbell: "덤벨",
  barbell: "바벨",
  kettlebell: "케틀벨",
  plate: "원판",
  cable: "케이블",
  medicineball: "메디신볼",
};

export type GymExercise = {
  id: string;
  name: string;
  equipment?: GymEquipment;
  // 양쪽 합산 계수 — 덤벨/레그프레스처럼 양쪽에 같은 무게가 걸리는 운동은 2.
  // 미지정 시 1로 간주 (이전 기록 호환).
  sideCount?: number;
  sets: GymSet[];
};

export type GymRecord = {
  id: string;
  roomId: string;
  date: string;
  bodyPart?: GymBodyPart;
  durationMin?: number;
  calories?: number;
  avgHeartRate?: number;
  exercises: GymExercise[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

// 자주 쓰는 웨이트 루틴 (저장/불러오기)
export type WorkoutRoutine = {
  id: string;
  roomId: string;
  name: string;
  bodyPart?: GymBodyPart;
  exercises: GymExercise[];
  createdAt: string;
  updatedAt: string;
};

// =========================
// 활동 (자전거·테니스·등산 등 기타 스포츠)
// =========================
export type ActivityRecord = {
  id: string;
  roomId: string;
  date: string;
  activityName: string;
  durationMin?: number;
  calories?: number;
  avgHeartRate?: number;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

// 프리셋 종목 목록 (폼에서 빠르게 고를 수 있게)
export const ACTIVITY_PRESETS: string[] = [
  "자전거",
  "등산",
  "테니스",
  "배드민턴",
  "수영",
  "요가",
  "필라테스",
  "클라이밍",
  "골프",
  "탁구",
  "볼링",
  "스키",
  "서핑",
  "축구",
  "농구",
  "스쿼시",
  "복싱",
  "크로스핏",
  "스피닝",
];

// 종목별 이모지 매핑 — 직접 입력한 종목도 부분 매칭으로 잡아냄
const ACTIVITY_EMOJI_MAP: Record<string, string> = {
  자전거: "🚴",
  사이클: "🚴",
  라이딩: "🚴",
  등산: "🥾",
  하이킹: "🥾",
  트레킹: "🥾",
  러닝: "🏃",
  걷기: "🚶",
  산책: "🚶",
  테니스: "🎾",
  배드민턴: "🏸",
  스쿼시: "🥎",
  탁구: "🏓",
  수영: "🏊",
  다이빙: "🤿",
  서핑: "🏄",
  요가: "🧘",
  필라테스: "🤸",
  스트레칭: "🤸",
  클라이밍: "🧗",
  볼더링: "🧗",
  골프: "⛳",
  볼링: "🎳",
  스키: "⛷️",
  스노보드: "🏂",
  보드: "🏂",
  스케이트: "⛸️",
  축구: "⚽",
  농구: "🏀",
  야구: "⚾",
  배구: "🏐",
  럭비: "🏉",
  하키: "🏒",
  복싱: "🥊",
  주짓수: "🥋",
  태권도: "🥋",
  유도: "🥋",
  무에타이: "🥋",
  크로스핏: "🏋️",
  스피닝: "🚴",
  헬스: "🏋️",
  웨이트: "🏋️",
  카약: "🛶",
  카누: "🛶",
  조정: "🚣",
  말타기: "🐎",
  승마: "🐎",
  댄스: "💃",
  발레: "🩰",
  줄넘기: "🪢",
};

const DEFAULT_ACTIVITY_EMOJI = "🤸";

export function getActivityEmoji(activityName: string): string {
  const name = activityName?.trim();
  if (!name) return DEFAULT_ACTIVITY_EMOJI;
  if (ACTIVITY_EMOJI_MAP[name]) return ACTIVITY_EMOJI_MAP[name];
  // 부분 매칭 — "산악자전거" → 자전거, "실내클라이밍" → 클라이밍
  for (const key of Object.keys(ACTIVITY_EMOJI_MAP)) {
    if (name.includes(key)) return ACTIVITY_EMOJI_MAP[key];
  }
  return DEFAULT_ACTIVITY_EMOJI;
}

// =========================
// 파생 통계 타입
// =========================
export type WeeklySummary = {
  weekStart: string;
  runCount: number;
  runDistanceKm: number;
  runDurationSec: number;
  gymCount: number;
  gymVolumeKg: number;
};

export type ExercisePR = {
  exerciseName: string;
  achievedAt: string;
  weight: number;
  reps: number;
};

export type RunningBest = {
  longestDistanceKm: number;
  longestAt: string;
  bestPaceSec: number;
  bestPaceAt: string;
};
