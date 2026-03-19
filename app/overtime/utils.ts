import {
  DAY_REWARD_SECONDS,
  QUARTER_DAY_REWARD_SECONDS,
  TARGET_DAY_OPTIONS,
} from "@/app/overtime/constants";
import {
  CalendarDay,
  OvertimeRecord,
  OvertimeRule,
  OvertimeSummary,
  RuleGuideItem,
} from "@/app/overtime/types";

export function createRecordId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayDateInputValue() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
}

export function parseMinuteInput(value: string) {
  if (!value.trim()) {
    return Number.NaN;
  }

  return Number.parseInt(value, 10);
}

export function formatRawDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}시간 ${minutes}분`;
}

export function formatCompactDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}분`;
  }

  if (minutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${minutes}분`;
}

export function splitMinutesToFields(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours: hours === 0 ? "" : String(hours),
    minutes: String(minutes),
  };
}

export function formatRewardDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (seconds > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }

  return `${hours}시간 ${minutes}분`;
}

export function formatDayValue(days: number) {
  return `${days.toFixed(2)}일`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function buildMonthCalendarWeeks(currentMonth: Date) {
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const weeks: Array<Array<CalendarDay | null>> = [];
  let currentWeek: Array<CalendarDay | null> = Array.from(
    { length: firstDay.getDay() },
    () => null,
  );

  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    currentWeek.push({
      dateKey: formatDateKey(date),
      dayNumber: day,
      isCurrentMonth: true,
      isToday: formatDateKey(date) === getTodayDateInputValue(),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function normalizeDurationFields(hoursValue: string, minutesValue: string) {
  const parsedHours = hoursValue.trim() ? parseMinuteInput(hoursValue) : 0;
  const parsedMinutes = minutesValue.trim()
    ? parseMinuteInput(minutesValue)
    : 0;

  if (
    Number.isNaN(parsedHours) ||
    Number.isNaN(parsedMinutes) ||
    parsedHours < 0 ||
    parsedMinutes < 0
  ) {
    return {
      hours: hoursValue,
      minutes: minutesValue,
    };
  }

  const totalMinutes = parsedHours * 60 + parsedMinutes;
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;

  if (!hoursValue.trim() && !minutesValue.trim()) {
    return {
      hours: "",
      minutes: "",
    };
  }

  return {
    hours: nextHours === 0 ? "" : String(nextHours),
    minutes: String(nextMinutes),
  };
}

export function getDurationMinutes(hoursValue: string, minutesValue: string) {
  const parsedHours = hoursValue.trim() ? parseMinuteInput(hoursValue) : 0;
  const parsedMinutes = minutesValue.trim()
    ? parseMinuteInput(minutesValue)
    : 0;

  if (
    Number.isNaN(parsedHours) ||
    Number.isNaN(parsedMinutes) ||
    parsedHours < 0 ||
    parsedMinutes < 0
  ) {
    return {
      isValid: false,
      totalMinutes: 0,
    };
  }

  return {
    isValid: true,
    totalMinutes: parsedHours * 60 + parsedMinutes,
  };
}

export function getRuleGuideItems(rule: OvertimeRule): RuleGuideItem[] {
  return TARGET_DAY_OPTIONS.map((days) => {
    const targetRewardMinutes = days * 8 * 60;
    const actualMinutesWithoutThreshold = Math.ceil(
      targetRewardMinutes / (rule.before10RewardSecondsPerMinute / 60),
    );
    const roundedMinutes =
      rule.roundingUnitMinutes > 1
        ? Math.ceil(actualMinutesWithoutThreshold / rule.roundingUnitMinutes) *
          rule.roundingUnitMinutes
        : actualMinutesWithoutThreshold;

    return {
      days,
      totalMinutes: rule.thresholdMinutes + roundedMinutes,
    };
  });
}

export function getAdditionalMinutesForRewardSeconds(
  rule: OvertimeRule,
  summary: OvertimeSummary,
  rewardSeconds: number,
  rewardSecondsPerMinute: number,
) {
  if (rewardSeconds <= 0) {
    return 0;
  }

  const rawMinutesNeeded = Math.ceil(rewardSeconds / rewardSecondsPerMinute);
  const roundedMinutesNeeded =
    rule.roundingUnitMinutes > 1
      ? Math.ceil(rawMinutesNeeded / rule.roundingUnitMinutes) *
        rule.roundingUnitMinutes
      : rawMinutesNeeded;

  return summary.remainingThresholdMinutes + roundedMinutesNeeded;
}

export function getAdditionalMinutesForTargetDays(
  rule: OvertimeRule,
  summary: OvertimeSummary,
  targetDays: number,
  rewardSecondsPerMinute: number,
) {
  const targetRewardSeconds = targetDays * DAY_REWARD_SECONDS;

  if (summary.rewardSeconds >= targetRewardSeconds) {
    return 0;
  }

  return getAdditionalMinutesForRewardSeconds(
    rule,
    summary,
    targetRewardSeconds - summary.rewardSeconds,
    rewardSecondsPerMinute,
  );
}

export function mergeRecordsByDate(records: OvertimeRecord[]) {
  const grouped = new Map<string, OvertimeRecord>();

  records.forEach((record) => {
    const existing = grouped.get(record.date);

    if (!existing) {
      grouped.set(record.date, { ...record });
      return;
    }

    grouped.set(record.date, {
      id: existing.id,
      date: existing.date,
      before10Minutes: existing.before10Minutes + record.before10Minutes,
      after10Minutes: existing.after10Minutes + record.after10Minutes,
      createdAt:
        existing.createdAt <= record.createdAt
          ? existing.createdAt
          : record.createdAt,
    });
  });

  return [...grouped.values()].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) {
      return byDate;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function buildOvertimeSummary(
  records: OvertimeRecord[],
  rule: OvertimeRule,
): OvertimeSummary {
  let remainingThresholdMinutes = rule.thresholdMinutes;
  let before10RawMinutes = 0;
  let after10RawMinutes = 0;
  let eligibleBefore10Minutes = 0;
  let eligibleAfter10Minutes = 0;

  const orderedRecords = [...records].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) {
      return byDate;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });

  orderedRecords.forEach((record) => {
    before10RawMinutes += record.before10Minutes;
    after10RawMinutes += record.after10Minutes;

    const beforeConsumed = Math.min(
      remainingThresholdMinutes,
      record.before10Minutes,
    );
    remainingThresholdMinutes -= beforeConsumed;

    const afterConsumed = Math.min(
      remainingThresholdMinutes,
      record.after10Minutes,
    );
    remainingThresholdMinutes -= afterConsumed;

    const eligibleBeforeForRecord = record.before10Minutes - beforeConsumed;
    const eligibleAfterForRecord = record.after10Minutes - afterConsumed;
    const eligibleTotalForRecord =
      eligibleBeforeForRecord + eligibleAfterForRecord;

    if (rule.roundingUnitMinutes > 1) {
      const roundedEligibleTotal =
        Math.floor(eligibleTotalForRecord / rule.roundingUnitMinutes) *
        rule.roundingUnitMinutes;
      const roundedBefore = Math.min(
        eligibleBeforeForRecord,
        roundedEligibleTotal,
      );
      const roundedAfter = Math.max(roundedEligibleTotal - roundedBefore, 0);

      eligibleBefore10Minutes += roundedBefore;
      eligibleAfter10Minutes += roundedAfter;
      return;
    }

    eligibleBefore10Minutes += eligibleBeforeForRecord;
    eligibleAfter10Minutes += eligibleAfterForRecord;
  });

  const rewardSeconds =
    eligibleBefore10Minutes * rule.before10RewardSecondsPerMinute +
    eligibleAfter10Minutes * rule.after10RewardSecondsPerMinute;
  const accruedDays = rewardSeconds / DAY_REWARD_SECONDS;
  const usableQuarterCount = Math.floor(
    rewardSeconds / QUARTER_DAY_REWARD_SECONDS,
  );
  const usableDays = usableQuarterCount * 0.25;
  const carryRewardSeconds =
    rewardSeconds - usableQuarterCount * QUARTER_DAY_REWARD_SECONDS;
  const carryDays = carryRewardSeconds / DAY_REWARD_SECONDS;
  const remainingRewardSecondsToNextQuarter =
    carryRewardSeconds === 0
      ? QUARTER_DAY_REWARD_SECONDS
      : QUARTER_DAY_REWARD_SECONDS - carryRewardSeconds;
  const remainingRewardSecondsToOneDay = Math.max(
    0,
    DAY_REWARD_SECONDS - rewardSeconds,
  );
  const baseSummary = {
    totalRawMinutes: before10RawMinutes + after10RawMinutes,
    before10RawMinutes,
    after10RawMinutes,
    remainingThresholdMinutes,
    eligibleBefore10Minutes,
    eligibleAfter10Minutes,
    rewardSeconds,
    accruedDays,
    usableDays,
    carryDays,
    carryRewardSeconds,
  };
  const summaryWithTargets = {
    ...baseSummary,
    nextQuarterBefore10Minutes: 0,
    nextQuarterAfter10Minutes: 0,
    toOneDayBefore10Minutes: 0,
    toOneDayAfter10Minutes: 0,
  };

  return {
    ...baseSummary,
    nextQuarterBefore10Minutes: getAdditionalMinutesForRewardSeconds(
      rule,
      summaryWithTargets,
      remainingRewardSecondsToNextQuarter,
      rule.before10RewardSecondsPerMinute,
    ),
    nextQuarterAfter10Minutes: getAdditionalMinutesForRewardSeconds(
      rule,
      summaryWithTargets,
      remainingRewardSecondsToNextQuarter,
      rule.after10RewardSecondsPerMinute,
    ),
    toOneDayBefore10Minutes:
      rewardSeconds >= DAY_REWARD_SECONDS
        ? 0
        : getAdditionalMinutesForRewardSeconds(
            rule,
            summaryWithTargets,
            remainingRewardSecondsToOneDay,
            rule.before10RewardSecondsPerMinute,
          ),
    toOneDayAfter10Minutes:
      rewardSeconds >= DAY_REWARD_SECONDS
        ? 0
        : getAdditionalMinutesForRewardSeconds(
            rule,
            summaryWithTargets,
            remainingRewardSecondsToOneDay,
            rule.after10RewardSecondsPerMinute,
          ),
  };
}

export function buildSummaryMessage(
  title: string,
  summary: OvertimeSummary,
  rule: OvertimeRule,
) {
  if (summary.totalRawMinutes === 0) {
    return "아직 입력된 야근 시간이 없습니다.";
  }

  const lines = [
    `✅ ${title}`,
    `📌 총 야근시간: ${formatRawDuration(summary.totalRawMinutes)}`,
    `📌 입력 분리: 10시 전 ${formatRawDuration(summary.before10RawMinutes)} / 10시 이후 ${formatRawDuration(summary.after10RawMinutes)}`,
  ];

  if (summary.rewardSeconds === 0) {
    lines.push(
      summary.remainingThresholdMinutes > 0
        ? "📌 아직 보상휴가는 발생하지 않았습니다."
        : rule.roundingUnitMinutes > 1
          ? "📌 10분 단위가 채워지면 보상 적립이 시작됩니다."
          : "📌 기준은 채웠고, 초과분부터 적립이 시작됩니다.",
      summary.remainingThresholdMinutes > 0
        ? `📌 적립 시작까지 남은 시간: ${formatRawDuration(summary.remainingThresholdMinutes)}`
        : `📌 현재 규칙: ${rule.description}`,
      "🕐 첫 0.25일 사용 가능까지 추가 필요",
      `- 10시 전만 더 하면 ${formatRawDuration(summary.nextQuarterBefore10Minutes)}`,
      `- 10시 이후만 더 하면 ${formatRawDuration(summary.nextQuarterAfter10Minutes)}`,
    );

    return lines.join("\n");
  }

  const rewardSecondsToNextQuarter =
    summary.carryRewardSeconds === 0
      ? QUARTER_DAY_REWARD_SECONDS
      : QUARTER_DAY_REWARD_SECONDS - summary.carryRewardSeconds;

  lines.push(
    `📌 보상 산정 대상: 10시 전 ${formatRawDuration(summary.eligibleBefore10Minutes)} / 10시 이후 ${formatRawDuration(summary.eligibleAfter10Minutes)}`,
    `📌 총 발생 보상시간: ${formatRewardDuration(summary.rewardSeconds)}`,
    `📌 총 발생 일수: ${formatDayValue(summary.accruedDays)}`,
    `📌 현재 사용 가능 일수: ${formatDayValue(summary.usableDays)}`,
    `📌 다음 0.25일 전까지 쌓인 보상시간: ${formatRewardDuration(summary.carryRewardSeconds)}`,
    `📌 보상시간 ${formatRewardDuration(rewardSecondsToNextQuarter)}이 더 쌓이면 0.25일을 더 얻을 수 있어요.`,
    "🕐 다음 사용 가능 0.25일까지 추가 필요",
    `- 10시 전 기준 ${formatRawDuration(summary.nextQuarterBefore10Minutes)}`,
    `- 10시 이후 기준 ${formatRawDuration(summary.nextQuarterAfter10Minutes)}`,
  );

  if (summary.usableDays < 1) {
    lines.push(
      "🕐 1.00일 사용 가능까지 추가 필요",
      `- 10시 전 기준 ${formatRawDuration(summary.toOneDayBefore10Minutes)}`,
      `- 10시 이후 기준 ${formatRawDuration(summary.toOneDayAfter10Minutes)}`,
    );
  }

  return lines.join("\n");
}

export function parseStoredRecords(storedValue: string | null) {
  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as Array<
      Partial<OvertimeRecord> & {
        hours?: number;
        minutes?: number;
      }
    >;

    return mergeRecordsByDate(
      parsed
        .map((item) => {
          const legacyMinutes =
            Number.isFinite(item.hours) && Number.isFinite(item.minutes)
              ? Number(item.hours) * 60 + Number(item.minutes)
              : 0;
          const before10Minutes = Number.isFinite(item.before10Minutes)
            ? Number(item.before10Minutes)
            : legacyMinutes;
          const after10Minutes = Number.isFinite(item.after10Minutes)
            ? Number(item.after10Minutes)
            : 0;

          if (
            typeof item.date !== "string" ||
            before10Minutes < 0 ||
            after10Minutes < 0
          ) {
            return null;
          }

          return {
            id: item.id || createRecordId(),
            date: item.date,
            before10Minutes,
            after10Minutes,
            createdAt:
              typeof item.createdAt === "string"
                ? item.createdAt
                : new Date().toISOString(),
          };
        })
        .filter((item): item is OvertimeRecord => item !== null),
    );
  } catch (error) {
    console.error("야근 기록을 불러오지 못했습니다.", error);
    return [];
  }
}
