export type InBodyMetricKey =
  | "weight"
  | "skeletalMuscle"
  | "bodyFatMass"
  | "bmr"
  | "bmi"
  | "bodyFatPct"
  | "abdominalFatRatio"
  | "visceralFatLevel";

export type InBodyRoom = {
  id: string;
  name: string;
  createdAt: string;
};

export type InBodySession = {
  roomId: string;
  roomName: string;
  password: string;
};

export type InBodyRecord = {
  id: string;
  roomId: string;
  date: string;
  weight?: number;
  skeletalMuscle?: number;
  bodyFatMass?: number;
  bmr?: number;
  bmi?: number;
  bodyFatPct?: number;
  abdominalFatRatio?: number;
  visceralFatLevel?: number;
  memo?: string;
  createdAt: string;
};

export const METRIC_KEYS: InBodyMetricKey[] = [
  "weight",
  "skeletalMuscle",
  "bodyFatMass",
  "bmi",
  "bodyFatPct",
  "abdominalFatRatio",
  "visceralFatLevel",
  "bmr",
];

export const METRIC_LABEL: Record<InBodyMetricKey, string> = {
  weight: "체중",
  skeletalMuscle: "골격근량",
  bodyFatMass: "체지방량",
  bmr: "기초대사량",
  bmi: "BMI",
  bodyFatPct: "체지방률",
  abdominalFatRatio: "복부지방률",
  visceralFatLevel: "내장지방레벨",
};

export const METRIC_UNIT: Record<InBodyMetricKey, string> = {
  weight: "kg",
  skeletalMuscle: "kg",
  bodyFatMass: "kg",
  bmr: "kcal",
  bmi: "kg/m²",
  bodyFatPct: "%",
  abdominalFatRatio: "",
  visceralFatLevel: "Lv",
};

export const METRIC_COLOR: Record<InBodyMetricKey, string> = {
  weight: "#607de0",
  skeletalMuscle: "#1f8a54",
  bodyFatMass: "#d04a73",
  bmr: "#f59e0b",
  bmi: "#7c6ae0",
  bodyFatPct: "#e07a3a",
  abdominalFatRatio: "#3aa6c4",
  visceralFatLevel: "#9aa3b2",
};

// 변동의 "좋은 방향" 정의 (변화량 색상에 사용)
//   up = 늘어나면 좋음, down = 줄어들면 좋음, neutral = 단순 표시
export const METRIC_GOOD_DIRECTION: Record<
  InBodyMetricKey,
  "up" | "down" | "neutral"
> = {
  weight: "neutral",
  skeletalMuscle: "up",
  bodyFatMass: "down",
  bmr: "up",
  bmi: "neutral",
  bodyFatPct: "down",
  abdominalFatRatio: "down",
  visceralFatLevel: "down",
};

export const METRIC_STEP: Record<InBodyMetricKey, string> = {
  weight: "0.1",
  skeletalMuscle: "0.1",
  bodyFatMass: "0.1",
  bmr: "1",
  bmi: "0.1",
  bodyFatPct: "0.1",
  abdominalFatRatio: "0.01",
  visceralFatLevel: "1",
};

export const METRIC_DECIMALS: Record<InBodyMetricKey, number> = {
  weight: 1,
  skeletalMuscle: 1,
  bodyFatMass: 1,
  bmr: 0,
  bmi: 1,
  bodyFatPct: 1,
  abdominalFatRatio: 2,
  visceralFatLevel: 0,
};

export type VisibleMap = Record<InBodyMetricKey, boolean>;

export const DEFAULT_VISIBLE: VisibleMap = {
  weight: true,
  skeletalMuscle: true,
  bodyFatMass: true,
  bmr: false,
  bmi: false,
  bodyFatPct: true,
  abdominalFatRatio: false,
  visceralFatLevel: false,
};
