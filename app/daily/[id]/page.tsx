"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@hwangchongmu/ui";
import { getMonthKey, getTodayDateKey } from "../storage";
import LockScreen from "./components/LockScreen";
import MonthNavBar from "./components/MonthNavBar";
import NotebookBoardSection from "./components/NotebookBoardSection";
import NotebookHeader from "./components/NotebookHeader";
import SettingsModal from "./components/SettingsModal";
import {
  TREND_COLUMN_WIDTH,
  TREND_ROW_HEIGHT,
  getScore,
  normalizeChecklistInput,
} from "./helpers";
import {
  BackButton,
  LockDescription,
  PageContainer,
  LoadingCard,
} from "./page.styles";
import { useDailyNotebook } from "./useDailyNotebook";

export default function DailyLogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notebookId = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    notebook,
    entries,
    monthChecklist,
    accessInput,
    setAccessInput,
    accessCode,
    accessError,
    isLoading,
    loadError,
    currentMonth,
    monthKey,
    draftChecklist,
    tryUnlock,
    saveChecklist,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    updateDiary,
    saveDiary,
    toggleCheck,
    changeAccessCode,
    shiftMonth,
    jumpToCurrentMonth,
  } = useDailyNotebook(notebookId);

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [nextAccessCode, setNextAccessCode] = useState("");
  const [accessNotice, setAccessNotice] = useState("");
  const [accessNoticeType, setAccessNoticeType] = useState<
    "success" | "error" | ""
  >("");

  const todayDateKey = getTodayDateKey();

  const avgScore = useMemo(() => {
    if (entries.length === 0) return 0;
    const total = entries.reduce(
      (sum, entry) => sum + getScore(entry.checks),
      0,
    );
    return Math.round(total / entries.length);
  }, [entries]);

  const monthLabel = useMemo(
    () => `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`,
    [currentMonth],
  );

  const isCurrentMonth = monthKey === getMonthKey(new Date());

  const hasChecklistChanges = useMemo(() => {
    const left = normalizeChecklistInput(draftChecklist);
    const right = normalizeChecklistInput(monthChecklist);
    return JSON.stringify(left) !== JSON.stringify(right);
  }, [draftChecklist, monthChecklist]);

  const trendGraph = useMemo(() => {
    const chartWidth = TREND_COLUMN_WIDTH;
    const chartHeight = Math.max(
      entries.length * TREND_ROW_HEIGHT,
      TREND_ROW_HEIGHT,
    );
    const paddingX = 12;
    const innerWidth = chartWidth - paddingX * 2;

    const points = entries.map((entry, index) => {
      const score = getScore(entry.checks);
      const isToday = entry.date === todayDateKey;
      return {
        date: entry.date,
        score,
        isToday,
        x: paddingX + (score / 100) * innerWidth,
        y: index * TREND_ROW_HEIGHT + TREND_ROW_HEIGHT / 2,
      };
    });

    return { chartWidth, chartHeight, points };
  }, [entries, todayDateKey]);

  const handleSubmitAccessCode = async () => {
    const result = await changeAccessCode(nextAccessCode);
    if (!result || result.ok === false) {
      setAccessNoticeType("error");
      setAccessNotice(result ? result.message : "");
      return;
    }
    setNextAccessCode("");
    setIsAccessModalOpen(false);
    alert("비밀번호를 변경했어요.");
  };

  const handleOpenSettings = () => {
    setAccessNotice("");
    setAccessNoticeType("");
    setNextAccessCode("");
    setIsAccessModalOpen(true);
  };

  if (!notebookId) {
    return (
      <PageContainer>
        <Typography variant="h2" className="mb-2">
          기록장 ID가 올바르지 않아요.
        </Typography>
        <BackButton type="button" onClick={() => router.push("/daily")}>
          기록장 목록으로 돌아가기
        </BackButton>
      </PageContainer>
    );
  }

  if (!accessCode) {
    return (
      <LockScreen
        notebookId={notebookId}
        accessInput={accessInput}
        accessError={accessError}
        loadError={loadError}
        onChangeInput={setAccessInput}
        onUnlock={tryUnlock}
        onBack={() => router.push("/daily")}
      />
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingCard>서버 기록장을 불러오는 중...</LoadingCard>
      </PageContainer>
    );
  }

  if (loadError || !notebook) {
    return (
      <PageContainer>
        <Typography variant="h2" className="mb-2">
          기록장을 불러오지 못했어요.
        </Typography>
        <LockDescription>{loadError}</LockDescription>
        <BackButton type="button" onClick={() => router.push("/daily")}>
          기록장 목록으로 돌아가기
        </BackButton>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <NotebookHeader
        title={notebook.title}
        notebookId={notebook.id}
        monthLabel={monthLabel}
        avgScore={avgScore}
        onOpenSettings={handleOpenSettings}
      />

      <MonthNavBar
        monthLabel={monthLabel}
        isCurrentMonth={isCurrentMonth}
        onShiftMonth={shiftMonth}
        onJumpToCurrentMonth={jumpToCurrentMonth}
      />

      <NotebookBoardSection
        entries={entries}
        monthChecklist={monthChecklist}
        todayDateKey={todayDateKey}
        trendGraph={trendGraph}
        onUpdateDiary={updateDiary}
        onSaveDiary={saveDiary}
        onToggleCheck={toggleCheck}
      />

      {isAccessModalOpen && (
        <SettingsModal
          monthLabel={monthLabel}
          monthKey={monthKey}
          draftChecklist={draftChecklist}
          hasChecklistChanges={hasChecklistChanges}
          nextAccessCode={nextAccessCode}
          accessNotice={accessNotice}
          accessNoticeType={accessNoticeType}
          onChangeNextAccessCode={setNextAccessCode}
          onSubmitAccessCode={() => {
            void handleSubmitAccessCode();
          }}
          onSaveChecklist={() => {
            void saveChecklist();
          }}
          onAddChecklistItem={addChecklistItem}
          onUpdateChecklistItem={updateChecklistItem}
          onRemoveChecklistItem={removeChecklistItem}
          onClose={() => setIsAccessModalOpen(false)}
        />
      )}
    </PageContainer>
  );
}
