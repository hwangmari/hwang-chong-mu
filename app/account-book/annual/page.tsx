"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { fetchAccountBookStore } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import { isCardSettlementEntry } from "../components/WorkspaceLedgerView/utils";
import {
  getWorkspaceById,
  resolveWorkspaceEntries,
} from "../storage";
import type { AccountBookStore, ViewMode } from "../types";

type AnnualKind = "income" | "expense" | "asset";
type PaymentKey = "cash" | "card" | "check_card";

const PAYMENT_META: Array<{ key: PaymentKey; label: string; color: string }> = [
  { key: "cash", label: "현금", color: "#4f7cff" },
  { key: "card", label: "카드", color: "#6b63e8" },
  { key: "check_card", label: "체크카드", color: "#3f8f8a" },
];

function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatCompactPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function resolveViewMode(value: string | null): ViewMode {
  if (value === "board" || value === "calendar" || value === "ledger") {
    return value;
  }
  return "ledger";
}

function buildBackUrl(workspaceId?: string, viewMode: ViewMode = "ledger") {
  if (!workspaceId) return "/account-book";
  return `/account-book?workspaceId=${workspaceId}&view=${viewMode}`;
}

function AccountBookAnnualContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<AccountBookStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const nextStore = await fetchAccountBookStore();
        if (!active) return;
        setStore(nextStore);
        setLoadError(null);
      } catch (error) {
        console.error("가계부 연간 데이터 불러오기 실패:", error);
        if (!active) return;
        setLoadError("연간 데이터를 불러오지 못했습니다.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const selectedYear = useMemo(() => {
    const nextYear = Number(searchParams.get("year"));
    if (Number.isFinite(nextYear) && nextYear > 2000 && nextYear < 3000) {
      return nextYear;
    }
    return new Date().getFullYear();
  }, [searchParams]);

  const kind = useMemo<AnnualKind>(() => {
    const nextKind = searchParams.get("kind");
    if (
      nextKind === "income" ||
      nextKind === "expense" ||
      nextKind === "asset"
    ) {
      return nextKind;
    }
    return "expense";
  }, [searchParams]);

  const workspaceId = searchParams.get("workspaceId") || "";
  const returnViewMode = resolveViewMode(searchParams.get("view"));
  const memberId = searchParams.get("memberId") || "";
  const workspace = store ? getWorkspaceById(store, workspaceId) : null;
  const selectedParticipant =
    store?.users.find((user) => user.id === memberId) || null;
  const workspaceEntries = useMemo(
    () => (store && workspace ? resolveWorkspaceEntries(store, workspace.id) : []),
    [store, workspace],
  );
  const scopedEntries = useMemo(() => {
    if (!workspace || workspace.type !== "shared" || !memberId) {
      return workspaceEntries;
    }

    return workspaceEntries.filter(
      (entry) =>
        entry.createdByUserId === memberId ||
        entry.member === selectedParticipant?.name,
    );
  }, [memberId, selectedParticipant?.name, workspace, workspaceEntries]);

  const annualEntries = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    return scopedEntries.filter((entry) => entry.date.startsWith(yearPrefix));
  }, [scopedEntries, selectedYear]);

  const filteredEntries = useMemo(() => {
    if (kind === "income")
      return annualEntries.filter((entry) => entry.type === "income");
    if (kind === "asset") {
      return annualEntries.filter(
        (entry) => entry.type === "expense" && entry.category.trim() === "저축",
      );
    }
    return annualEntries.filter(
      (entry) =>
        entry.type === "expense" &&
        entry.category.trim() !== "저축" &&
        !isCardSettlementEntry(entry),
    );
  }, [annualEntries, kind]);

  const total = useMemo(
    () => filteredEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [filteredEntries],
  );

  const monthlyRows = useMemo(() => {
    const grouped = filteredEntries.reduce<
      Record<
        string,
        { amount: number; count: number; payments: Record<PaymentKey, number> }
      >
    >((acc, entry) => {
      const month = entry.date.slice(5, 7);
      if (!acc[month]) {
        acc[month] = {
          amount: 0,
          count: 0,
          payments: { cash: 0, card: 0, check_card: 0 },
        };
      }
      acc[month].amount += entry.amount;
      acc[month].count += 1;
      acc[month].payments[entry.payment] += entry.amount;
      return acc;
    }, {});

    return Array.from({ length: 12 }, (_, index) => {
      const mm = String(index + 1).padStart(2, "0");
      const target = grouped[mm] || { amount: 0, count: 0 };
      return {
        month: `${index + 1}월`,
        amount: target.amount,
        count: target.count,
        payments: target.payments || { cash: 0, card: 0, check_card: 0 },
      };
    });
  }, [filteredEntries]);

  const annualPaymentTotals = useMemo(() => {
    return filteredEntries.reduce<Record<PaymentKey, number>>(
      (acc, entry) => {
        acc[entry.payment] += entry.amount;
        return acc;
      },
      { cash: 0, card: 0, check_card: 0 },
    );
  }, [filteredEntries]);

  const maxMonthlyAmount = Math.max(...monthlyRows.map((row) => row.amount), 0);

  const activeMonthCount = useMemo(
    () => monthlyRows.filter((row) => row.amount > 0).length,
    [monthlyRows],
  );

  const averageMonthlyAmount = activeMonthCount > 0 ? total / activeMonthCount : 0;

  const topMonthRow = useMemo(
    () =>
      monthlyRows.reduce<(typeof monthlyRows)[number] | null>((maxRow, row) => {
        if (!maxRow || row.amount > maxRow.amount) return row;
        return maxRow;
      }, null),
    [monthlyRows],
  );

  const categoryRows = useMemo(() => {
    const grouped = filteredEntries.reduce<Record<string, number>>((acc, entry) => {
      const key =
        kind === "asset"
          ? entry.subCategory?.trim() || entry.item.trim() || entry.category.trim() || "기타"
          : entry.category.trim() || "기타";
      acc[key] = (acc[key] || 0) + entry.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({
        label,
        amount,
        ratio: total > 0 ? (amount / total) * 100 : 0,
      }));
  }, [filteredEntries, kind, total]);

  const latestEntryDate = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return [...filteredEntries]
      .sort((a, b) => b.date.localeCompare(a.date))[0]
      ?.date;
  }, [filteredEntries]);

  const entriesByMonth = useMemo(() => {
    const filteredMonthlyRows = selectedMonth
      ? monthlyRows.filter((row) => row.month === selectedMonth)
      : monthlyRows;

    return filteredMonthlyRows
      .map((row) => {
        const monthNumber = Number(row.month.replace("월", ""));
        const mm = String(monthNumber).padStart(2, "0");
        const monthEntries = filteredEntries
          .filter((entry) => entry.date.slice(5, 7) === mm)
          .sort((a, b) => b.date.localeCompare(a.date));
        return { month: row.month, entries: monthEntries };
      })
      .filter((row) => row.entries.length > 0);
  }, [filteredEntries, monthlyRows, selectedMonth]);

  const kindLabel =
    kind === "income" ? "수입" : kind === "asset" ? "저축" : "지출";
  const kindDescription =
    kind === "income"
      ? "월별 유입 흐름과 어떤 항목에서 수입이 발생했는지 정리했어요."
      : kind === "asset"
        ? "저축이 어느 달에 얼마나 쌓였는지 목표 관점으로 확인할 수 있어요."
        : "월별 지출 흐름과 결제 수단, 많이 쓴 분류를 한 번에 볼 수 있어요.";
  const backButtonLabel =
    returnViewMode === "board"
      ? "보드로 돌아가기"
      : returnViewMode === "calendar"
        ? "캘린더로 돌아가기"
        : "리스트로 돌아가기";

  if (isLoading) {
    return (
      <StPage>
        <StCard>
          <StSectionTitle>연간 상세를 불러오는 중...</StSectionTitle>
        </StCard>
      </StPage>
    );
  }

  if (loadError || !store) {
    return (
      <StPage>
        <StCard>
          <StSectionTitle>연간 상세를 열 수 없습니다.</StSectionTitle>
          <StEmpty>{loadError || "연간 데이터를 불러오지 못했습니다."}</StEmpty>
          <StBackButton
            type="button"
            onClick={() => router.push(buildBackUrl(workspaceId, returnViewMode))}
          >
            {backButtonLabel}
          </StBackButton>
        </StCard>
      </StPage>
    );
  }

  if (!workspace) {
    return (
      <StPage>
        <StCard>
          <StSectionTitle>연간 상세를 열 수 없습니다.</StSectionTitle>
          <StEmpty>
            워크스페이스 정보가 없습니다. 허브에서 다시 선택해주세요.
          </StEmpty>
          <StBackButton
            type="button"
            onClick={() => router.push(buildBackUrl(workspaceId, returnViewMode))}
          >
            {backButtonLabel}
          </StBackButton>
        </StCard>
      </StPage>
    );
  }

  return (
    <AccountBookLockGate
      password={workspace.password}
      accessKey={`hwang-account-book-access-${workspace.id}`}
      title={`${workspace.name} 비밀번호`}
      description="연간 상세도 같은 비밀번호로 확인합니다."
      backToHome={false}
      onBack={() => router.push(buildBackUrl(workspace.id, returnViewMode))}
    >
      <StPage>
        <StHeader>
          <StBackButton
            type="button"
            onClick={() => router.push(buildBackUrl(workspace.id, returnViewMode))}
          >
            {backButtonLabel}
          </StBackButton>
          <div>
            <StEyebrow>{selectedYear}년 {kindLabel} 연간 상세</StEyebrow>
            <StTitle>
              {workspace.name}
              {selectedParticipant ? ` · ${selectedParticipant.name}` : ""}
            </StTitle>
            <StHeaderDescription>{kindDescription}</StHeaderDescription>
          </div>
        </StHeader>

        <StHeroCard>
          <div>
            <StSectionTitle>{kindLabel} 합계</StSectionTitle>
            <StTotal>{formatAmount(total)}</StTotal>
            <StHeroDescription>
              {selectedMonth
                ? `${selectedMonth}만 보고 있어요. 다시 누르면 전체 연도로 돌아갑니다.`
                : "월별 흐름을 눌러 해당 월만 좁혀볼 수 있어요."}
            </StHeroDescription>
          </div>
          <StStatGrid>
            <StStatCard>
              <span>월평균</span>
              <strong>{formatAmount(Math.round(averageMonthlyAmount))}</strong>
            </StStatCard>
            <StStatCard>
              <span>가장 큰 달</span>
              <strong>
                {topMonthRow && topMonthRow.amount > 0
                  ? `${topMonthRow.month} · ${formatAmount(topMonthRow.amount)}`
                  : "-"}
              </strong>
            </StStatCard>
            <StStatCard>
              <span>기록된 월</span>
              <strong>{activeMonthCount}개월</strong>
            </StStatCard>
            <StStatCard>
              <span>최근 등록일</span>
              <strong>{latestEntryDate || "-"}</strong>
            </StStatCard>
          </StStatGrid>
        </StHeroCard>

        <StInsightGrid>
          <StCard>
            <StSectionHeader>
              <StSectionTitle>월별 흐름</StSectionTitle>
              {selectedMonth ? (
                <StFilterChip
                  type="button"
                  onClick={() => setSelectedMonth(null)}
                >
                  {selectedMonth} 필터 해제
                </StFilterChip>
              ) : null}
            </StSectionHeader>
            {monthlyRows.every((row) => row.amount === 0) ? (
              <StEmpty>해당 연도 내역이 없습니다.</StEmpty>
            ) : (
              <StMonthlyList>
                {monthlyRows.map((row) => {
                  const isActive = selectedMonth === row.month;
                  const ratio =
                    row.amount > 0 && maxMonthlyAmount > 0
                      ? (row.amount / maxMonthlyAmount) * 100
                      : 0;

                  return (
                    <StMonthLine
                      key={row.month}
                      type="button"
                      $active={isActive}
                      onClick={() =>
                        setSelectedMonth((prev) =>
                          prev === row.month ? null : row.month,
                        )
                      }
                    >
                      <strong>{row.month}</strong>
                      <span>{row.count}건</span>
                      <em>{formatAmount(row.amount)}</em>
                      <div className="track">
                        <div
                          className="fill"
                          style={{ width: `${Math.max(ratio, row.amount > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </StMonthLine>
                  );
                })}
              </StMonthlyList>
            )}
          </StCard>

          <StSideColumn>
            <StCard>
              <StSectionTitle>결제 수단 비중</StSectionTitle>
              <StPaymentLegend>
                {PAYMENT_META.map((payment) => {
                  const value = annualPaymentTotals[payment.key];
                  const ratio = total > 0 ? (value / total) * 100 : 0;

                  return (
                    <StLegendItem key={payment.key}>
                      <div className="info">
                        <span
                          className="dot"
                          style={{ background: payment.color }}
                        />
                        <strong>{payment.label}</strong>
                      </div>
                      <div className="meta">
                        <em>{formatAmount(value)}</em>
                        <span>{formatCompactPercent(ratio)}</span>
                      </div>
                    </StLegendItem>
                  );
                })}
              </StPaymentLegend>
            </StCard>

            <StCard>
              <StSectionTitle>많이 나온 분류</StSectionTitle>
              {categoryRows.length === 0 ? (
                <StEmpty>분류할 데이터가 없습니다.</StEmpty>
              ) : (
                <StCategoryList>
                  {categoryRows.map((row) => (
                    <StCategoryItem key={row.label}>
                      <div>
                        <strong>{row.label}</strong>
                        <span>{formatCompactPercent(row.ratio)}</span>
                      </div>
                      <em>{formatAmount(row.amount)}</em>
                    </StCategoryItem>
                  ))}
                </StCategoryList>
              )}
            </StCard>
          </StSideColumn>
        </StInsightGrid>

        <StCard>
          <StSectionHeader>
            <StSectionTitle>월별 상세 내역</StSectionTitle>
            <StSectionMeta>
              {selectedMonth ? `${selectedMonth}만 보는 중` : `${selectedYear}년 전체`}
            </StSectionMeta>
          </StSectionHeader>
          <StAccordionList>
            {entriesByMonth.length === 0 ? (
              <StEmpty>해당 조건에 맞는 내역이 없습니다.</StEmpty>
            ) : (
              entriesByMonth.map((row) => {
                const isOpen = openAccordions[row.month] ?? true;
                return (
                  <StAccordion key={row.month}>
                    <StAccordionButton
                      type="button"
                      onClick={() =>
                        setOpenAccordions((prev) => ({
                          ...prev,
                          [row.month]: !isOpen,
                        }))
                      }
                    >
                      <strong>{row.month}</strong>
                      <span>{row.entries.length}건</span>
                    </StAccordionButton>
                    {isOpen && (
                      <StEntryList>
                        {row.entries.map((entry) => (
                          <StEntryItem key={entry.resolvedId}>
                            <div>
                              <strong>{entry.item}</strong>
                              <p>
                                {entry.date} · {entry.member || "작성자 미상"} ·{" "}
                                {entry.category}
                              </p>
                            </div>
                            <em>{formatAmount(entry.amount)}</em>
                          </StEntryItem>
                        ))}
                      </StEntryList>
                    )}
                  </StAccordion>
                );
              })
            )}
          </StAccordionList>
        </StCard>
      </StPage>
    </AccountBookLockGate>
  );
}

export default function AccountBookAnnualPage() {
  return (
    <Suspense fallback={<StPage>연간 화면을 준비하는 중...</StPage>}>
      <AccountBookAnnualContent />
    </Suspense>
  );
}

const StPage = styled.main`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  overflow: auto;
  overscroll-behavior: none;
  min-height: 100vh;
  background: #f5f7fb;
  padding: 1rem;
`;

const StHeader = styled.header`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StEyebrow = styled.p`
  font-size: 0.78rem;
  font-weight: 800;
  color: #6075b7;
`;

const StBackButton = styled.button`
  border: none;
  border-radius: 999px;
  background: #fff;
  color: #53647c;
  padding: 0.55rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 800;
`;

const StTitle = styled.h1`
  margin-top: 0.2rem;
  font-size: 1.3rem;
  font-weight: 900;
  color: #1f2937;
`;

const StHeaderDescription = styled.p`
  margin-top: 0.3rem;
  font-size: 0.84rem;
  color: #6f7e92;
`;

const StHeroCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 1.05fr);
  gap: 0.9rem;
  border-radius: 24px;
  border: 1px solid #d7e0f1;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.96));
  padding: 1rem;
  margin-bottom: 0.9rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StHeroDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.84rem;
  color: #6f7f95;
`;

const StInsightGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.82fr);
  gap: 0.9rem;
  margin-bottom: 0.9rem;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const StCard = styled.section`
  border-radius: 24px;
  border: 1px solid #dbe4ef;
  background: rgba(255, 255, 255, 0.94);
  padding: 1rem;
`;

const StSideColumn = styled.div`
  display: grid;
  gap: 0.9rem;
  align-content: start;
`;

const StSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 900;
  color: #223247;
`;

const StSectionMeta = styled.span`
  font-size: 0.78rem;
  color: #74839a;
  font-weight: 700;
`;

const StTotal = styled.strong`
  display: block;
  margin-top: 0.8rem;
  font-size: 2rem;
  font-weight: 900;
  color: #304e95;
`;

const StStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
`;

const StStatCard = styled.div`
  border: 1px solid #dfe7f3;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.9rem;

  span {
    display: block;
    font-size: 0.78rem;
    color: #75849a;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 0.32rem;
    font-size: 1rem;
    font-weight: 900;
    color: #213454;
    line-height: 1.4;
  }
`;

const StPaymentLegend = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

const StLegendItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: #55657d;

  .info {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 999px;
  }

  strong {
    min-width: 4rem;
  }

  em {
    font-style: normal;
    font-weight: 800;
  }

  span {
    color: #8592a4;
    font-weight: 700;
  }
`;

const StFilterChip = styled.button`
  border: 1px solid #d6e2ff;
  border-radius: 999px;
  background: #eff4ff;
  color: #5067a6;
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
`;

const StMonthlyList = styled.div`
  margin-top: 1rem;
  display: grid;
  gap: 0.55rem;
`;

const StMonthLine = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#9db4f7" : "#dbe4ef")};
  border-radius: 18px;
  background: ${({ $active }) => ($active ? "#eef3ff" : "#fbfdff")};
  padding: 0.8rem 0.9rem;
  display: grid;
  grid-template-columns: 0.62fr 0.42fr 0.9fr minmax(120px, 1fr);
  align-items: center;
  gap: 0.7rem;

  strong {
    font-size: 0.9rem;
    font-weight: 900;
    color: #213454;
    text-align: left;
  }

  span {
    font-size: 0.76rem;
    color: #7a8799;
    font-weight: 700;
    text-align: left;
  }

  em {
    font-style: normal;
    font-weight: 900;
    color: #325099;
    text-align: right;
  }

  .track {
    width: 100%;
    height: 0.5rem;
    border-radius: 999px;
    background: #edf2fb;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(180deg, #7ea4f2, #5c7fdd);
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    justify-items: start;

    em {
      text-align: left;
    }
  }
`;

const StCategoryList = styled.div`
  margin-top: 0.9rem;
  display: grid;
  gap: 0.55rem;
`;

const StCategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid #e5ebf4;
  border-radius: 16px;
  padding: 0.75rem 0.85rem;

  div {
    display: grid;
    gap: 0.18rem;
  }

  strong {
    font-size: 0.84rem;
    color: #223247;
    font-weight: 900;
  }

  span {
    font-size: 0.74rem;
    color: #7b899b;
    font-weight: 700;
  }

  em {
    font-style: normal;
    white-space: nowrap;
    color: #325099;
    font-weight: 900;
  }
`;

const StAccordionList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 0.9rem;
`;

const StAccordion = styled.article`
  border: 1px solid #e2e9f2;
  border-radius: 18px;
  overflow: hidden;
`;

const StAccordionButton = styled.button`
  width: 100%;
  border: none;
  background: #f8fbff;
  padding: 0.8rem 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #24364d;

  strong {
    font-size: 0.9rem;
    font-weight: 900;
  }

  span {
    font-size: 0.76rem;
    color: #728197;
    font-weight: 800;
  }
`;

const StEntryList = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.8rem;
`;

const StEntryItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid #edf2f7;
  border-radius: 14px;
  padding: 0.7rem 0.8rem;

  strong {
    font-size: 0.88rem;
    color: #1f2937;
  }

  p {
    margin-top: 0.2rem;
    font-size: 0.76rem;
    color: #78879b;
  }

  em {
    font-style: normal;
    font-weight: 800;
    color: #304e95;
    white-space: nowrap;
  }
`;

const StEmpty = styled.p`
  margin-top: 0.85rem;
  font-size: 0.84rem;
  color: #8693a5;
`;
