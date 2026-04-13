"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@/app/overtime/constants";
import {
  formatMonthLabel,
  getAdditionalMinutesForTargetDays,
  getRuleGuideItems,
  getTodayDateInputValue,
} from "@/app/overtime/utils";
import { OvertimeRecord, OvertimeRuleId, TabKey } from "@/app/overtime/types";
import { useOvertimeStorage } from "@/app/overtime/useOvertimeStorage";
import { useOvertimeView } from "@/app/overtime/useOvertimeView";
import { useOvertimeForms } from "@/app/overtime/useOvertimeForms";

export default function OvertimePage() {
  const todayKey = getTodayDateInputValue();

  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [ruleId, setRuleId] = useState<OvertimeRuleId>("threshold_15h");
  const [isRuleGuideExpanded, setIsRuleGuideExpanded] = useState(false);
  const hasLoadedRuleRef = useRef(false);

  const activeRule = OVERTIME_RULES[ruleId];
  const activeRuleGuide = useMemo(
    () => getRuleGuideItems(activeRule),
    [activeRule],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const savedRule = localStorage.getItem(RULE_KEY);
    setRuleId(savedRule === "from_1830" ? "from_1830" : "threshold_15h");
    hasLoadedRuleRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && hasLoadedRuleRef.current) {
      localStorage.setItem(RULE_KEY, ruleId);
    }
  }, [ruleId]);

  const storage = useOvertimeStorage();
  const view = useOvertimeView({
    todayKey,
    records: storage.records,
    activeRule,
  });
  const forms = useOvertimeForms({
    todayKey,
    records: storage.records,
    activeRule,
    persistRecords: storage.persistRecords,
    setCurrentMonth: view.setCurrentMonth,
    setSelectedDate: view.setSelectedDate,
  });

  const calcTargetGuide = useMemo(
    () =>
      forms.calcSummary
        ? {
            before10Minutes: getAdditionalMinutesForTargetDays(
              activeRule,
              forms.calcSummary,
              forms.calcTargetDays,
              activeRule.before10RewardSecondsPerMinute,
            ),
            after10Minutes: getAdditionalMinutesForTargetDays(
              activeRule,
              forms.calcSummary,
              forms.calcTargetDays,
              activeRule.after10RewardSecondsPerMinute,
            ),
            isReached:
              forms.calcSummary.rewardSeconds >=
              forms.calcTargetDays * DAY_REWARD_SECONDS,
          }
        : null,
    [activeRule, forms.calcSummary, forms.calcTargetDays],
  );

  const handleQuickAddRecord = async () => {
    await forms.saveQuickRecord(view.selectedDate);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) {
      return;
    }
    await storage.persistRecords(
      storage.records.filter((record) => record.id !== id),
    );
  };

  const handleClearRecords = async () => {
    const targetMonthLabel = formatMonthLabel(view.currentMonth);
    if (!window.confirm(`${targetMonthLabel} 기록만 삭제하시겠습니까?`)) {
      return;
    }
    const nextRecords = storage.records.filter(
      (record) => !record.date.startsWith(view.currentMonthKey),
    );
    await storage.persistRecords(nextRecords);
    forms.resetQuickAddForm();
  };

  const handleSwitchStorageMode = (
    nextMode: Parameters<typeof storage.setStorageMode>[0],
  ) => {
    storage.setStorageMode(nextMode);
    forms.resetQuickAddForm();
  };

  const handleChangeRule = (nextRuleId: OvertimeRuleId) => {
    setRuleId(nextRuleId);
    forms.resetCalcForm();
  };

  const handleMoveMonth = (amount: number) => {
    view.moveMonth(amount);
    forms.resetQuickAddForm();
  };

  const handleGoToday = () => {
    view.goToday();
    forms.resetQuickAddForm();
  };

  const handleEditRecord = (record: OvertimeRecord) => {
    forms.startEditingRecord(record);
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
              calcBefore10Hours={forms.calcBefore10Hours}
              calcBefore10Minutes={forms.calcBefore10Minutes}
              calcAfter10Hours={forms.calcAfter10Hours}
              calcAfter10Minutes={forms.calcAfter10Minutes}
              calcResult={forms.calcResult}
              calcSummary={forms.calcSummary}
              calcTargetDays={forms.calcTargetDays}
              calcTargetGuide={calcTargetGuide}
              onChangeCalcBefore10Hours={forms.setCalcBefore10Hours}
              onChangeCalcBefore10Minutes={forms.setCalcBefore10Minutes}
              onChangeCalcAfter10Hours={forms.setCalcAfter10Hours}
              onChangeCalcAfter10Minutes={forms.setCalcAfter10Minutes}
              onNormalizeBefore10={() =>
                forms.applyDurationNormalization(
                  forms.calcBefore10Hours,
                  forms.calcBefore10Minutes,
                  forms.setCalcBefore10Hours,
                  forms.setCalcBefore10Minutes,
                )
              }
              onNormalizeAfter10={() =>
                forms.applyDurationNormalization(
                  forms.calcAfter10Hours,
                  forms.calcAfter10Minutes,
                  forms.setCalcAfter10Hours,
                  forms.setCalcAfter10Minutes,
                )
              }
              onCalculate={forms.handleCalculate}
              onChangeCalcTargetDays={forms.setCalcTargetDays}
            />
          ) : (
            <RecordsTab
              currentMonth={view.currentMonth}
              monthlyRecordCount={view.monthlyRecords.length}
              recordSummary={view.recordSummary}
              recordResult={view.recordResult}
              targetUsableDays={view.targetUsableDays}
              targetDayGuide={view.targetDayGuide}
              visibleWeekdays={view.visibleWeekdays}
              calendarWeeks={view.calendarWeeks}
              recordsByDate={view.recordsByDate}
              showWeekends={view.showWeekends}
              selectedDate={view.selectedDate}
              selectedDateBucket={view.selectedDateBucket}
              quickBefore10Hours={forms.quickBefore10Hours}
              quickBefore10Minutes={forms.quickBefore10Minutes}
              quickAfter10Hours={forms.quickAfter10Hours}
              quickAfter10Minutes={forms.quickAfter10Minutes}
              editingRecordId={forms.editingRecordId}
              isRecordsExpanded={view.isRecordsExpanded}
              displayedRecords={view.displayedRecords}
              storageMode={storage.storageMode}
              serverRoom={storage.serverRoom}
              roomNameInput={storage.roomNameInput}
              roomCodeInput={storage.roomCodeInput}
              isServerLoading={storage.isServerLoading}
              onChangeTargetUsableDays={view.setTargetUsableDays}
              onMoveMonth={handleMoveMonth}
              onGoToday={handleGoToday}
              onToggleWeekends={view.toggleWeekends}
              onSelectDate={view.setSelectedDate}
              onResetQuickAddForm={forms.resetQuickAddForm}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onChangeQuickBefore10Hours={forms.setQuickBefore10Hours}
              onChangeQuickBefore10Minutes={forms.setQuickBefore10Minutes}
              onChangeQuickAfter10Hours={forms.setQuickAfter10Hours}
              onChangeQuickAfter10Minutes={forms.setQuickAfter10Minutes}
              onNormalizeQuickBefore10={() =>
                forms.applyDurationNormalization(
                  forms.quickBefore10Hours,
                  forms.quickBefore10Minutes,
                  forms.setQuickBefore10Hours,
                  forms.setQuickBefore10Minutes,
                )
              }
              onNormalizeQuickAfter10={() =>
                forms.applyDurationNormalization(
                  forms.quickAfter10Hours,
                  forms.quickAfter10Minutes,
                  forms.setQuickAfter10Hours,
                  forms.setQuickAfter10Minutes,
                )
              }
              onSaveQuickRecord={handleQuickAddRecord}
              onToggleRecordsExpanded={view.toggleRecordsExpanded}
              onClearRecords={handleClearRecords}
              onChangeStorageMode={handleSwitchStorageMode}
              onChangeRoomNameInput={storage.setRoomNameInput}
              onChangeRoomCodeInput={storage.setRoomCodeInput}
              onCreateServerRoom={storage.handleCreateServerRoom}
              onConnectServerRoom={storage.handleConnectServerRoom}
              onCopyRoomCode={storage.handleCopyRoomCode}
              onDisconnectServerRoom={storage.handleDisconnectServerRoom}
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
