"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
} from "@/components/styled/layout.styled";

type TabKey = "calculator" | "records";

interface OvertimeRecord {
  id: string;
  date: string;
  before10Minutes: number;
  after10Minutes: number;
  createdAt: string;
}

interface OvertimeSummary {
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

interface DayBucket {
  records: OvertimeRecord[];
  before10Minutes: number;
  after10Minutes: number;
}

interface CalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const STORAGE_KEY = "nightOvertimeRecords";
const THRESHOLD_MINUTES = 15 * 60;
const DAY_REWARD_SECONDS = 8 * 60 * 60;
const QUARTER_DAY_REWARD_SECONDS = DAY_REWARD_SECONDS / 4;
const BEFORE10_REWARD_SECONDS_PER_MINUTE = 90;
const AFTER10_REWARD_SECONDS_PER_MINUTE = 120;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TARGET_DAY_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const BEFORE10_DAY_GUIDE = Array.from({ length: 10 }, (_, index) => {
  const days = index + 1;
  const requiredMinutes = THRESHOLD_MINUTES + days * (8 * 60) / 1.5;

  return {
    days,
    totalMinutes: Math.round(requiredMinutes),
  };
});

function createRecordId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayDateInputValue() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
}

function parseMinuteInput(value: string) {
  if (!value.trim()) {
    return NaN;
  }

  return Number.parseInt(value, 10);
}

function formatRawDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}시간 ${minutes}분`;
}

function formatCompactDuration(totalMinutes: number) {
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

function splitMinutesToFields(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours: hours === 0 ? "" : String(hours),
    minutes: String(minutes),
  };
}

function formatRewardDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (seconds > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }

  return `${hours}시간 ${minutes}분`;
}

function formatDayValue(days: number) {
  return `${days.toFixed(2)}일`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildMonthCalendarWeeks(currentMonth: Date) {
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

function normalizeDurationFields(hoursValue: string, minutesValue: string) {
  const parsedHours = hoursValue.trim() ? parseMinuteInput(hoursValue) : 0;
  const parsedMinutes = minutesValue.trim() ? parseMinuteInput(minutesValue) : 0;

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

function getDurationMinutes(hoursValue: string, minutesValue: string) {
  const parsedHours = hoursValue.trim() ? parseMinuteInput(hoursValue) : 0;
  const parsedMinutes = minutesValue.trim() ? parseMinuteInput(minutesValue) : 0;

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

function getAdditionalMinutesForTargetDays(
  summary: OvertimeSummary,
  targetDays: number,
  rewardSecondsPerMinute: number,
) {
  const targetRewardSeconds = targetDays * DAY_REWARD_SECONDS;

  if (summary.rewardSeconds >= targetRewardSeconds) {
    return 0;
  }

  const remainingRewardSeconds = targetRewardSeconds - summary.rewardSeconds;

  return (
    summary.remainingThresholdMinutes +
    Math.ceil(remainingRewardSeconds / rewardSecondsPerMinute)
  );
}

function mergeRecordsByDate(records: OvertimeRecord[]) {
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

function buildOvertimeSummary(records: OvertimeRecord[]): OvertimeSummary {
  let remainingThresholdMinutes = THRESHOLD_MINUTES;
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
    eligibleBefore10Minutes += record.before10Minutes - beforeConsumed;

    const afterConsumed = Math.min(
      remainingThresholdMinutes,
      record.after10Minutes,
    );
    remainingThresholdMinutes -= afterConsumed;
    eligibleAfter10Minutes += record.after10Minutes - afterConsumed;
  });

  const rewardSeconds =
    eligibleBefore10Minutes * BEFORE10_REWARD_SECONDS_PER_MINUTE +
    eligibleAfter10Minutes * AFTER10_REWARD_SECONDS_PER_MINUTE;
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

  return {
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
    nextQuarterBefore10Minutes:
      remainingThresholdMinutes +
      Math.ceil(
        remainingRewardSecondsToNextQuarter /
          BEFORE10_REWARD_SECONDS_PER_MINUTE,
      ),
    nextQuarterAfter10Minutes:
      remainingThresholdMinutes +
      Math.ceil(
        remainingRewardSecondsToNextQuarter /
          AFTER10_REWARD_SECONDS_PER_MINUTE,
      ),
    toOneDayBefore10Minutes:
      rewardSeconds >= DAY_REWARD_SECONDS
        ? 0
        : remainingThresholdMinutes +
          Math.ceil(
            remainingRewardSecondsToOneDay /
              BEFORE10_REWARD_SECONDS_PER_MINUTE,
          ),
    toOneDayAfter10Minutes:
      rewardSeconds >= DAY_REWARD_SECONDS
        ? 0
        : remainingThresholdMinutes +
          Math.ceil(
            remainingRewardSecondsToOneDay /
              AFTER10_REWARD_SECONDS_PER_MINUTE,
          ),
  };
}

function buildSummaryMessage(title: string, summary: OvertimeSummary) {
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
        : "📌 15시간 기준은 채웠고, 초과분부터 적립이 시작됩니다.",
      `📌 15시간 초과까지 남은 시간: ${formatRawDuration(summary.remainingThresholdMinutes)}`,
      "🕐 첫 0.25일 사용 가능까지 추가 필요",
      `- 10시 전만 더 하면 ${formatRawDuration(summary.nextQuarterBefore10Minutes)}`,
      `- 10시 이후만 더 하면 ${formatRawDuration(summary.nextQuarterAfter10Minutes)}`,
    );

    return lines.join("\n");
  }

  lines.push(
    `📌 보상 산정 대상: 10시 전 ${formatRawDuration(summary.eligibleBefore10Minutes)} / 10시 이후 ${formatRawDuration(summary.eligibleAfter10Minutes)}`,
    `📌 총 발생 보상시간: ${formatRewardDuration(summary.rewardSeconds)}`,
    `📌 총 발생 일수: ${formatDayValue(summary.accruedDays)}`,
    `📌 현재 사용 가능 일수: ${formatDayValue(summary.usableDays)}`,
    `📌 아직 못 쓰는 잔여: ${formatDayValue(summary.carryDays)} (${formatRewardDuration(summary.carryRewardSeconds)})`,
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

function parseStoredRecords(storedValue: string | null) {
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

export default function OvertimePage() {
  const todayKey = getTodayDateInputValue();
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [calcBefore10Hours, setCalcBefore10Hours] = useState("");
  const [calcBefore10Minutes, setCalcBefore10Minutes] = useState("");
  const [calcAfter10Hours, setCalcAfter10Hours] = useState("");
  const [calcAfter10Minutes, setCalcAfter10Minutes] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [calcSummary, setCalcSummary] = useState<OvertimeSummary | null>(null);
  const [calcTargetDays, setCalcTargetDays] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(() => parseDateKey(todayKey));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showWeekends, setShowWeekends] = useState(false);
  const [isRecordsExpanded, setIsRecordsExpanded] = useState(false);
  const [targetUsableDays, setTargetUsableDays] = useState(1);
  const [quickBefore10Hours, setQuickBefore10Hours] = useState("");
  const [quickBefore10Minutes, setQuickBefore10Minutes] = useState("");
  const [quickAfter10Hours, setQuickAfter10Hours] = useState("");
  const [quickAfter10Minutes, setQuickAfter10Minutes] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<OvertimeRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return parseStoredRecords(localStorage.getItem(STORAGE_KEY));
  });

  const recordSummary = useMemo(() => buildOvertimeSummary(records), [records]);
  const recordResult = useMemo(
    () => buildSummaryMessage("누적 야근 현황", recordSummary),
    [recordSummary],
  );
  const targetDayGuide = useMemo(
    () => ({
      before10Minutes: getAdditionalMinutesForTargetDays(
        recordSummary,
        targetUsableDays,
        BEFORE10_REWARD_SECONDS_PER_MINUTE,
      ),
      after10Minutes: getAdditionalMinutesForTargetDays(
        recordSummary,
        targetUsableDays,
        AFTER10_REWARD_SECONDS_PER_MINUTE,
      ),
      isReached: recordSummary.rewardSeconds >= targetUsableDays * DAY_REWARD_SECONDS,
    }),
    [recordSummary, targetUsableDays],
  );
  const calcTargetGuide = useMemo(
    () =>
      calcSummary
        ? {
            before10Minutes: getAdditionalMinutesForTargetDays(
              calcSummary,
              calcTargetDays,
              BEFORE10_REWARD_SECONDS_PER_MINUTE,
            ),
            after10Minutes: getAdditionalMinutesForTargetDays(
              calcSummary,
              calcTargetDays,
              AFTER10_REWARD_SECONDS_PER_MINUTE,
            ),
            isReached:
              calcSummary.rewardSeconds >= calcTargetDays * DAY_REWARD_SECONDS,
          }
        : null,
    [calcSummary, calcTargetDays],
  );

  const displayedRecords = useMemo(
    () =>
      [...records].sort((left, right) => {
        const byDate = right.date.localeCompare(left.date);
        if (byDate !== 0) {
          return byDate;
        }

        return right.createdAt.localeCompare(left.createdAt);
      }),
    [records],
  );

  const recordsByDate = useMemo(() => {
    const map = new Map<string, DayBucket>();

    displayedRecords.forEach((record) => {
      const bucket = map.get(record.date) || {
        records: [],
        before10Minutes: 0,
        after10Minutes: 0,
      };

      bucket.records.push(record);
      bucket.before10Minutes += record.before10Minutes;
      bucket.after10Minutes += record.after10Minutes;
      map.set(record.date, bucket);
    });

    return map;
  }, [displayedRecords]);

  const selectedDateBucket = recordsByDate.get(selectedDate);
  const calendarWeeks = useMemo(
    () => buildMonthCalendarWeeks(currentMonth),
    [currentMonth],
  );
  const visibleWeekdays = useMemo(
    () =>
      showWeekends
        ? WEEKDAYS
        : WEEKDAYS.filter((_, weekdayIndex) => weekdayIndex !== 0 && weekdayIndex !== 6),
    [showWeekends],
  );

  const applyDurationNormalization = (
    hoursValue: string,
    minutesValue: string,
    setHours: (value: string) => void,
    setMinutes: (value: string) => void,
  ) => {
    const normalized = normalizeDurationFields(hoursValue, minutesValue);
    setHours(normalized.hours);
    setMinutes(normalized.minutes);
  };

  const persistRecords = (nextRecords: OvertimeRecord[]) => {
    const mergedRecords = mergeRecordsByDate(nextRecords);
    setRecords(mergedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
  };

  const resetQuickAddForm = () => {
    setQuickBefore10Hours("");
    setQuickBefore10Minutes("");
    setQuickAfter10Hours("");
    setQuickAfter10Minutes("");
    setEditingRecordId(null);
  };

  const saveRecordEntry = ({
    targetDate,
    beforeHours,
    beforeMinutes,
    afterHours,
    afterMinutes,
    applyNormalized,
    onSaved,
    editingRecordId,
  }: {
    targetDate: string;
    beforeHours: string;
    beforeMinutes: string;
    afterHours: string;
    afterMinutes: string;
    applyNormalized?: (values: {
      beforeHours: string;
      beforeMinutes: string;
      afterHours: string;
      afterMinutes: string;
    }) => void;
    onSaved?: () => void;
    editingRecordId?: string | null;
  }) => {
    const normalizedBefore10 = normalizeDurationFields(beforeHours, beforeMinutes);
    const normalizedAfter10 = normalizeDurationFields(afterHours, afterMinutes);

    applyNormalized?.({
      beforeHours: normalizedBefore10.hours,
      beforeMinutes: normalizedBefore10.minutes,
      afterHours: normalizedAfter10.hours,
      afterMinutes: normalizedAfter10.minutes,
    });

    const before10Duration = getDurationMinutes(
      normalizedBefore10.hours,
      normalizedBefore10.minutes,
    );
    const after10Duration = getDurationMinutes(
      normalizedAfter10.hours,
      normalizedAfter10.minutes,
    );

    if (!targetDate) {
      alert("날짜를 입력해주세요.");
      return false;
    }

    if (!before10Duration.isValid || !after10Duration.isValid) {
      alert("시간과 분은 0 이상의 숫자로 입력해주세요.");
      return false;
    }

    if (
      before10Duration.totalMinutes === 0 &&
      after10Duration.totalMinutes === 0
    ) {
      alert("야근 시간은 0보다 커야 합니다.");
      return false;
    }

    const existingRecord = editingRecordId
      ? records.find((record) => record.id === editingRecordId)
      : null;
    const nextRecord: OvertimeRecord = {
      id: existingRecord?.id || createRecordId(),
      date: targetDate,
      before10Minutes: before10Duration.totalMinutes,
      after10Minutes: after10Duration.totalMinutes,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
    };

    persistRecords([
      ...records.filter((record) => record.id !== editingRecordId),
      nextRecord,
    ]);

    const recordMonth = parseDateKey(targetDate);
    setCurrentMonth(new Date(recordMonth.getFullYear(), recordMonth.getMonth(), 1));
    setSelectedDate(targetDate);
    onSaved?.();

    return true;
  };

  const handleCalculate = () => {
    const normalizedBefore10 = normalizeDurationFields(
      calcBefore10Hours,
      calcBefore10Minutes,
    );
    const normalizedAfter10 = normalizeDurationFields(
      calcAfter10Hours,
      calcAfter10Minutes,
    );

    setCalcBefore10Hours(normalizedBefore10.hours);
    setCalcBefore10Minutes(normalizedBefore10.minutes);
    setCalcAfter10Hours(normalizedAfter10.hours);
    setCalcAfter10Minutes(normalizedAfter10.minutes);

    const before10Duration = getDurationMinutes(
      normalizedBefore10.hours,
      normalizedBefore10.minutes,
    );
    const after10Duration = getDurationMinutes(
      normalizedAfter10.hours,
      normalizedAfter10.minutes,
    );

    if (!before10Duration.isValid || !after10Duration.isValid) {
      alert("시간과 분은 0 이상의 숫자로 입력해주세요.");
      return;
    }

    if (
      before10Duration.totalMinutes === 0 &&
      after10Duration.totalMinutes === 0
    ) {
      alert("야근 시간은 0보다 커야 합니다.");
      return;
    }

    const summary = buildOvertimeSummary([
      {
        id: "preview",
        date: todayKey,
        before10Minutes: before10Duration.totalMinutes,
        after10Minutes: after10Duration.totalMinutes,
        createdAt: new Date().toISOString(),
      },
    ]);

    setCalcSummary(summary);
    setCalcResult(buildSummaryMessage("계산 결과", summary));
  };

  const handleQuickAddRecord = () => {
    saveRecordEntry({
      targetDate: selectedDate,
      beforeHours: quickBefore10Hours,
      beforeMinutes: quickBefore10Minutes,
      afterHours: quickAfter10Hours,
      afterMinutes: quickAfter10Minutes,
      editingRecordId,
      applyNormalized: (values) => {
        setQuickBefore10Hours(values.beforeHours);
        setQuickBefore10Minutes(values.beforeMinutes);
        setQuickAfter10Hours(values.afterHours);
        setQuickAfter10Minutes(values.afterMinutes);
      },
      onSaved: () => {
        resetQuickAddForm();
      },
    });
  };

  const handleEditRecord = (record: OvertimeRecord) => {
    const before10 = splitMinutesToFields(record.before10Minutes);
    const after10 = splitMinutesToFields(record.after10Minutes);
    const recordDate = parseDateKey(record.date);

    setSelectedDate(record.date);
    setCurrentMonth(new Date(recordDate.getFullYear(), recordDate.getMonth(), 1));
    setQuickBefore10Hours(before10.hours);
    setQuickBefore10Minutes(before10.minutes);
    setQuickAfter10Hours(after10.hours);
    setQuickAfter10Minutes(after10.minutes);
    setEditingRecordId(record.id);
  };

  const handleDeleteRecord = (id: string) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) {
      return;
    }

    persistRecords(records.filter((record) => record.id !== id));
  };

  const handleClearRecords = () => {
    if (!window.confirm("모든 기록을 삭제하시겠습니까?")) {
      return;
    }

    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const moveMonth = (amount: number) => {
    const nextMonth = shiftMonth(currentMonth, amount);
    setCurrentMonth(nextMonth);
    setSelectedDate(formatDateKey(nextMonth));
    resetQuickAddForm();
  };

  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon="🌙"
          title="야근 계산기"
          description={
            <>
              15시간 초과분부터 계산하고
              <br />
              10시 전은 1.5배, 10시 이후는 2배로 반영해요.
            </>
          }
        />

        <SurfaceCard>
          <TabList>
            <TabButton
              type="button"
              $isActive={activeTab === "calculator"}
              onClick={() => setActiveTab("calculator")}
            >
              계산기
            </TabButton>
            <TabButton
              type="button"
              $isActive={activeTab === "records"}
              onClick={() => setActiveTab("records")}
            >
              기록
            </TabButton>
          </TabList>

          {activeTab === "calculator" ? (
            <TabPanel>
              <GuideText>
                시간/분으로 입력할 수 있어요.
                <br />
                분 칸에 `240`처럼 넣으면 포커스를 벗어날 때 자동으로 `4시간 0분`
                으로 바뀝니다.
              </GuideText>

              <SplitGrid>
                <DurationCard>
                  <FieldLabel>10시 전 야근</FieldLabel>
                  <DurationInputs>
                    <CompactInput
                      type="number"
                      min="0"
                      placeholder="시간"
                      value={calcBefore10Hours}
                      onChange={(event) =>
                        setCalcBefore10Hours(event.target.value)
                      }
                    />
                    <UnitText>시간</UnitText>
                    <CompactInput
                      type="number"
                      min="0"
                      placeholder="분"
                      value={calcBefore10Minutes}
                      onChange={(event) =>
                        setCalcBefore10Minutes(event.target.value)
                      }
                      onBlur={() =>
                        applyDurationNormalization(
                          calcBefore10Hours,
                          calcBefore10Minutes,
                          setCalcBefore10Hours,
                          setCalcBefore10Minutes,
                        )
                      }
                    />
                    <UnitText>분</UnitText>
                  </DurationInputs>
                </DurationCard>

                <DurationCard>
                  <FieldLabel>10시 이후 야근</FieldLabel>
                  <DurationInputs>
                    <CompactInput
                      type="number"
                      min="0"
                      placeholder="시간"
                      value={calcAfter10Hours}
                      onChange={(event) =>
                        setCalcAfter10Hours(event.target.value)
                      }
                    />
                    <UnitText>시간</UnitText>
                    <CompactInput
                      type="number"
                      min="0"
                      placeholder="분"
                      value={calcAfter10Minutes}
                      onChange={(event) =>
                        setCalcAfter10Minutes(event.target.value)
                      }
                      onBlur={() =>
                        applyDurationNormalization(
                          calcAfter10Hours,
                          calcAfter10Minutes,
                          setCalcAfter10Hours,
                          setCalcAfter10Minutes,
                        )
                      }
                    />
                    <UnitText>분</UnitText>
                  </DurationInputs>
                </DurationCard>
              </SplitGrid>

              <PrimaryButton type="button" onClick={handleCalculate}>
                계산하기
              </PrimaryButton>

              <ResultBox>
                {calcResult || "10시 전/이후 야근 시간을 입력하고 계산해보세요."}
              </ResultBox>

              {calcSummary && calcSummary.totalRawMinutes > 0 && calcTargetGuide && (
                <NoticeCard>
                  <NoticeHeader>
                    <strong>
                      {calcTargetDays.toFixed(2)}일 사용 가능까지 더 필요해요
                    </strong>
                    <TargetDayTabs>
                      {TARGET_DAY_OPTIONS.map((option) => (
                        <TargetDayButton
                          key={`calc-${option}`}
                          type="button"
                          $isActive={calcTargetDays === option}
                          onClick={() => setCalcTargetDays(option)}
                        >
                          {option}일
                        </TargetDayButton>
                      ))}
                    </TargetDayTabs>
                  </NoticeHeader>
                  {calcTargetGuide.isReached ? (
                    <span>
                      이미 {calcTargetDays.toFixed(2)}일 이상 사용 가능한 상태예요.
                    </span>
                  ) : (
                    <>
                      <span>
                        10시 전만 추가하면{" "}
                        {formatRawDuration(calcTargetGuide.before10Minutes)}
                      </span>
                      <span>
                        10시 이후만 추가하면{" "}
                        {formatRawDuration(calcTargetGuide.after10Minutes)}
                      </span>
                    </>
                  )}
                </NoticeCard>
              )}
            </TabPanel>
          ) : (
            <TabPanel>
              <StatsRow>
                <StatCard>
                  <span>저장된 기록</span>
                  <strong>{records.length}건</strong>
                </StatCard>
                <StatCard>
                  <span>누적 야근시간</span>
                  <strong>{formatRawDuration(recordSummary.totalRawMinutes)}</strong>
                </StatCard>
                <StatCard>
                  <span>사용 가능 일수</span>
                  <strong>{formatDayValue(recordSummary.usableDays)}</strong>
                </StatCard>
              </StatsRow>

              {recordSummary.totalRawMinutes > 0 && (
                <NoticeCard>
                  <NoticeHeader>
                    <strong>{targetUsableDays.toFixed(2)}일 사용 가능까지 더 필요해요</strong>
                    <TargetDayTabs>
                      {TARGET_DAY_OPTIONS.map((option) => (
                        <TargetDayButton
                          key={option}
                          type="button"
                          $isActive={targetUsableDays === option}
                          onClick={() => setTargetUsableDays(option)}
                        >
                          {option}일
                        </TargetDayButton>
                      ))}
                    </TargetDayTabs>
                  </NoticeHeader>
                  {targetDayGuide.isReached ? (
                    <span>
                      이미 {targetUsableDays.toFixed(2)}일 이상 사용 가능한 상태예요.
                    </span>
                  ) : (
                    <>
                      <span>
                        10시 전만 추가하면{" "}
                        {formatRawDuration(targetDayGuide.before10Minutes)}
                      </span>
                      <span>
                        10시 이후만 추가하면{" "}
                        {formatRawDuration(targetDayGuide.after10Minutes)}
                      </span>
                    </>
                  )}
                </NoticeCard>
              )}

              <ResultBox>{recordResult}</ResultBox>

              <SectionDivider />

              <SectionHeader>
                <SectionTitle>야근 기록 캘린더</SectionTitle>
                <CalendarToolbar>
                  <CalendarNavButton
                    type="button"
                    onClick={() => moveMonth(-1)}
                  >
                    이전
                  </CalendarNavButton>
                  <CalendarMonthLabel>
                    {formatMonthLabel(currentMonth)}
                  </CalendarMonthLabel>
                  <CalendarNavButton
                    type="button"
                    onClick={() => moveMonth(1)}
                  >
                    다음
                  </CalendarNavButton>
                  <TodayButton
                    type="button"
                    onClick={() => {
                      const todayDate = parseDateKey(todayKey);
                      setCurrentMonth(todayDate);
                      setSelectedDate(todayKey);
                      resetQuickAddForm();
                    }}
                  >
                    오늘
                  </TodayButton>
                  <WeekendToggleButton
                    type="button"
                    $isActive={showWeekends}
                    onClick={() => setShowWeekends((prev) => !prev)}
                  >
                    주말 {showWeekends ? "ON" : "OFF"}
                  </WeekendToggleButton>
                </CalendarToolbar>
              </SectionHeader>

              <WeekdayRow $columns={visibleWeekdays.length}>
                {WEEKDAYS.map((weekday) => (
                  visibleWeekdays.includes(weekday) ? (
                    <WeekdayCell key={weekday}>{weekday}</WeekdayCell>
                  ) : null
                ))}
              </WeekdayRow>

              <CalendarGrid $columns={visibleWeekdays.length}>
                {calendarWeeks.flatMap((week, weekIndex) =>
                  week
                    .filter((_, weekdayIndex) => showWeekends || (weekdayIndex !== 0 && weekdayIndex !== 6))
                    .map((day, dayIndex) => {
                      if (!day) {
                        return (
                          <CalendarPlaceholder
                            key={`empty-${weekIndex}-${dayIndex}`}
                          />
                        );
                      }

                      const bucket = recordsByDate.get(day.dateKey);

                      return (
                        <CalendarCellButton
                          key={day.dateKey}
                          type="button"
                          $isCurrentMonth={true}
                          $isSelected={selectedDate === day.dateKey}
                          $isToday={day.isToday}
                          onClick={() => {
                            setSelectedDate(day.dateKey);
                            resetQuickAddForm();
                          }}
                        >
                          <CalendarDayNumber>{day.dayNumber}</CalendarDayNumber>
                          {bucket && (
                            <CalendarDaySummary>
                              {bucket.before10Minutes > 0 && (
                                <span>
                                  <MutedPrefix>10시 전</MutedPrefix>{" "}
                                  {formatCompactDuration(bucket.before10Minutes)}
                                </span>
                              )}
                              {bucket.after10Minutes > 0 && (
                                <span>
                                  <MutedPrefix>10시 이후</MutedPrefix>{" "}
                                  {formatCompactDuration(bucket.after10Minutes)}
                                </span>
                              )}
                            </CalendarDaySummary>
                          )}
                        </CalendarCellButton>
                      );
                    }),
                )}
              </CalendarGrid>

              <SelectedDatePanel>
                <SectionTitle>{formatDisplayDate(selectedDate)} 기록</SectionTitle>
                <QuickAddCard>
                  <QuickAddHeader>
                    <QuickAddTitle>
                      {editingRecordId ? "기록 수정 중" : "새 기록 추가"}
                    </QuickAddTitle>
                    {editingRecordId && (
                      <EditCancelButton type="button" onClick={resetQuickAddForm}>
                        수정 취소
                      </EditCancelButton>
                    )}
                  </QuickAddHeader>
                  <SplitGrid>
                    <DurationCard>
                      <FieldLabel>10시 전 야근</FieldLabel>
                      <DurationInputs>
                        <CompactInput
                          type="number"
                          min="0"
                          placeholder="시간"
                          value={quickBefore10Hours}
                          onChange={(event) =>
                            setQuickBefore10Hours(event.target.value)
                          }
                        />
                        <UnitText>시간</UnitText>
                        <CompactInput
                          type="number"
                          min="0"
                          placeholder="분"
                          value={quickBefore10Minutes}
                          onChange={(event) =>
                            setQuickBefore10Minutes(event.target.value)
                          }
                          onBlur={() =>
                            applyDurationNormalization(
                              quickBefore10Hours,
                              quickBefore10Minutes,
                              setQuickBefore10Hours,
                              setQuickBefore10Minutes,
                            )
                          }
                        />
                        <UnitText>분</UnitText>
                      </DurationInputs>
                    </DurationCard>

                    <DurationCard>
                      <FieldLabel>10시 이후 야근</FieldLabel>
                      <DurationInputs>
                        <CompactInput
                          type="number"
                          min="0"
                          placeholder="시간"
                          value={quickAfter10Hours}
                          onChange={(event) =>
                            setQuickAfter10Hours(event.target.value)
                          }
                        />
                        <UnitText>시간</UnitText>
                        <CompactInput
                          type="number"
                          min="0"
                          placeholder="분"
                          value={quickAfter10Minutes}
                          onChange={(event) =>
                            setQuickAfter10Minutes(event.target.value)
                          }
                          onBlur={() =>
                            applyDurationNormalization(
                              quickAfter10Hours,
                              quickAfter10Minutes,
                              setQuickAfter10Hours,
                              setQuickAfter10Minutes,
                            )
                          }
                        />
                        <UnitText>분</UnitText>
                      </DurationInputs>
                    </DurationCard>
                  </SplitGrid>
                  <PrimaryButton type="button" onClick={handleQuickAddRecord}>
                    {editingRecordId
                      ? `${formatDisplayDate(selectedDate)} 수정 저장하기`
                      : `${formatDisplayDate(selectedDate)}에 추가하기`}
                  </PrimaryButton>
                </QuickAddCard>
                {selectedDateBucket ? (
                  <>
                    <SelectedSummaryRow>
                      <SelectedSummaryChip>
                        <MutedPrefix>10시 전</MutedPrefix>{" "}
                        {formatRawDuration(selectedDateBucket.before10Minutes)}
                      </SelectedSummaryChip>
                      <SelectedSummaryChip>
                        <MutedPrefix>10시 이후</MutedPrefix>{" "}
                        {formatRawDuration(selectedDateBucket.after10Minutes)}
                      </SelectedSummaryChip>
                    </SelectedSummaryRow>
                    <RecordList>
                      {selectedDateBucket.records.map((record) => (
                        <RecordItem key={record.id}>
                          <RecordInfo>
                            <strong>{record.date}</strong>
                            <span>
                              <MutedPrefix>10시 전</MutedPrefix>{" "}
                              {formatRawDuration(record.before10Minutes)}
                            </span>
                            <span>
                              <MutedPrefix>10시 이후</MutedPrefix>{" "}
                              {formatRawDuration(record.after10Minutes)}
                            </span>
                          </RecordInfo>
                          <RecordActions>
                            <EditButton
                              type="button"
                              onClick={() => handleEditRecord(record)}
                            >
                              수정
                            </EditButton>
                            <DeleteButton
                              type="button"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              삭제
                            </DeleteButton>
                          </RecordActions>
                        </RecordItem>
                      ))}
                    </RecordList>
                  </>
                ) : (
                  <EmptyItem>선택한 날짜에 저장된 야근 기록이 없습니다.</EmptyItem>
                )}
              </SelectedDatePanel>

              <SectionDivider />

              <AccordionSection>
                <AccordionHeader>
                  <SectionTitle>저장된 야근 기록</SectionTitle>
                  <AccordionToggleButton
                    type="button"
                    onClick={() => setIsRecordsExpanded((prev) => !prev)}
                  >
                    {isRecordsExpanded ? "접기" : "더보기"}
                  </AccordionToggleButton>
                </AccordionHeader>
                {isRecordsExpanded ? (
                  <RecordList>
                    {displayedRecords.length === 0 ? (
                      <EmptyItem>저장된 야근 기록이 없습니다.</EmptyItem>
                    ) : (
                      displayedRecords.map((record) => (
                        <RecordItem key={record.id}>
                          <RecordInfo>
                            <strong>{record.date}</strong>
                            <span>
                              <MutedPrefix>10시 전</MutedPrefix>{" "}
                              {formatRawDuration(record.before10Minutes)}
                            </span>
                            <span>
                              <MutedPrefix>10시 이후</MutedPrefix>{" "}
                              {formatRawDuration(record.after10Minutes)}
                            </span>
                          </RecordInfo>
                          <RecordActions>
                            <EditButton
                              type="button"
                              onClick={() => handleEditRecord(record)}
                            >
                              수정
                            </EditButton>
                            <DeleteButton
                              type="button"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              삭제
                            </DeleteButton>
                          </RecordActions>
                        </RecordItem>
                      ))
                    )}
                  </RecordList>
                ) : (
                  <AccordionHint>
                    저장된 전체 기록은 더보기로 펼쳐서 확인할 수 있어요.
                  </AccordionHint>
                )}
              </AccordionSection>

              <DangerButton
                type="button"
                onClick={handleClearRecords}
                disabled={records.length === 0}
              >
                전체 기록 초기화
              </DangerButton>
            </TabPanel>
          )}

          <SectionDivider />

          <SectionTitle>보상 규칙 요약</SectionTitle>
          <RuleList>
            <RuleItem>
              <span>적립 시작 기준</span>
              <strong>누적 야근 15시간 초과분부터</strong>
            </RuleItem>
            <RuleItem>
              <span>10시 전 적립률</span>
              <strong>1분당 보상 1.5분</strong>
            </RuleItem>
            <RuleItem>
              <span>10시 이후 적립률</span>
              <strong>1분당 보상 2분</strong>
            </RuleItem>
            <RuleItem>
              <span>0.25일 사용 가능 기준</span>
              <strong>보상시간 120분</strong>
            </RuleItem>
            <RuleItem>
              <span>발생 일수 표기</span>
              <strong>분 단위로 계속 누적</strong>
            </RuleItem>
          </RuleList>
          <GuidePanel>
            <GuideTitle>10시 전 1.5배 기준 휴가 가이드</GuideTitle>
            <GuideList>
              {BEFORE10_DAY_GUIDE.map((item) => (
                <GuideItem key={item.days}>
                  <span>{item.days}일 휴가</span>
                  <strong>{formatRawDuration(item.totalMinutes)} 야근 필요</strong>
                </GuideItem>
              ))}
            </GuideList>
          </GuidePanel>
          <SubText>
            예시: 15시간을 넘긴 뒤에는 10시 전 80분 또는 10시 이후 60분이
            쌓이면 사용 가능 0.25일이 됩니다.
          </SubText>
        </SurfaceCard>
      </StWrapper>
    </StContainer>
  );
}

const SurfaceCard = styled.section`
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe7f4;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 22px;
  }
`;

const TabList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) => ($isActive ? "#234f8d" : "#f8fbff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#4a5d78")};
  border-radius: 16px;
  padding: 0.85rem 1rem;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.14);
  }
`;

const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GuideText = styled.p`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #eef5ff;
  color: #39506c;
  line-height: 1.7;
  font-size: 0.95rem;
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const DurationCard = styled.div`
  border: 1px solid #dbe7f4;
  background: #f8fbff;
  border-radius: 18px;
  padding: 1rem;
`;

const DurationInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-top: 0.6rem;
`;

const FieldLabel = styled.label`
  font-size: 0.92rem;
  font-weight: 700;
  color: #2d3b4f;
`;

const CompactInput = styled.input`
  width: 88px;
  min-height: 48px;
  padding: 0.8rem 0.85rem;
  border: 1px solid #d3deed;
  border-radius: 14px;
  background: #ffffff;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }
`;

const UnitText = styled.span`
  color: #64748b;
  font-weight: 600;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 16px;
  background: #234f8d;
  color: #ffffff;
  padding: 0.95rem 1.15rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid #1c4277;
  box-shadow: 0 8px 18px rgba(35, 79, 141, 0.14);
  transition:
    background-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: #1d457d;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(35, 79, 141, 0.18);
  }
`;

const DangerButton = styled(PrimaryButton)`
  background: #c53b3b;
  border-color: #b43333;
  box-shadow: 0 8px 16px rgba(197, 59, 59, 0.12);

  &:hover {
    background: #b43333;
    box-shadow: 0 10px 18px rgba(197, 59, 59, 0.16);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const ResultBox = styled.pre`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #0f172a;
  color: #f8fafc;
  font-family: inherit;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 0.95rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid #dbe7f4;

  span {
    color: #64748b;
    font-size: 0.85rem;
  }

  strong {
    color: #0f172a;
    font-size: 1.05rem;
  }
`;

const NoticeCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #eef5ff;
  border: 1px solid #cfe0fb;
  color: #234f8d;

  strong {
    font-size: 0.96rem;
    color: #123865;
  }

  span {
    font-size: 0.9rem;
    color: #31567d;
  }
`;

const NoticeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const TargetDayTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const TargetDayButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#cfe0fb")};
  background: ${({ $isActive }) => ($isActive ? "#234f8d" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#234f8d")};
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

const SectionDivider = styled.hr`
  margin: 1.75rem 0 1.25rem;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 800;
`;

const CalendarToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const CalendarNavButton = styled.button`
  border: 1px solid #d2dceb;
  background: #ffffff;
  color: #334155;
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const TodayButton = styled(CalendarNavButton)`
  background: #eef5ff;
  color: #234f8d;
  border-color: #cfe0fb;
`;

const CalendarMonthLabel = styled.strong`
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
  margin-right: 0.2rem;
`;

const WeekendToggleButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) => ($isActive ? "#eef5ff" : "#ffffff")};
  color: ${({ $isActive }) => ($isActive ? "#234f8d" : "#475569")};
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const WeekdayRow = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 0.5rem;
`;

const WeekdayCell = styled.div`
  text-align: center;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 700;
`;

const CalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 720px) {
    gap: 0.35rem;
  }
`;

const CalendarCellButton = styled.button<{
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $isToday: boolean;
}>`
  min-height: 118px;
  border-radius: 16px;
  padding: 0.7rem;
  border: 1px solid
    ${({ $isSelected, $isToday }) =>
      $isSelected ? "#234f8d" : $isToday ? "#60a5fa" : "#dbe7f4"};
  background: ${({ $isSelected }) => ($isSelected ? "#eef5ff" : "#ffffff")};
  color: ${({ $isCurrentMonth }) => ($isCurrentMonth ? "#0f172a" : "#94a3b8")};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  cursor: pointer;

  @media (max-width: 720px) {
    min-height: 96px;
    padding: 0.55rem;
  }
`;

const CalendarPlaceholder = styled.div`
  min-height: 118px;

  @media (max-width: 720px) {
    min-height: 96px;
  }
`;

const CalendarDayNumber = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
`;

const CalendarDaySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.73rem;
  line-height: 1.35;
  color: #334155;

  span {
    display: block;
    background: #f8fbff;
    border-radius: 10px;
    padding: 0.2rem 0.35rem;
  }
`;

const MutedPrefix = styled.span`
  color: #8a99b2;
  font-weight: 600;
  margin-right: 0.3rem;
`;

const SelectedDatePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  border: 1px solid #dbe7f4;
  background: #f8fbff;
  border-radius: 20px;
  padding: 1rem;
`;

const QuickAddCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.95rem;
  border-radius: 18px;
  border: 1px solid #dbe7f4;
  background: #ffffff;
`;

const QuickAddHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const QuickAddTitle = styled.strong`
  color: #123865;
  font-size: 0.96rem;
`;

const EditCancelButton = styled.button`
  border: 1px solid #d2dceb;
  background: #ffffff;
  color: #475569;
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

const AccordionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border: 1px solid #dbe7f4;
  background: #f8fbff;
  border-radius: 20px;
  padding: 1rem;
`;

const AccordionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const AccordionToggleButton = styled.button`
  border: 1px solid #d2dceb;
  background: #ffffff;
  color: #234f8d;
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const AccordionHint = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.6;
`;

const SelectedSummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const SelectedSummaryChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.75rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #dbe7f4;
  color: #234f8d;
  font-weight: 700;
  font-size: 0.9rem;
`;

const SubText = styled.p`
  margin: 0.85rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const RecordList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const RecordItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const RecordActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const EditButton = styled.button`
  border: none;
  border-radius: 12px;
  background: #e0ecff;
  color: #1d4f91;
  padding: 0.65rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const EmptyItem = styled.li`
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  color: #64748b;
  border: 1px dashed #cbd5e1;
`;

const RecordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    color: #0f172a;
  }

  span {
    color: #64748b;
  }
`;

const DeleteButton = styled.button`
  border: none;
  border-radius: 12px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.65rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const RuleList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const GuidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 20px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
`;

const GuideTitle = styled.h3`
  margin: 0;
  color: #123865;
  font-size: 1rem;
  font-weight: 800;
`;

const GuideList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const GuideItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0.95rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #dbe7f4;
  color: #334155;

  strong {
    color: #0f172a;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const RuleItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
  color: #334155;

  strong {
    color: #0f172a;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.3rem;
  }
`;
