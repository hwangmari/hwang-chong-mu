"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { fetchAccountBookStore } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import {
  getWorkspaceById,
  resolveWorkspaceEntries,
} from "../storage";
import type { AccountBookStore } from "../types";

type AnnualKind = "income" | "expense" | "asset";
type PaymentKey = "cash" | "card" | "check_card";

const PAYMENT_META: Array<{ key: PaymentKey; label: string; color: string }> = [
  { key: "cash", label: "현금", color: "#67b182" },
  { key: "card", label: "카드", color: "#6d87ef" },
  { key: "check_card", label: "체크카드", color: "#d08b5b" },
];

function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function buildBackUrl(workspaceId?: string) {
  if (!workspaceId) return "/account-book";
  return `/account-book?workspaceId=${workspaceId}`;
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
      (entry) => entry.type === "expense" && entry.category.trim() !== "저축",
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
    kind === "income" ? "수입" : kind === "asset" ? "자산" : "지출";

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
            onClick={() => router.push(buildBackUrl(workspaceId))}
          >
            허브로 돌아가기
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
            onClick={() => router.push(buildBackUrl(workspaceId))}
          >
            허브로 돌아가기
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
      onBack={() => router.push(buildBackUrl(workspace.id))}
    >
      <StPage>
        <StHeader>
          <StBackButton
            type="button"
            onClick={() => router.push(buildBackUrl(workspace.id))}
          >
            뒤로
          </StBackButton>
          <StTitle>
            {workspace.name}
            {selectedParticipant ? ` · ${selectedParticipant.name}` : ""}
            {" · "}
            {selectedYear}년 {kindLabel} 연간 상세
          </StTitle>
        </StHeader>

        <StSplit>
          <StCard>
            <StSectionTitle>연간 요약</StSectionTitle>
            <StTotal>{formatAmount(total)}</StTotal>
            <StPaymentLegend>
              {PAYMENT_META.map((payment) => {
                const value = annualPaymentTotals[payment.key];
                return (
                  <StLegendItem key={payment.key}>
                    <span
                      className="dot"
                      style={{ background: payment.color }}
                    />
                    <strong>{payment.label}</strong>
                    <em>{formatAmount(value)}</em>
                  </StLegendItem>
                );
              })}
            </StPaymentLegend>
            {total === 0 ? (
              <StEmpty>연간 요약 그래프 데이터가 없습니다.</StEmpty>
            ) : (
              <StChartWrap>
                {monthlyRows.map((row) => {
                  const height =
                    row.amount > 0 && maxMonthlyAmount > 0
                      ? `${Math.max((row.amount / maxMonthlyAmount) * 100, 6)}%`
                      : "4px";
                  const isActive = selectedMonth === row.month;
                  return (
                    <StChartColumn
                      key={row.month}
                      type="button"
                      $active={isActive}
                      onClick={() =>
                        setSelectedMonth((prev) =>
                          prev === row.month ? null : row.month,
                        )
                      }
                    >
                      <div className="bar" style={{ height }} />
                      <span>{row.month}</span>
                    </StChartColumn>
                  );
                })}
              </StChartWrap>
            )}
          </StCard>

          <StCard>
            <StSectionTitle>월별 상세</StSectionTitle>
            <StAccordionList>
              {entriesByMonth.length === 0 ? (
                <StEmpty>해당 연도 내역이 없습니다.</StEmpty>
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
                                  {entry.date} · {entry.member || "작성자 미상"}{" "}
                                  · {entry.category}
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
        </StSplit>
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
  align-items: center;
  margin-bottom: 1rem;
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
  font-size: 1.3rem;
  font-weight: 900;
  color: #1f2937;
`;

const StSplit = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
`;

const StCard = styled.section`
  border-radius: 24px;
  border: 1px solid #dbe4ef;
  background: rgba(255, 255, 255, 0.94);
  padding: 1rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 900;
  color: #223247;
`;

const StTotal = styled.strong`
  display: block;
  margin-top: 0.8rem;
  font-size: 2rem;
  font-weight: 900;
  color: #304e95;
`;

const StPaymentLegend = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

const StLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  color: #55657d;

  .dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 999px;
  }

  strong {
    min-width: 4rem;
  }

  em {
    margin-left: auto;
    font-style: normal;
    font-weight: 800;
  }
`;

const StChartWrap = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.45rem;
  min-height: 14rem;
  align-items: end;
`;

const StChartColumn = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#9db4f7" : "#dbe4ef")};
  border-radius: 16px;
  background: ${({ $active }) => ($active ? "#eef3ff" : "#f8fbff")};
  padding: 0.55rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;

  .bar {
    width: 100%;
    border-radius: 999px;
    background: linear-gradient(180deg, #7ea4f2, #5c7fdd);
    min-height: 4px;
  }

  span {
    font-size: 0.7rem;
    font-weight: 800;
    color: #60718a;
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
