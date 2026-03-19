export type TabKey = "calculator" | "records";
export type StorageMode = "local" | "server";
export type OvertimeRuleId = "threshold_15h" | "from_1830";

export interface OvertimeRule {
  id: OvertimeRuleId;
  label: string;
  shortLabel: string;
  description: string;
  introDescription: string;
  thresholdMinutes: number;
  before10RewardSecondsPerMinute: number;
  after10RewardSecondsPerMinute: number;
  roundingUnitMinutes: number;
  guideTitle: string;
  ruleSummaryItems: Array<{
    label: string;
    value: string;
  }>;
  collapsedHint: string;
  exampleText: string;
}

export interface OvertimeRecord {
  id: string;
  date: string;
  before10Minutes: number;
  after10Minutes: number;
  createdAt: string;
}

export interface OvertimeSummary {
  totalRawMinutes: number;
  before10RawMinutes: number;
  after10RawMinutes: number;
  remainingThresholdMinutes: number;
  eligibleBefore10Minutes: number;
  eligibleAfter10Minutes: number;
  rewardSeconds: number;
  accruedDays: number;
  usableDays: number;
  carryDays: number;
  carryRewardSeconds: number;
  nextQuarterBefore10Minutes: number;
  nextQuarterAfter10Minutes: number;
  toOneDayBefore10Minutes: number;
  toOneDayAfter10Minutes: number;
}

export interface DayBucket {
  records: OvertimeRecord[];
  before10Minutes: number;
  after10Minutes: number;
}

export interface CalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface RuleGuideItem {
  days: number;
  totalMinutes: number;
}
