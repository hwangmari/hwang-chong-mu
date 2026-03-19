import { OvertimeRule, OvertimeRuleId } from "@/app/overtime/types";

export const STORAGE_KEY = "nightOvertimeRecords";
export const STORAGE_MODE_KEY = "nightOvertimeStorageMode";
export const STORAGE_ROOM_KEY = "nightOvertimeRoomRef";
export const RULE_KEY = "nightOvertimeRule";
export const DAY_REWARD_SECONDS = 8 * 60 * 60;
export const QUARTER_DAY_REWARD_SECONDS = DAY_REWARD_SECONDS / 4;
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const TARGET_DAY_OPTIONS = Array.from(
  { length: 10 },
  (_, index) => index + 1,
);

export const OVERTIME_RULES: Record<OvertimeRuleId, OvertimeRule> = {
  threshold_15h: {
    id: "threshold_15h",
    label: "15시간 이후, 10시 이후 2배",
    shortLabel: "15시간 이후",
    description: "누적 15시간 초과분부터 10시 전 1.5배, 10시 이후 2배예요.",
    introDescription:
      "15시간 초과분부터 계산하고\n10시 전은 1.5배, 10시 이후는 2배로 반영해요.",
    thresholdMinutes: 15 * 60,
    before10RewardSecondsPerMinute: 90,
    after10RewardSecondsPerMinute: 120,
    roundingUnitMinutes: 1,
    guideTitle: "10시 전 1.5배 기준 휴가 가이드",
    ruleSummaryItems: [
      { label: "적립 시작 기준", value: "누적 야근 15시간 초과분부터" },
      { label: "10시 전 적립률", value: "1분당 보상 1.5분" },
      { label: "10시 이후 적립률", value: "1분당 보상 2분" },
      { label: "0.25일 사용 가능 기준", value: "보상시간 120분" },
      { label: "발생 일수 표기", value: "분 단위로 계속 누적" },
    ],
    collapsedHint:
      "보상 규칙 요약과 10시 전 1.5배 기준 휴가 가이드는 더보기로 펼쳐서 확인할 수 있어요.",
    exampleText:
      "예시: 15시간을 넘긴 뒤에는 10시 전 80분 또는 10시 이후 60분이 쌓이면 사용 가능 0.25일이 됩니다.",
  },
  from_1830: {
    id: "from_1830",
    label: "18:30부터 10분 단위 1.5배",
    shortLabel: "18:30 부터",
    description: "6시 30분부터 10분 단위로 1.5배 보상휴가가 적립돼요.",
    introDescription:
      "6시 30분부터 바로 계산하고\n10분 단위마다 1.5배 보상휴가로 반영해요.",
    thresholdMinutes: 0,
    before10RewardSecondsPerMinute: 90,
    after10RewardSecondsPerMinute: 90,
    roundingUnitMinutes: 10,
    guideTitle: "18:30 이후 1.5배 기준 휴가 가이드",
    ruleSummaryItems: [
      { label: "적립 시작 기준", value: "오후 6시 30분부터 바로 적립" },
      { label: "10시 전 적립률", value: "1분당 보상 1.5분" },
      { label: "10시 이후 적립률", value: "1분당 보상 1.5분" },
      { label: "반영 단위", value: "10분 단위로 계산" },
      { label: "발생 일수 표기", value: "분 단위로 계속 누적" },
    ],
    collapsedHint:
      "보상 규칙 요약과 18:30 이후 1.5배 기준 휴가 가이드는 더보기로 펼쳐서 확인할 수 있어요.",
    exampleText:
      "예시: 18:30 이후 실제 야근 80분이 쌓이면 120분 보상으로 계산되어 사용 가능 0.25일이 됩니다.",
  },
};
