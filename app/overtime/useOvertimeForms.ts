"use client";

import { useCallback, useState } from "react";
import {
  OvertimeRecord,
  OvertimeRule,
  OvertimeSummary,
} from "./types";
import {
  buildOvertimeSummary,
  buildSummaryMessage,
  createRecordId,
  getDurationMinutes,
  normalizeDurationFields,
  parseDateKey,
  splitMinutesToFields,
} from "./utils";

type Params = {
  todayKey: string;
  records: OvertimeRecord[];
  activeRule: OvertimeRule;
  persistRecords: (
    nextRecords: OvertimeRecord[],
  ) => Promise<boolean> | boolean;
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: string) => void;
};

export function useOvertimeForms({
  todayKey,
  records,
  activeRule,
  persistRecords,
  setCurrentMonth,
  setSelectedDate,
}: Params) {
  const [calcTargetDays, setCalcTargetDays] = useState(1);
  const [calcBefore10Hours, setCalcBefore10Hours] = useState("");
  const [calcBefore10Minutes, setCalcBefore10Minutes] = useState("");
  const [calcAfter10Hours, setCalcAfter10Hours] = useState("");
  const [calcAfter10Minutes, setCalcAfter10Minutes] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [calcSummary, setCalcSummary] = useState<OvertimeSummary | null>(null);

  const [quickBefore10Hours, setQuickBefore10Hours] = useState("");
  const [quickBefore10Minutes, setQuickBefore10Minutes] = useState("");
  const [quickAfter10Hours, setQuickAfter10Hours] = useState("");
  const [quickAfter10Minutes, setQuickAfter10Minutes] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const applyDurationNormalization = useCallback(
    (
      hoursValue: string,
      minutesValue: string,
      setHours: (value: string) => void,
      setMinutes: (value: string) => void,
    ) => {
      const normalized = normalizeDurationFields(hoursValue, minutesValue);
      setHours(normalized.hours);
      setMinutes(normalized.minutes);
    },
    [],
  );

  const resetCalcForm = useCallback(() => {
    setCalcSummary(null);
    setCalcResult("");
  }, []);

  const resetQuickAddForm = useCallback(() => {
    setQuickBefore10Hours("");
    setQuickBefore10Minutes("");
    setQuickAfter10Hours("");
    setQuickAfter10Minutes("");
    setEditingRecordId(null);
  }, []);

  const handleCalculate = useCallback(() => {
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

    const summary = buildOvertimeSummary(
      [
        {
          id: "preview",
          date: todayKey,
          before10Minutes: before10Duration.totalMinutes,
          after10Minutes: after10Duration.totalMinutes,
          createdAt: new Date().toISOString(),
        },
      ],
      activeRule,
    );

    setCalcSummary(summary);
    setCalcResult(buildSummaryMessage("계산 결과", summary, activeRule));
  }, [
    activeRule,
    calcAfter10Hours,
    calcAfter10Minutes,
    calcBefore10Hours,
    calcBefore10Minutes,
    todayKey,
  ]);

  const saveQuickRecord = useCallback(
    async (targetDate: string) => {
      if (!targetDate) {
        alert("날짜를 입력해주세요.");
        return false;
      }

      const normalizedBefore10 = normalizeDurationFields(
        quickBefore10Hours,
        quickBefore10Minutes,
      );
      const normalizedAfter10 = normalizeDurationFields(
        quickAfter10Hours,
        quickAfter10Minutes,
      );

      setQuickBefore10Hours(normalizedBefore10.hours);
      setQuickBefore10Minutes(normalizedBefore10.minutes);
      setQuickAfter10Hours(normalizedAfter10.hours);
      setQuickAfter10Minutes(normalizedAfter10.minutes);

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

      const didPersist = await persistRecords([
        ...records.filter((record) => record.id !== editingRecordId),
        nextRecord,
      ]);

      if (!didPersist) {
        return false;
      }

      const recordMonth = parseDateKey(targetDate);
      setCurrentMonth(
        new Date(recordMonth.getFullYear(), recordMonth.getMonth(), 1),
      );
      setSelectedDate(targetDate);
      resetQuickAddForm();
      return true;
    },
    [
      editingRecordId,
      persistRecords,
      quickAfter10Hours,
      quickAfter10Minutes,
      quickBefore10Hours,
      quickBefore10Minutes,
      records,
      resetQuickAddForm,
      setCurrentMonth,
      setSelectedDate,
    ],
  );

  const startEditingRecord = useCallback(
    (record: OvertimeRecord) => {
      const before10 = splitMinutesToFields(record.before10Minutes);
      const after10 = splitMinutesToFields(record.after10Minutes);
      const recordDate = parseDateKey(record.date);

      setSelectedDate(record.date);
      setCurrentMonth(
        new Date(recordDate.getFullYear(), recordDate.getMonth(), 1),
      );
      setQuickBefore10Hours(before10.hours);
      setQuickBefore10Minutes(before10.minutes);
      setQuickAfter10Hours(after10.hours);
      setQuickAfter10Minutes(after10.minutes);
      setEditingRecordId(record.id);
    },
    [setCurrentMonth, setSelectedDate],
  );

  return {
    // calculator
    calcTargetDays,
    setCalcTargetDays,
    calcBefore10Hours,
    setCalcBefore10Hours,
    calcBefore10Minutes,
    setCalcBefore10Minutes,
    calcAfter10Hours,
    setCalcAfter10Hours,
    calcAfter10Minutes,
    setCalcAfter10Minutes,
    calcResult,
    calcSummary,
    handleCalculate,
    resetCalcForm,
    // quick add
    quickBefore10Hours,
    setQuickBefore10Hours,
    quickBefore10Minutes,
    setQuickBefore10Minutes,
    quickAfter10Hours,
    setQuickAfter10Hours,
    quickAfter10Minutes,
    setQuickAfter10Minutes,
    editingRecordId,
    resetQuickAddForm,
    saveQuickRecord,
    startEditingRecord,
    // shared
    applyDurationNormalization,
  };
}
