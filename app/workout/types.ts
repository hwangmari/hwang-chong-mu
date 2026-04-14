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
  zone2: "Zone2 (유산소)",
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

export type GymEquipment = "dumbbell" | "barbell" | "kettlebell" | "plate";

export const GYM_EQUIPMENT_LABEL: Record<GymEquipment, string> = {
  dumbbell: "덤벨",
  barbell: "바벨",
  kettlebell: "케틀벨",
  plate: "원판",
};

export type GymExercise = {
  id: string;
  name: string;
  equipment?: GymEquipment;
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
  oneRepMaxKg: number;
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
