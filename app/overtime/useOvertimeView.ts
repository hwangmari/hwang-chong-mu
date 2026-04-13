"use client";

import { useCallback, useMemo, useState } from "react";
import { DAY_REWARD_SECONDS, WEEKDAYS } from "./constants";
import {
  DayBucket,
  OvertimeRecord,
  OvertimeRule,
  OvertimeSummary,
} from "./types";
import {
  buildMonthCalendarWeeks,
  buildOvertimeSummary,
  buildSummaryMessage,
  formatDateKey,
  formatMonthKey,
  getAdditionalMinutesForTargetDays,
  parseDateKey,
  shiftMonth,
} from "./utils";

type Params = {
  todayKey: string;
  records: OvertimeRecord[];
  activeRule: OvertimeRule;
};

export function useOvertimeView({ todayKey, records, activeRule }: Params) {
  const [currentMonth, setCurrentMonth] = useState(() => parseDateKey(todayKey));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showWeekends, setShowWeekends] = useState(false);
  const [isRecordsExpanded, setIsRecordsExpanded] = useState(false);
  const [targetUsableDays, setTargetUsableDays] = useState(1);

  const currentMonthKey = useMemo(
    () => formatMonthKey(currentMonth),
    [currentMonth],
  );

  const monthlyRecords = useMemo(
    () => records.filter((record) => record.date.startsWith(currentMonthKey)),
    [currentMonthKey, records],
  );

  const recordSummary = useMemo<OvertimeSummary>(
    () => buildOvertimeSummary(monthlyRecords, activeRule),
    [activeRule, monthlyRecords],
  );

  const recordResult = useMemo(
    () =>
      buildSummaryMessage(
        `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월 누적 야근 현황`,
        recordSummary,
        activeRule,
      ),
    [activeRule, currentMonth, recordSummary],
  );

  const targetDayGuide = useMemo(
    () => ({
      before10Minutes: getAdditionalMinutesForTargetDays(
        activeRule,
        recordSummary,
        targetUsableDays,
        activeRule.before10RewardSecondsPerMinute,
      ),
      after10Minutes: getAdditionalMinutesForTargetDays(
        activeRule,
        recordSummary,
        targetUsableDays,
        activeRule.after10RewardSecondsPerMinute,
      ),
      isReached:
        recordSummary.rewardSeconds >= targetUsableDays * DAY_REWARD_SECONDS,
    }),
    [activeRule, recordSummary, targetUsableDays],
  );

  const displayedRecords = useMemo(
    () =>
      [...monthlyRecords].sort((left, right) => {
        const byDate = right.date.localeCompare(left.date);
        if (byDate !== 0) {
          return byDate;
        }
        return right.createdAt.localeCompare(left.createdAt);
      }),
    [monthlyRecords],
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
        : WEEKDAYS.filter(
            (_, weekdayIndex) => weekdayIndex !== 0 && weekdayIndex !== 6,
          ),
    [showWeekends],
  );

  const moveMonth = useCallback((amount: number) => {
    setCurrentMonth((prev) => {
      const nextMonth = shiftMonth(prev, amount);
      setSelectedDate(formatDateKey(nextMonth));
      return nextMonth;
    });
  }, []);

  const goToday = useCallback(() => {
    const todayDate = parseDateKey(todayKey);
    setCurrentMonth(todayDate);
    setSelectedDate(todayKey);
  }, [todayKey]);

  const toggleWeekends = useCallback(() => {
    setShowWeekends((prev) => !prev);
  }, []);

  const toggleRecordsExpanded = useCallback(() => {
    setIsRecordsExpanded((prev) => !prev);
  }, []);

  return {
    currentMonth,
    setCurrentMonth,
    currentMonthKey,
    selectedDate,
    setSelectedDate,
    showWeekends,
    toggleWeekends,
    isRecordsExpanded,
    toggleRecordsExpanded,
    targetUsableDays,
    setTargetUsableDays,
    monthlyRecords,
    recordSummary,
    recordResult,
    targetDayGuide,
    displayedRecords,
    recordsByDate,
    selectedDateBucket,
    calendarWeeks,
    visibleWeekdays,
    moveMonth,
    goToday,
  };
}
