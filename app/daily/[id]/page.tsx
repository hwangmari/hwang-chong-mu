"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@hwangchongmu/ui";
import {
  changeDailyAccessCode,
  fetchDailyMonthEntries,
  fetchDailyMonthlyChecklist,
  fetchDailyNotebook,
  saveDailyEntry,
  saveDailyMonthlyChecklist,
} from "../repository";
import {
  DailyNotebookConfig,
  DailyNotebookEntry,
  buildMonthEntries,
  clearLegacyDailyLocalData,
  clearStoredDailyAccessCode,
  getMonthKey,
  getStoredDailyAccessCode,
  getTodayDateKey,
  normalizeEntries,
  sanitizeChecklist,
  setStoredDailyAccessCode,
  toDateLabel,
} from "../storage";

function getScore(checks: boolean[]) {
  if (checks.length === 0) return 0;
  const doneCount = checks.filter(Boolean).length;
  return Math.round((doneCount / checks.length) * 100);
}

function normalizeChecklistInput(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

const TREND_COLUMN_WIDTH = 220;
const TREND_ROW_HEIGHT = 56;
const THEME_COLOR = "#22c55e";

export default function DailyLogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notebookId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [notebook, setNotebook] = useState<DailyNotebookConfig | null>(null);
  const [entries, setEntries] = useState<DailyNotebookEntry[]>([]);
  const [monthChecklist, setMonthChecklist] = useState<string[]>([]);
  const [accessInput, setAccessInput] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [nextAccessCode, setNextAccessCode] = useState("");
  const [accessNotice, setAccessNotice] = useState("");
  const [accessNoticeType, setAccessNoticeType] = useState<"success" | "error" | "">(
    "",
  );
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [draftChecklistByMonth, setDraftChecklistByMonth] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    clearLegacyDailyLocalData();
    if (!notebookId) {
      setIsLoading(false);
      return;
    }

    setAccessCode(getStoredDailyAccessCode(notebookId));
  }, [notebookId]);

  const monthKey = useMemo(() => getMonthKey(currentMonth), [currentMonth]);
  const todayDateKey = getTodayDateKey();
  const draftChecklist = draftChecklistByMonth[monthKey] ?? monthChecklist;

  useEffect(() => {
    let active = true;

    if (!notebookId) {
      setLoadError("기록장 ID가 올바르지 않아요.");
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    if (!accessCode) {
      setNotebook(null);
      setEntries([]);
      setMonthChecklist([]);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setLoadError("");

    void (async () => {
      try {
        const [nextNotebook, nextChecklistRaw, nextEntriesRaw] = await Promise.all([
          fetchDailyNotebook(notebookId, accessCode),
          fetchDailyMonthlyChecklist(notebookId, monthKey, accessCode),
          fetchDailyMonthEntries(notebookId, monthKey, accessCode),
        ]);

        if (!active) return;

        const nextChecklist = sanitizeChecklist(nextChecklistRaw);
        setNotebook(nextNotebook);
        setMonthChecklist(nextChecklist);
        setDraftChecklistByMonth((prev) => ({
          ...prev,
          [monthKey]: nextChecklist,
        }));
        setEntries(
          buildMonthEntries(monthKey, nextEntriesRaw, nextChecklist.length),
        );
        setStoredDailyAccessCode(notebookId, accessCode);
        setAccessError("");
        setLoadError("");
      } catch (error) {
        console.error("기록장 불러오기 실패:", error);
        if (!active) return;

        clearStoredDailyAccessCode(notebookId);
        setAccessCode("");
        setNotebook(null);
        setEntries([]);
        setMonthChecklist([]);
        setLoadError("기록장을 서버에서 불러오지 못했습니다.");
        setAccessError(
          getErrorMessage(
            error,
            "기록장 ID 또는 비밀번호를 다시 확인해주세요.",
          ),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accessCode, monthKey, notebookId]);

  const avgScore = useMemo(() => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + getScore(entry.checks), 0);
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
    const chartHeight = Math.max(entries.length * TREND_ROW_HEIGHT, TREND_ROW_HEIGHT);
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

  const shiftMonth = (offset: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const jumpToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const tryUnlock = () => {
    const trimmedCode = accessInput.trim();
    if (!trimmedCode) {
      setAccessError("비밀번호를 입력해주세요.");
      return;
    }

    setAccessError("");
    setLoadError("");
    setAccessCode(trimmedCode);
  };

  const persistEntry = async (entry: DailyNotebookEntry) => {
    if (!notebookId || !accessCode) return;

    try {
      await saveDailyEntry(
        notebookId,
        entry.date,
        entry.diary,
        entry.checks,
        accessCode,
      );
    } catch (error) {
      console.error("일일 기록 저장 실패:", error);
      throw error;
    }
  };

  const saveChecklist = async () => {
    if (!notebookId || !accessCode) return;

    const nextChecklist = sanitizeChecklist(draftChecklist);
    if (nextChecklist.length === 0) {
      alert("체크리스트를 1개 이상 입력해주세요.");
      return;
    }

    try {
      await saveDailyMonthlyChecklist(
        notebookId,
        monthKey,
        nextChecklist,
        accessCode,
      );
      setMonthChecklist(nextChecklist);
      setDraftChecklistByMonth((prev) => ({ ...prev, [monthKey]: nextChecklist }));
      setEntries((prev) => normalizeEntries(prev, nextChecklist.length));
    } catch (error) {
      console.error("체크리스트 저장 실패:", error);
      alert("체크리스트를 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const addChecklistItem = () => {
    setDraftChecklistByMonth((prev) => ({
      ...prev,
      [monthKey]: [...draftChecklist, ""],
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setDraftChecklistByMonth((prev) => ({
      ...prev,
      [monthKey]: draftChecklist.map((item, current) =>
        current === index ? value : item,
      ),
    }));
  };

  const removeChecklistItem = (index: number) => {
    setDraftChecklistByMonth((prev) => ({
      ...prev,
      [monthKey]: draftChecklist.filter((_, current) => current !== index),
    }));
  };

  const updateDiary = (entryDate: string, diary: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.date === entryDate ? { ...entry, diary } : entry)),
    );
  };

  const saveDiary = async (entryDate: string) => {
    const targetEntry = entries.find((entry) => entry.date === entryDate);
    if (!targetEntry) return;
    try {
      await persistEntry(targetEntry);
    } catch {
      alert("기록을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const toggleCheck = async (entryDate: string, checkIndex: number) => {
    const currentEntry = entries.find((entry) => entry.date === entryDate);
    if (!currentEntry) return;

    const nextEntry: DailyNotebookEntry = {
      ...currentEntry,
      checks: currentEntry.checks.map((check, index) =>
        index === checkIndex ? !check : check,
      ),
    };

    setEntries((prev) =>
      prev.map((entry) => (entry.date === entryDate ? nextEntry : entry)),
    );

    try {
      await persistEntry(nextEntry);
    } catch {
      setEntries((prev) =>
        prev.map((entry) => (entry.date === entryDate ? currentEntry : entry)),
      );
    }
  };

  const saveAccessCode = async () => {
    if (!notebookId || !accessCode) return;

    const code = nextAccessCode.trim();
    if (code.length < 4) {
      setAccessNoticeType("error");
      setAccessNotice("새 비밀번호는 4자 이상 입력해주세요.");
      return;
    }

    try {
      await changeDailyAccessCode(notebookId, accessCode, code);
      setStoredDailyAccessCode(notebookId, code);
      setAccessCode(code);
      setNextAccessCode("");
      setIsAccessModalOpen(false);
      alert("비밀번호를 변경했어요.");
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      setAccessNoticeType("error");
      setAccessNotice("비밀번호를 변경하지 못했어요. 다시 시도해주세요.");
    }
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
      <PageContainer>
        <LockCard>
          <Typography variant="h2" className="mb-2">
            🔒 서버 기록장 열기
          </Typography>
          <LockDescription>
            기록장 ID에 연결된 비밀번호를 입력하면 서버에 저장된 기록을 불러옵니다.
          </LockDescription>
          <NotebookIdText>ID: {notebookId}</NotebookIdText>
          <LockInput
            type="password"
            value={accessInput}
            onChange={(event) => setAccessInput(event.target.value)}
            placeholder="비밀번호 입력"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                tryUnlock();
              }
            }}
          />
          {(accessError || loadError) && (
            <LockError>{accessError || loadError}</LockError>
          )}
          <LockActions>
            <UnlockButton type="button" onClick={tryUnlock}>
              기록장 열기
            </UnlockButton>
            <BackButton type="button" onClick={() => router.push("/daily")}>
              돌아가기
            </BackButton>
          </LockActions>
        </LockCard>
      </PageContainer>
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
      <TopSection>
        <div>
          <Typography variant="h1">{notebook.title}</Typography>
          <Subtitle>월별 한 줄 일기와 체크 완료율을 서버에서 관리합니다.</Subtitle>
          <NotebookIdText>ID: {notebook.id}</NotebookIdText>
        </div>
        <TopActions>
          <SummaryCard>
            <SummaryTitle>{monthLabel} 평균 달성률</SummaryTitle>
            <SummaryValue $color={THEME_COLOR}>{avgScore}%</SummaryValue>
          </SummaryCard>
          <OpenSettingsButton
            type="button"
            $color={THEME_COLOR}
            onClick={() => {
              setAccessNotice("");
              setAccessNoticeType("");
              setNextAccessCode("");
              setIsAccessModalOpen(true);
            }}
          >
            설정
          </OpenSettingsButton>
        </TopActions>
      </TopSection>

      <MonthNavBar>
        <MonthNavButton type="button" onClick={() => shiftMonth(-1)}>
          이전 달
        </MonthNavButton>
        <MonthText>{monthLabel}</MonthText>
        <MonthNavButton type="button" onClick={() => shiftMonth(1)}>
          다음 달
        </MonthNavButton>
        <CurrentMonthButton
          type="button"
          onClick={jumpToCurrentMonth}
          disabled={isCurrentMonth}
          $color={THEME_COLOR}
        >
          이번 달
        </CurrentMonthButton>
      </MonthNavBar>

      <NotebookBoard>
        <BoardHeader>
          <LeftHeader>날짜 / 한 줄 일기</LeftHeader>
          <MiddleHeader>
            <ChecklistHeader $count={monthChecklist.length}>
              {monthChecklist.map((item, index) => (
                <ChecklistLabel key={`${item}-${index}`}>{item}</ChecklistLabel>
              ))}
            </ChecklistHeader>
          </MiddleHeader>
          <TrendHeader>
            <GraphLabel>달성률 추이</GraphLabel>
          </TrendHeader>
        </BoardHeader>

        <BoardBody $rows={entries.length}>
          {entries.map((entry, rowIndex) => {
            const score = getScore(entry.checks);
            const isLast = rowIndex === entries.length - 1;
            const isToday = entry.date === todayDateKey;
            return (
              <Fragment key={entry.date}>
                <DiaryCell $row={rowIndex + 1} $last={isLast} $isToday={isToday}>
                  <DateLabel>
                    {toDateLabel(entry.date)}
                    {isToday && <TodayBadge $color={THEME_COLOR}>오늘</TodayBadge>}
                  </DateLabel>
                  <DiaryInput
                    value={entry.diary}
                    onChange={(event) => updateDiary(entry.date, event.target.value)}
                    onBlur={() => {
                      void saveDiary(entry.date);
                    }}
                    placeholder="오늘의 한 줄 기록을 남겨보세요."
                  />
                </DiaryCell>

                <ChecklistCell
                  $row={rowIndex + 1}
                  $count={monthChecklist.length}
                  $last={isLast}
                  $isToday={isToday}
                >
                  {entry.checks.map((checked, index) => (
                    <CheckButton
                      key={`${entry.date}-${index}`}
                      type="button"
                      $color={THEME_COLOR}
                      $checked={checked}
                      onClick={() => {
                        void toggleCheck(entry.date, index);
                      }}
                      aria-label={`${toDateLabel(entry.date)} ${monthChecklist[index]}`}
                    >
                      {checked ? "O" : "X"}
                    </CheckButton>
                  ))}
                  <MobileScoreText>{score}%</MobileScoreText>
                </ChecklistCell>
              </Fragment>
            );
          })}

          <TrendCell $rows={entries.length}>
            <TrendSvg
              viewBox={`0 0 ${trendGraph.chartWidth} ${trendGraph.chartHeight}`}
              role="img"
              aria-label="달성률 추이 그래프"
            >
              {[0, 25, 50, 75, 100].map((value) => {
                const x = 12 + (value / 100) * (trendGraph.chartWidth - 24);
                return (
                  <g key={value}>
                    <TrendGridLine
                      x1={x}
                      y1="0"
                      x2={x}
                      y2={trendGraph.chartHeight}
                    />
                    <TrendScaleLabel x={x} y="12">
                      {value}
                    </TrendScaleLabel>
                  </g>
                );
              })}

              {trendGraph.points.length > 1 && (
                <TrendPath
                  $color={THEME_COLOR}
                  points={trendGraph.points.map((point) => `${point.x},${point.y}`).join(" ")}
                />
              )}

              {trendGraph.points.map((point) => (
                <g key={point.date}>
                  <TrendPoint $isToday={point.isToday} cx={point.x} cy={point.y} r="4.5" />
                  <TrendPointLabel
                    $color={THEME_COLOR}
                    $isToday={point.isToday}
                    x={point.score >= 90 ? point.x - 8 : point.x + 8}
                    y={point.y - 8}
                    textAnchor={point.score >= 90 ? "end" : "start"}
                  >
                    {point.score}%
                  </TrendPointLabel>
                </g>
              ))}
            </TrendSvg>
          </TrendCell>
        </BoardBody>
      </NotebookBoard>

      {isAccessModalOpen && (
        <AccessModalOverlay
          role="presentation"
          onClick={() => {
            setIsAccessModalOpen(false);
          }}
        >
          <AccessModal
            role="dialog"
            aria-modal="true"
            aria-label="기록장 설정 모달"
            onClick={(event) => event.stopPropagation()}
          >
            <AccessModalTitle>기록장 설정</AccessModalTitle>
            <SettingsSection>
              <AccessHeader>
                <AccessTitle>접근 비밀번호 변경</AccessTitle>
                <AccessStatus $locked>서버 보호 중</AccessStatus>
              </AccessHeader>
              <AccessModalDesc>
                서버 저장소를 사용하므로 비밀번호는 항상 필요합니다. 새 비밀번호는 4자
                이상으로 입력해주세요.
              </AccessModalDesc>
              <AccessInput
                autoFocus
                type="password"
                value={nextAccessCode}
                onChange={(event) => setNextAccessCode(event.target.value)}
                placeholder="새 비밀번호 입력"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void saveAccessCode();
                  }
                }}
              />
              <AccessModalActions>
                <AccessButton
                  type="button"
                  onClick={() => {
                    void saveAccessCode();
                  }}
                >
                  변경 저장
                </AccessButton>
              </AccessModalActions>
              {accessNotice && (
                <AccessNotice $type={accessNoticeType}>{accessNotice}</AccessNotice>
              )}
            </SettingsSection>

            <SettingsSection>
              <EditorHeader>
                <EditorTitle>{monthLabel} 체크리스트</EditorTitle>
                <EditorActions>
                  <AddItemButton type="button" onClick={addChecklistItem}>
                    + 항목 추가
                  </AddItemButton>
                  <SaveChecklistButton
                    type="button"
                    $color={THEME_COLOR}
                    onClick={() => {
                      void saveChecklist();
                    }}
                    disabled={!hasChecklistChanges}
                  >
                    체크리스트 저장
                  </SaveChecklistButton>
                </EditorActions>
              </EditorHeader>

              <ChecklistEditGrid>
                {draftChecklist.map((item, index) => (
                  <ChecklistEditRow key={`${monthKey}-${index}`}>
                    <ChecklistInput
                      value={item}
                      onChange={(event) => updateChecklistItem(index, event.target.value)}
                      placeholder={`항목 ${index + 1}`}
                    />
                    <DeleteItemButton
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      disabled={draftChecklist.length <= 1}
                    >
                      삭제
                    </DeleteItemButton>
                  </ChecklistEditRow>
                ))}
              </ChecklistEditGrid>
            </SettingsSection>

            <AccessModalActions>
              <AccessModalCancel type="button" onClick={() => setIsAccessModalOpen(false)}>
                닫기
              </AccessModalCancel>
            </AccessModalActions>
          </AccessModal>
        </AccessModalOverlay>
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 1.5rem auto 2rem;
  padding: 0 1rem 1rem;
`;

const LoadingCard = styled.section`
  max-width: 420px;
  margin: 3.5rem auto 0;
  border: 1px solid #d9dce3;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  text-align: center;
  color: #475569;
  font-weight: 700;
`;

const LockCard = styled.section`
  max-width: 420px;
  margin: 3.5rem auto 0;
  border: 1px solid #d9dce3;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
`;

const LockDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
`;

const NotebookIdText = styled.p`
  color: #475569;
  font-size: 0.8rem;
  margin-top: 0.35rem;
  word-break: break-all;
`;

const LockInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 0.65rem;
  font-size: 0.95rem;
  outline: none;
`;

const LockError = styled.p`
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.45rem;
`;

const LockActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
`;

const UnlockButton = styled.button`
  border: 1px solid #7ba7ef;
  border-radius: 8px;
  background: #2f6cc7;
  color: #fff;
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-top: 0.25rem;
  font-size: 0.95rem;
`;

const SummaryCard = styled.div`
  min-width: 170px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 0.75rem 0.9rem;
`;

const SummaryTitle = styled.p`
  color: #6b7280;
  font-size: 0.8rem;
`;

const SummaryValue = styled.strong<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: 1.5rem;
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const OpenSettingsButton = styled.button<{ $color: string }>`
  border-radius: 10px;
  border: 1px solid ${({ $color }) => `${$color}88`};
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  padding: 0.5rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

const MonthNavBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
`;

const MonthNavButton = styled.button`
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  font-size: 0.82rem;
  color: #334155;
  background: #fff;
`;

const MonthText = styled.strong`
  margin: 0 0.25rem;
  font-size: 0.92rem;
  color: #1f2937;
`;

const CurrentMonthButton = styled.button<{ $color: string }>`
  margin-left: auto;
  border-radius: 8px;
  border: 1px solid ${({ $color }) => `${$color}88`};
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};
  padding: 0.45rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;

  &:disabled {
    opacity: 0.45;
  }
`;

const AccessHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
`;

const AccessTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
`;

const AccessStatus = styled.span<{ $locked: boolean }>`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $locked }) => ($locked ? "#2563eb" : "#6b7280")};
  background: ${({ $locked }) => ($locked ? "#eff6ff" : "#f1f5f9")};
  border-radius: 9999px;
  padding: 0.2rem 0.45rem;
`;

const AccessInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.55rem;
  font-size: 0.86rem;
  outline: none;
`;

const AccessButton = styled.button`
  border-radius: 8px;
  border: 1px solid #7ba7ef;
  background: #2f6cc7;
  color: #fff;
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
`;

const AccessNotice = styled.p<{ $type: "success" | "error" | "" }>`
  margin-top: 0.45rem;
  font-size: 0.78rem;
  color: ${({ $type }) => ($type === "error" ? "#dc2626" : "#16a34a")};
`;

const AccessModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const AccessModal = styled.section`
  width: 100%;
  max-width: 920px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #d9dce3;
  padding: 0.9rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
`;

const AccessModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.35rem;
`;

const AccessModalDesc = styled.p`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.65rem;
`;

const SettingsSection = styled.section`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  margin-top: 0.7rem;
`;

const AccessModalActions = styled.div`
  margin-top: 0.65rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
`;

const AccessModalCancel = styled.button`
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  gap: 0.6rem;
`;

const EditorTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
`;

const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const AddItemButton = styled.button`
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
`;

const SaveChecklistButton = styled.button<{ $color: string }>`
  border-radius: 8px;
  border: 1px solid ${({ $color }) => `${$color}99`};
  background: ${({ $color }) => $color};
  color: #fff;
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;

  &:disabled {
    opacity: 0.5;
  }
`;

const ChecklistEditGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.5rem;
`;

const ChecklistEditRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem;
`;

const ChecklistInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  font-size: 0.85rem;
  outline: none;
`;

const DeleteItemButton = styled.button`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  padding: 0.4rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.4;
  }
`;

const NotebookBoard = styled.div`
  border: 1px solid #d9dce3;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const BoardHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 38%) 1fr ${TREND_COLUMN_WIDTH}px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftHeader = styled.div`
  padding: 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  border-right: 1px solid #e5e7eb;

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const MiddleHeader = styled.div`
  padding: 0.75rem;
`;

const ChecklistHeader = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(50px, 64px));
  align-items: center;
  gap: 0.5rem;
`;

const ChecklistLabel = styled.div`
  text-align: center;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
`;

const GraphLabel = styled.div`
  text-align: center;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
`;

const TrendHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #e5e7eb;
  padding: 0.75rem 0.5rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

const BoardBody = styled.div<{ $rows: number }>`
  display: grid;
  grid-template-columns: minmax(240px, 38%) 1fr ${TREND_COLUMN_WIDTH}px;
  grid-template-rows: repeat(${({ $rows }) => $rows}, ${TREND_ROW_HEIGHT}px);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
`;

const DiaryCell = styled.div<{ $row: number; $last: boolean; $isToday: boolean }>`
  grid-column: 1;
  grid-row: ${({ $row }) => $row};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
  border-right: 1px solid #e5e7eb;
  border-bottom: ${({ $last }) => ($last ? "none" : "1px dashed #e5e7eb")};
  background: ${({ $isToday }) => ($isToday ? "#f8fff8" : "transparent")};

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
  }
`;

const DateLabel = styled.span`
  width: 64px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-align: center;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
`;

const TodayBadge = styled.span<{ $color: string }>`
  padding: 0.1rem 0.35rem;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 0.63rem;
  font-weight: 700;
`;

const DiaryInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  color: #111827;
  font-size: 0.95rem;
  outline: none;

  &::placeholder {
    color: #9ca3af;
  }
`;

const ChecklistCell = styled.div<{
  $row: number;
  $count: number;
  $last: boolean;
  $isToday: boolean;
}>`
  grid-column: 2;
  grid-row: ${({ $row }) => $row};
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(50px, 64px));
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-bottom: ${({ $last }) => ($last ? "none" : "1px dashed #e5e7eb")};
  background: ${({ $isToday }) => ($isToday ? "#f8fff8" : "transparent")};

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
    grid-template-columns: repeat(${({ $count }) => $count}, minmax(44px, 56px)) minmax(
        52px,
        auto
      );
  }
`;

const CheckButton = styled.button<{ $checked: boolean; $color: string }>`
  width: 44px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${({ $checked, $color }) => ($checked ? $color : "#d1d5db")};
  background: ${({ $checked, $color }) => ($checked ? `${$color}22` : "#fff")};
  color: ${({ $checked, $color }) => ($checked ? $color : "#6b7280")};
  font-size: 0.9rem;
  font-weight: 700;
`;

const MobileScoreText = styled.span`
  display: none;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 700;

  @media (max-width: 900px) {
    display: block;
    text-align: right;
  }
`;

const BackButton = styled.button`
  margin-top: 0.75rem;
  color: #2563eb;
  font-weight: 600;
`;

const TrendCell = styled.div<{ $rows: number }>`
  grid-column: 3;
  grid-row: 1 / span ${({ $rows }) => $rows};
  border-left: 1px solid #e5e7eb;
  padding: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;

  @media (max-width: 900px) {
    display: none;
  }
`;

const TrendSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

const TrendGridLine = styled.line`
  stroke: #e2e8f0;
  stroke-width: 1;
  stroke-dasharray: 4 4;
`;

const TrendScaleLabel = styled.text`
  fill: #94a3b8;
  font-size: 9px;
  font-weight: 600;
  text-anchor: middle;
`;

const TrendPath = styled.polyline<{ $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
`;

const TrendPoint = styled.circle<{ $isToday: boolean }>`
  fill: ${({ $isToday }) => ($isToday ? "#0ea5e9" : "#22c55e")};
  stroke: #fff;
  stroke-width: 2;
`;

const TrendPointLabel = styled.text<{ $isToday: boolean; $color: string }>`
  fill: ${({ $isToday, $color }) => ($isToday ? "#0284c7" : $color)};
  font-size: 9px;
  font-weight: 700;
`;
