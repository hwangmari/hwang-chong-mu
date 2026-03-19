"use client";

import { useEffect, useMemo, useState } from "react";
import PageIntro from "@/components/common/PageIntro";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
import CalculatorTab from "@/app/overtime/components/CalculatorTab";
import RecordsTab from "@/app/overtime/components/RecordsTab";
import RuleGuideAccordion from "@/app/overtime/components/RuleGuideAccordion";
import RuleSelector from "@/app/overtime/components/RuleSelector";
import {
  SectionDivider,
  SurfaceCard,
  TabButton,
  TabList,
} from "@/app/overtime/components/styles";
import {
  DAY_REWARD_SECONDS,
  OVERTIME_RULES,
  RULE_KEY,
  STORAGE_KEY,
  STORAGE_MODE_KEY,
  STORAGE_ROOM_KEY,
  WEEKDAYS,
} from "@/app/overtime/constants";
import {
  buildMonthCalendarWeeks,
  buildOvertimeSummary,
  buildSummaryMessage,
  createRecordId,
  formatDateKey,
  formatMonthKey,
  getAdditionalMinutesForTargetDays,
  getDurationMinutes,
  getRuleGuideItems,
  getTodayDateInputValue,
  mergeRecordsByDate,
  normalizeDurationFields,
  parseDateKey,
  parseStoredRecords,
  shiftMonth,
  splitMinutesToFields,
} from "@/app/overtime/utils";
import {
  useOvertimePersistence,
  type OvertimeRoomInfo,
} from "@/hooks/useOvertimePersistence";
import {
  DayBucket,
  OvertimeRecord,
  OvertimeRuleId,
  OvertimeSummary,
  StorageMode,
  TabKey,
} from "@/app/overtime/types";

export default function OvertimePage() {
  const todayKey = getTodayDateInputValue();
  const {
    createRoom,
    fetchRoomData,
    replaceRoomRecords,
    loading: isServerLoading,
  } = useOvertimePersistence();

  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [storageMode, setStorageMode] = useState<StorageMode>(() => {
    if (typeof window === "undefined") {
      return "local";
    }

    return localStorage.getItem(STORAGE_MODE_KEY) === "server"
      ? "server"
      : "local";
  });
  const [ruleId, setRuleId] = useState<OvertimeRuleId>(() => {
    if (typeof window === "undefined") {
      return "threshold_15h";
    }

    const savedRule = localStorage.getItem(RULE_KEY);
    return savedRule === "from_1830" ? "from_1830" : "threshold_15h";
  });
  const [currentMonth, setCurrentMonth] = useState(() =>
    parseDateKey(todayKey),
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showWeekends, setShowWeekends] = useState(false);
  const [isRecordsExpanded, setIsRecordsExpanded] = useState(false);
  const [isRuleGuideExpanded, setIsRuleGuideExpanded] = useState(false);
  const [targetUsableDays, setTargetUsableDays] = useState(1);
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
  const [roomNameInput, setRoomNameInput] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [serverRoom, setServerRoom] = useState<OvertimeRoomInfo | null>(null);
  const [localRecords, setLocalRecords] = useState<OvertimeRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return parseStoredRecords(localStorage.getItem(STORAGE_KEY));
  });
  const [serverRecords, setServerRecords] = useState<OvertimeRecord[]>([]);

  const activeRule = OVERTIME_RULES[ruleId];
  const activeRuleGuide = useMemo(() => getRuleGuideItems(activeRule), [activeRule]);
  const records = storageMode === "server" ? serverRecords : localRecords;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedRoomRef = localStorage.getItem(STORAGE_ROOM_KEY);
    if (!savedRoomRef) {
      return;
    }

    let cancelled = false;

    const restoreRoom = async () => {
      try {
        const loaded = await fetchRoomData(savedRoomRef);
        if (cancelled) {
          return;
        }

        setServerRoom(loaded.room);
        setServerRecords(mergeRecordsByDate(loaded.records));
        setRoomCodeInput(loaded.room.roomRef);
      } catch (error) {
        console.error("저장된 서버 방을 불러오지 못했습니다.", error);
        if (!cancelled) {
          localStorage.removeItem(STORAGE_ROOM_KEY);
          setStorageMode("local");
        }
      }
    };

    void restoreRoom();

    return () => {
      cancelled = true;
    };
  }, [fetchRoomData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_MODE_KEY, storageMode);
    }
  }, [storageMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(RULE_KEY, ruleId);
    }
  }, [ruleId]);

  const currentMonthKey = useMemo(
    () => formatMonthKey(currentMonth),
    [currentMonth],
  );
  const monthlyRecords = useMemo(
    () => records.filter((record) => record.date.startsWith(currentMonthKey)),
    [currentMonthKey, records],
  );
  const recordSummary = useMemo(
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
  const calcTargetGuide = useMemo(
    () =>
      calcSummary
        ? {
            before10Minutes: getAdditionalMinutesForTargetDays(
              activeRule,
              calcSummary,
              calcTargetDays,
              activeRule.before10RewardSecondsPerMinute,
            ),
            after10Minutes: getAdditionalMinutesForTargetDays(
              activeRule,
              calcSummary,
              calcTargetDays,
              activeRule.after10RewardSecondsPerMinute,
            ),
            isReached:
              calcSummary.rewardSeconds >= calcTargetDays * DAY_REWARD_SECONDS,
          }
        : null,
    [activeRule, calcSummary, calcTargetDays],
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

  const persistLocalRecords = (nextRecords: OvertimeRecord[]) => {
    const mergedRecords = mergeRecordsByDate(nextRecords);
    setLocalRecords(mergedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
  };

  const persistServerRecords = async (nextRecords: OvertimeRecord[]) => {
    if (!serverRoom) {
      alert("먼저 서버 저장 방을 연결해주세요.");
      return false;
    }

    const mergedRecords = mergeRecordsByDate(nextRecords);
    await replaceRoomRecords(serverRoom.id, mergedRecords);
    setServerRecords(mergedRecords);
    return true;
  };

  const persistRecords = async (nextRecords: OvertimeRecord[]) => {
    if (storageMode === "server") {
      return persistServerRecords(nextRecords);
    }

    persistLocalRecords(nextRecords);
    return true;
  };

  const connectServerRoom = async (roomRef: string) => {
    const loaded = await fetchRoomData(roomRef);
    const mergedRecords = mergeRecordsByDate(loaded.records);

    setServerRoom(loaded.room);
    setServerRecords(mergedRecords);
    setRoomCodeInput(loaded.room.roomRef);
    setStorageMode("server");

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ROOM_KEY, loaded.room.roomRef);
    }
  };

  const resetQuickAddForm = () => {
    setQuickBefore10Hours("");
    setQuickBefore10Minutes("");
    setQuickAfter10Hours("");
    setQuickAfter10Minutes("");
    setEditingRecordId(null);
  };

  const saveRecordEntry = async ({
    targetDate,
    beforeHours,
    beforeMinutes,
    afterHours,
    afterMinutes,
    applyNormalized,
    onSaved,
    targetEditingRecordId,
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
    targetEditingRecordId?: string | null;
  }) => {
    const normalizedBefore10 = normalizeDurationFields(
      beforeHours,
      beforeMinutes,
    );
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

    const existingRecord = targetEditingRecordId
      ? records.find((record) => record.id === targetEditingRecordId)
      : null;
    const nextRecord: OvertimeRecord = {
      id: existingRecord?.id || createRecordId(),
      date: targetDate,
      before10Minutes: before10Duration.totalMinutes,
      after10Minutes: after10Duration.totalMinutes,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
    };

    const didPersist = await persistRecords([
      ...records.filter((record) => record.id !== targetEditingRecordId),
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
  };

  const handleQuickAddRecord = async () => {
    await saveRecordEntry({
      targetDate: selectedDate,
      beforeHours: quickBefore10Hours,
      beforeMinutes: quickBefore10Minutes,
      afterHours: quickAfter10Hours,
      afterMinutes: quickAfter10Minutes,
      targetEditingRecordId: editingRecordId,
      applyNormalized: (values) => {
        setQuickBefore10Hours(values.beforeHours);
        setQuickBefore10Minutes(values.beforeMinutes);
        setQuickAfter10Hours(values.afterHours);
        setQuickAfter10Minutes(values.afterMinutes);
      },
      onSaved: resetQuickAddForm,
    });
  };

  const handleEditRecord = (record: OvertimeRecord) => {
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
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) {
      return;
    }

    await persistRecords(records.filter((record) => record.id !== id));
  };

  const handleClearRecords = async () => {
    if (!window.confirm("모든 기록을 삭제하시겠습니까?")) {
      return;
    }

    if (storageMode === "server") {
      const didPersist = await persistServerRecords([]);
      if (didPersist) {
        setServerRecords([]);
      }
      return;
    }

    setLocalRecords([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSwitchStorageMode = (nextMode: StorageMode) => {
    setStorageMode(nextMode);
    resetQuickAddForm();
  };

  const handleChangeRule = (nextRuleId: OvertimeRuleId) => {
    setRuleId(nextRuleId);
    setCalcSummary(null);
    setCalcResult("");
  };

  const handleCreateServerRoom = async () => {
    if (!roomNameInput.trim()) {
      alert("방 이름을 입력해주세요.");
      return;
    }

    try {
      const room = await createRoom(roomNameInput.trim());
      setRoomNameInput("");
      await connectServerRoom(room.roomRef);
    } catch (error) {
      console.error("야근 방 생성에 실패했습니다.", error);
      alert("방 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleConnectServerRoom = async () => {
    if (!roomCodeInput.trim()) {
      alert("방 코드를 입력해주세요.");
      return;
    }

    try {
      await connectServerRoom(roomCodeInput.trim());
    } catch (error) {
      console.error("야근 방 연결에 실패했습니다.", error);
      alert("방을 불러오지 못했어요. 방 코드를 다시 확인해주세요.");
    }
  };

  const handleDisconnectServerRoom = () => {
    setServerRoom(null);
    setServerRecords([]);
    setRoomCodeInput("");
    setStorageMode("local");

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_ROOM_KEY);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!serverRoom) {
      return;
    }

    try {
      await navigator.clipboard.writeText(serverRoom.roomRef);
      alert("방 코드를 복사했어요.");
    } catch (error) {
      console.error("방 코드 복사에 실패했습니다.", error);
      alert("방 코드 복사에 실패했어요.");
    }
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
              {activeRule.introDescription.split("\n").map((line, index) => (
                <span key={`${activeRule.id}-${index}`}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </>
          }
        />

        <SurfaceCard>
          <RuleSelector
            activeRuleId={ruleId}
            activeRuleDescription={activeRule.description}
            onChangeRule={handleChangeRule}
          />

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
            <CalculatorTab
              calcBefore10Hours={calcBefore10Hours}
              calcBefore10Minutes={calcBefore10Minutes}
              calcAfter10Hours={calcAfter10Hours}
              calcAfter10Minutes={calcAfter10Minutes}
              calcResult={calcResult}
              calcSummary={calcSummary}
              calcTargetDays={calcTargetDays}
              calcTargetGuide={calcTargetGuide}
              onChangeCalcBefore10Hours={setCalcBefore10Hours}
              onChangeCalcBefore10Minutes={setCalcBefore10Minutes}
              onChangeCalcAfter10Hours={setCalcAfter10Hours}
              onChangeCalcAfter10Minutes={setCalcAfter10Minutes}
              onNormalizeBefore10={() =>
                applyDurationNormalization(
                  calcBefore10Hours,
                  calcBefore10Minutes,
                  setCalcBefore10Hours,
                  setCalcBefore10Minutes,
                )
              }
              onNormalizeAfter10={() =>
                applyDurationNormalization(
                  calcAfter10Hours,
                  calcAfter10Minutes,
                  setCalcAfter10Hours,
                  setCalcAfter10Minutes,
                )
              }
              onCalculate={handleCalculate}
              onChangeCalcTargetDays={setCalcTargetDays}
            />
          ) : (
            <RecordsTab
              currentMonth={currentMonth}
              monthlyRecordCount={monthlyRecords.length}
              recordSummary={recordSummary}
              recordResult={recordResult}
              targetUsableDays={targetUsableDays}
              targetDayGuide={targetDayGuide}
              visibleWeekdays={visibleWeekdays}
              calendarWeeks={calendarWeeks}
              recordsByDate={recordsByDate}
              showWeekends={showWeekends}
              selectedDate={selectedDate}
              selectedDateBucket={selectedDateBucket}
              quickBefore10Hours={quickBefore10Hours}
              quickBefore10Minutes={quickBefore10Minutes}
              quickAfter10Hours={quickAfter10Hours}
              quickAfter10Minutes={quickAfter10Minutes}
              editingRecordId={editingRecordId}
              isRecordsExpanded={isRecordsExpanded}
              displayedRecords={displayedRecords}
              recordsLength={records.length}
              storageMode={storageMode}
              serverRoom={serverRoom}
              roomNameInput={roomNameInput}
              roomCodeInput={roomCodeInput}
              isServerLoading={isServerLoading}
              onChangeTargetUsableDays={setTargetUsableDays}
              onMoveMonth={moveMonth}
              onGoToday={() => {
                const todayDate = parseDateKey(todayKey);
                setCurrentMonth(todayDate);
                setSelectedDate(todayKey);
                resetQuickAddForm();
              }}
              onToggleWeekends={() => setShowWeekends((prev) => !prev)}
              onSelectDate={setSelectedDate}
              onResetQuickAddForm={resetQuickAddForm}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onChangeQuickBefore10Hours={setQuickBefore10Hours}
              onChangeQuickBefore10Minutes={setQuickBefore10Minutes}
              onChangeQuickAfter10Hours={setQuickAfter10Hours}
              onChangeQuickAfter10Minutes={setQuickAfter10Minutes}
              onNormalizeQuickBefore10={() =>
                applyDurationNormalization(
                  quickBefore10Hours,
                  quickBefore10Minutes,
                  setQuickBefore10Hours,
                  setQuickBefore10Minutes,
                )
              }
              onNormalizeQuickAfter10={() =>
                applyDurationNormalization(
                  quickAfter10Hours,
                  quickAfter10Minutes,
                  setQuickAfter10Hours,
                  setQuickAfter10Minutes,
                )
              }
              onSaveQuickRecord={handleQuickAddRecord}
              onToggleRecordsExpanded={() =>
                setIsRecordsExpanded((prev) => !prev)
              }
              onClearRecords={handleClearRecords}
              onChangeStorageMode={handleSwitchStorageMode}
              onChangeRoomNameInput={setRoomNameInput}
              onChangeRoomCodeInput={setRoomCodeInput}
              onCreateServerRoom={handleCreateServerRoom}
              onConnectServerRoom={handleConnectServerRoom}
              onCopyRoomCode={handleCopyRoomCode}
              onDisconnectServerRoom={handleDisconnectServerRoom}
            />
          )}

          <SectionDivider />

          <RuleGuideAccordion
            isExpanded={isRuleGuideExpanded}
            activeRule={activeRule}
            guideItems={activeRuleGuide}
            onToggle={() => setIsRuleGuideExpanded((prev) => !prev)}
          />
        </SurfaceCard>
      </StWrapper>
    </StContainer>
  );
}
