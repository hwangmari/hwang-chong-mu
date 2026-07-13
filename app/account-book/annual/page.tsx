"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import styled from "styled-components";
import { fetchAccountBookStore } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import AssetBoardSection from "../components/AssetBoardSection";
import AssetAnnualFlow from "../components/AssetAnnualFlow";
import { useAssetData } from "../hooks/useAssetData";
import {
  formatAmount,
  getRepresentativeCategory,
  isCardSettlementEntry,
  isSavingsCategory,
} from "../components/WorkspaceLedgerView/utils";
import {
  getWorkspaceById,
  resolveWorkspaceEntries,
} from "../storage";
import type { AccountBookStore, ViewMode } from "../types";

type AnnualKind = "income" | "expense" | "asset";
type PaymentKey = "cash" | "card" | "check_card";

const PAYMENT_META: Array<{ key: PaymentKey; label: string; color: string }> = [
  { key: "cash", label: "현금", color: "#868a92" },
  { key: "card", label: "카드", color: "#888c94" },
  { key: "check_card", label: "체크카드", color: "#3f8f8a" },
];

function formatCompactPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function resolveViewMode(value: string | null): ViewMode {
  if (value === "board" || value === "calendar" || value === "ledger") {
    return value;
  }
  return "calendar";
}

function buildBackUrl(workspaceId?: string, viewMode: ViewMode = "calendar") {
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
  // 연간 상세 진입 시 기본적으로 금액을 가린다(프라이버시). 토글로 열람.
  const [isAmountHidden, setIsAmountHidden] = useState(true);
  const maskAmount = (value: number) =>
    isAmountHidden ? "•••••" : formatAmount(value);

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
  const changeYear = (delta: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(selectedYear + delta));
    router.replace(`/account-book/annual?${params.toString()}`);
  };
  const memberId = searchParams.get("memberId") || "";
  const workspace = store ? getWorkspaceById(store, workspaceId) : null;
  const selectedParticipant =
    store?.users.find((user) => user.id === memberId) || null;
  const assetActorUserId =
    workspace?.ownerUserId || memberId || store?.users[0]?.id || "";
  // 통장 관리·축적 흐름이 같은 인스턴스를 공유하도록 상위에서 관리(입금 즉시 양쪽 반영)
  const asset = useAssetData(
    kind === "asset" ? workspaceId : null,
    assetActorUserId,
  );
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

  // 자산 축적 흐름 = [통장 수동 입금·출금] + [가계부 자산/저축 내역]
  // ledger 타입 변동은 가계부 내역의 미러본이라 이중집계 방지를 위해 제외한다.
  const assetFlowItems = useMemo(() => {
    const changeFlow = asset.changes
      .filter(
        (change) =>
          change.changeType === "deposit" ||
          change.changeType === "withdraw",
      )
      .map((change) => ({ date: change.date, amount: change.amount }));
    const ledgerFlow = scopedEntries
      .filter(
        (entry) =>
          entry.type === "expense" && isSavingsCategory(entry.category),
      )
      .map((entry) => ({ date: entry.date, amount: entry.amount }));
    return [...changeFlow, ...ledgerFlow];
  }, [asset.changes, scopedEntries]);

  const assetFlowRows = useMemo(() => {
    const prefix = `${selectedYear}-`;
    let cumulative = assetFlowItems
      .filter((item) => item.date < prefix)
      .reduce((sum, item) => sum + item.amount, 0);
    return Array.from({ length: 12 }, (_, index) => {
      const mm = String(index + 1).padStart(2, "0");
      const monthPrefix = `${selectedYear}-${mm}`;
      const monthly = assetFlowItems
        .filter((item) => item.date.startsWith(monthPrefix))
        .reduce((sum, item) => sum + item.amount, 0);
      cumulative += monthly;
      return {
        monthNumber: index + 1,
        monthLabel: `${index + 1}월`,
        monthly,
        cumulative,
      };
    });
  }, [assetFlowItems, selectedYear]);

  const assetFlowTotal = useMemo(
    () => assetFlowItems.reduce((sum, item) => sum + item.amount, 0),
    [assetFlowItems],
  );

  const annualEntries = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    return scopedEntries.filter((entry) => entry.date.startsWith(yearPrefix));
  }, [scopedEntries, selectedYear]);

  const filteredEntries = useMemo(() => {
    if (kind === "income")
      return annualEntries.filter((entry) => entry.type === "income");
    if (kind === "asset") {
      return annualEntries.filter(
        (entry) => entry.type === "expense" && isSavingsCategory(entry.category),
      );
    }
    return annualEntries.filter(
      (entry) =>
        entry.type === "expense" &&
        !isSavingsCategory(entry.category) &&
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

  const selectedMonthCode = useMemo(() => {
    if (!selectedMonth) return null;
    const monthNumber = Number(selectedMonth.replace("월", ""));
    if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return null;
    }
    return String(monthNumber).padStart(2, "0");
  }, [selectedMonth]);

  const insightEntries = useMemo(() => {
    if (!selectedMonthCode) return filteredEntries;
    return filteredEntries.filter((entry) => entry.date.slice(5, 7) === selectedMonthCode);
  }, [filteredEntries, selectedMonthCode]);

  const insightTotal = useMemo(
    () => insightEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [insightEntries],
  );

  // 월별 상세 내역: 개별 나열 대신 카테고리별로 묶어 요약(펼치면 개별).
  const insightCategoryGroups = useMemo(() => {
    const map = insightEntries.reduce<
      Record<
        string,
        {
          category: string;
          count: number;
          total: number;
          entries: typeof insightEntries;
        }
      >
    >((acc, entry) => {
      const category =
        kind === "asset"
          ? entry.subCategory?.trim() ||
            entry.item?.trim() ||
            entry.category.trim() ||
            "기타"
          : getRepresentativeCategory(entry.category, entry.type);
      if (!acc[category]) {
        acc[category] = { category, count: 0, total: 0, entries: [] };
      }
      acc[category].count += 1;
      acc[category].total += entry.amount;
      acc[category].entries.push(entry);
      return acc;
    }, {});
    return Object.values(map)
      .map((group) => ({
        ...group,
        entries: group.entries
          .slice()
          .sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total);
  }, [insightEntries, kind]);

  const paymentTotals = useMemo(() => {
    return insightEntries.reduce<Record<PaymentKey, number>>(
      (acc, entry) => {
        acc[entry.payment] += entry.amount;
        return acc;
      },
      { cash: 0, card: 0, check_card: 0 },
    );
  }, [insightEntries]);

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

  const incomeSourceRows = useMemo(() => {
    const grouped = insightEntries.reduce<Record<string, number>>((acc, entry) => {
      const key =
        entry.subCategory?.trim() ||
        entry.item?.trim() ||
        entry.merchant?.trim() ||
        getRepresentativeCategory(entry.category, entry.type) ||
        "기타 수입";
      acc[key] = (acc[key] || 0) + entry.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, amount]) => ({
        label,
        amount,
        ratio: insightTotal > 0 ? (amount / insightTotal) * 100 : 0,
      }));
  }, [insightEntries, insightTotal]);

  const incomeMemberRows = useMemo(() => {
    const grouped = insightEntries.reduce<Record<string, number>>((acc, entry) => {
      const key = entry.member?.trim() || "작성자 미상";
      acc[key] = (acc[key] || 0) + entry.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount]) => ({
        label,
        amount,
        ratio: insightTotal > 0 ? (amount / insightTotal) * 100 : 0,
      }));
  }, [insightEntries, insightTotal]);

  const latestEntryDate = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return [...filteredEntries]
      .sort((a, b) => b.date.localeCompare(a.date))[0]
      ?.date;
  }, [filteredEntries]);

  const kindLabel =
    kind === "income" ? "수입" : kind === "asset" ? "자산/저축" : "지출";
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
          <StHeaderLeft>
            <StBackButton
              type="button"
              aria-label="뒤로 가기"
              onClick={() =>
                router.push(buildBackUrl(workspace.id, returnViewMode))
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m14.71 6.71-1.42-1.42L6.59 12l6.7 6.71 1.42-1.42L9.41 12z" />
              </svg>
            </StBackButton>
          </StHeaderLeft>
          <StHeaderCenter>
            <StYearNav>
              <button
                type="button"
                aria-label="이전 연도"
                onClick={() => changeYear(-1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <StEyebrow>{selectedYear}년 {kindLabel} 연간 상세</StEyebrow>
              <button
                type="button"
                aria-label="다음 연도"
                onClick={() => changeYear(1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
              </button>
            </StYearNav>
          </StHeaderCenter>
          <StAmountToggle
            type="button"
            onClick={() => setIsAmountHidden((prev) => !prev)}
            aria-pressed={!isAmountHidden}
          >
            {isAmountHidden ? "금액 보기" : "금액 숨기기"}
          </StAmountToggle>
        </StHeader>

        <StHeroCard>
          <div>
            <StSectionTitle>{kindLabel} 합계</StSectionTitle>
            <StTotal>{maskAmount(total)}</StTotal>
            <StHeroDescription>
              {kind === "asset"
                ? "연금 카테고리별 목표를 넣고 현재 누적 금액이 얼마나 찼는지 바로 확인할 수 있어요."
                : selectedMonth
                ? `${selectedMonth}만 보고 있어요. 다시 누르면 전체 연도로 돌아갑니다.`
                : "월별 흐름을 눌러 해당 월만 좁혀볼 수 있어요."}
            </StHeroDescription>
          </div>
          <StStatGrid>
            <StStatCard>
              <span>월평균</span>
              <strong>{maskAmount(Math.round(averageMonthlyAmount))}</strong>
            </StStatCard>
            <StStatCard>
              <span>가장 큰 달</span>
              <strong>
                {topMonthRow && topMonthRow.amount > 0
                  ? `${topMonthRow.month} · ${maskAmount(topMonthRow.amount)}`
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

        {kind === "asset" ? (
          <StInsightGrid>
            <AssetBoardSection
              asset={asset}
              currentYear={selectedYear}
              isAmountHidden={isAmountHidden}
            />
            <AssetAnnualFlow
              rows={assetFlowRows}
              totalSavings={assetFlowTotal}
              annualGoal={workspace?.annualSavingGoal || 0}
              isLoading={asset.isLoading}
              year={selectedYear}
              isAmountHidden={isAmountHidden}
            />
          </StInsightGrid>
        ) : null}

        {(
          <StInsightGrid>
              <StCard>
                <StSectionHeader>
                  <StSectionTitle>월별 흐름</StSectionTitle>
                  <StSectionHeaderActions>
                    {selectedMonth ? (
                      <StFilterChip
                        type="button"
                        onClick={() => setSelectedMonth(null)}
                      >
                        {selectedMonth} 필터 해제
                      </StFilterChip>
                    ) : (
                      <StFilterChipPlaceholder aria-hidden="true" />
                    )}
                  </StSectionHeaderActions>
                </StSectionHeader>
              {monthlyRows.every((row) => row.amount === 0) ? (
                <StEmpty>해당 연도 내역이 없습니다.</StEmpty>
              ) : (
                <>
                <StMonthChart>
                  {monthlyRows.map((row) => {
                    const isActive = selectedMonth === row.month;
                    const height =
                      row.amount > 0 && maxMonthlyAmount > 0
                        ? Math.max((row.amount / maxMonthlyAmount) * 96, 6)
                        : 2;
                    return (
                      <StMonthChartCol
                        key={`chart-${row.month}`}
                        type="button"
                        $active={isActive}
                        onClick={() =>
                          setSelectedMonth((prev) =>
                            prev === row.month ? null : row.month,
                          )
                        }
                        title={`${row.month} ${maskAmount(row.amount)}`}
                      >
                        <StMonthChartTrack>
                          <StMonthChartBar
                            style={{ height: `${height}px` }}
                            $active={isActive}
                            $empty={row.amount === 0}
                          />
                        </StMonthChartTrack>
                        <StMonthChartLabel $active={isActive}>
                          {row.month.replace("월", "")}
                        </StMonthChartLabel>
                      </StMonthChartCol>
                    );
                  })}
                </StMonthChart>
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
                        <div className="track">
                          <div
                            className="fill"
                            style={{ width: `${Math.max(ratio, row.amount > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <em>{maskAmount(row.amount)}</em>
                      </StMonthLine>
                    );
                  })}
                </StMonthlyList>
                </>
              )}
            </StCard>

            <StSideColumn>
              {kind === "income" ? (
                <>
                  <StCard>
                    <StSectionHeader>
                      <StSectionTitle>들어온 항목</StSectionTitle>
                      <StSectionMeta>
                        {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
                      </StSectionMeta>
                    </StSectionHeader>
                    {incomeSourceRows.length === 0 ? (
                      <StEmpty>수입 항목 데이터가 없습니다.</StEmpty>
                    ) : (
                      <StCategoryList>
                        {incomeSourceRows.map((row) => (
                          <StCategoryItem key={row.label}>
                            <div>
                              <strong>{row.label}</strong>
                              <span>{formatCompactPercent(row.ratio)}</span>
                            </div>
                            <em>{maskAmount(row.amount)}</em>
                          </StCategoryItem>
                        ))}
                      </StCategoryList>
                    )}
                  </StCard>

                  <StCard>
                    <StSectionHeader>
                      <StSectionTitle>기록한 사람</StSectionTitle>
                      <StSectionMeta>
                        {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
                      </StSectionMeta>
                    </StSectionHeader>
                    {incomeMemberRows.length === 0 ? (
                      <StEmpty>작성자 데이터가 없습니다.</StEmpty>
                    ) : (
                      <StCategoryList>
                        {incomeMemberRows.map((row) => (
                          <StCategoryItem key={row.label}>
                            <div>
                              <strong>{row.label}</strong>
                              <span>{formatCompactPercent(row.ratio)}</span>
                            </div>
                            <em>{maskAmount(row.amount)}</em>
                          </StCategoryItem>
                        ))}
                      </StCategoryList>
                    )}
                  </StCard>
                </>
              ) : (
                <>
                  {kind !== "asset" ? (
                    <StCard>
                      <StSectionHeader>
                        <StSectionTitle>결제 수단 비중</StSectionTitle>
                        <StSectionMeta>
                          {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
                        </StSectionMeta>
                      </StSectionHeader>
                      <StPaymentLegend>
                        {PAYMENT_META.map((payment) => {
                          const value = paymentTotals[payment.key];
                          const ratio = insightTotal > 0 ? (value / insightTotal) * 100 : 0;

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
                                <em>{maskAmount(value)}</em>
                                <span>{formatCompactPercent(ratio)}</span>
                              </div>
                            </StLegendItem>
                          );
                        })}
                      </StPaymentLegend>
                    </StCard>
                  ) : null}

                  <StCard>
                    <StSectionHeader>
                      <StSectionTitle>많이 나온 분류</StSectionTitle>
                      <StSectionMeta>
                        {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
                      </StSectionMeta>
                    </StSectionHeader>
                    {insightCategoryGroups.length === 0 ? (
                      <StEmpty>분류할 데이터가 없습니다.</StEmpty>
                    ) : (
                      <StCatSummaryList>
                        {insightCategoryGroups.map((group) => {
                          const isOpen =
                            openAccordions[group.category] ?? false;
                          const ratio =
                            insightTotal > 0
                              ? (group.total / insightTotal) * 100
                              : 0;
                          return (
                            <StCatGroup key={group.category}>
                              <StCatButton
                                type="button"
                                onClick={() =>
                                  setOpenAccordions((prev) => ({
                                    ...prev,
                                    [group.category]: !isOpen,
                                  }))
                                }
                              >
                                <StCatMain>
                                  <strong>{group.category}</strong>
                                  <span>
                                    {formatCompactPercent(ratio)} ·{" "}
                                    {group.count}건
                                  </span>
                                </StCatMain>
                                <StCatRight>
                                  <em>{maskAmount(group.total)}</em>
                                  <StCatChevron $open={isOpen} aria-hidden>
                                    <ExpandMoreRoundedIcon fontSize="inherit" />
                                  </StCatChevron>
                                </StCatRight>
                              </StCatButton>
                              {isOpen ? (
                                <StCatItems>
                                  {group.entries.map((entry) => (
                                    <StCatItem key={entry.resolvedId}>
                                      <div>
                                        <strong>{entry.item}</strong>
                                        <span>
                                          {entry.date}
                                          {entry.subCategory
                                            ? ` · ${entry.subCategory}`
                                            : ""}
                                        </span>
                                      </div>
                                      <em>{maskAmount(entry.amount)}</em>
                                    </StCatItem>
                                  ))}
                                </StCatItems>
                              ) : null}
                            </StCatGroup>
                          );
                        })}
                      </StCatSummaryList>
                    )}
                  </StCard>
                </>
              )}
            </StSideColumn>
          </StInsightGrid>
        )}
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
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;

  @media (max-width: 720px) {
    padding: 0.75rem;
  }
`;

const StHeader = styled.header`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.7rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const StHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const StHeaderCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
`;

const StAmountToggle = styled.button`
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;
  border: 1px solid #e2e3e4;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.white};
  color: #8a8e95;
  padding: 0.5rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: #d3d5d8;
    background: #f5f6f7;
    color: #656971;
  }
`;

const StYearNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  button {
    width: 2.3rem;
    height: 2.3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e3e5;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.gray600};
    cursor: pointer;

    svg {
      width: 1.35rem;
      height: 1.35rem;
      fill: currentColor;
    }
  }
`;

const StEyebrow = styled.p`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
  white-space: nowrap;
  padding: 0 0.15rem;

  @media (max-width: 640px) {
    font-size: 0.86rem;
  }
`;

const StBackButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #595c62;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  svg {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
  }
`;


const StHeroCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(min(320px, 100%), 1.05fr);
  gap: 0.9rem;
  border-radius: 24px;
  border: 1px solid #e3e4e5;
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem;
  margin-bottom: 0.9rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StHeroDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.84rem;
  color: #7c8088;
`;

const StInsightGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(min(280px, 100%), 0.82fr);
  gap: 0.9rem;
  margin-bottom: 0.9rem;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const StCard = styled.section`
  border-radius: 24px;
  border: 1px solid #e4e5e6;
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

const StSectionHeaderActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 9.25rem;
  min-height: 2.25rem;
  flex-shrink: 0;

  @media (max-width: 720px) {
    min-width: 0;
    flex-shrink: 1;
  }
`;

const StSectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StSectionMeta = styled.span`
  font-size: 0.78rem;
  color: #81858d;
  font-weight: 700;
`;

const StTotal = styled.strong`
  display: block;
  margin-top: 0.8rem;
  font-size: 2rem;
  font-weight: 900;
  color: #2a4c84;
`;

const StStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
`;

const StStatCard = styled.div`
  border: 1px solid #e8e9ea;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.9rem;

  span {
    display: block;
    font-size: 0.78rem;
    color: #82868d;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 0.32rem;
    font-size: 1rem;
    font-weight: 900;
    color: #192c4e;
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
  color: #2c518c;

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
    color: #8f939a;
    font-weight: 700;
  }
`;

const StFilterChip = styled.button`
  border: 1px solid #e9eaec;
  border-radius: 999px;
  background: #f7f7f7;
  color: #757981;
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
`;

const StFilterChipPlaceholder = styled.span`
  display: inline-flex;
  width: 100%;
  min-height: 2.25rem;
  visibility: hidden;
`;

const StMonthChart = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 128px;
  padding: 0 0.1rem;
`;

const StMonthChartCol = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
`;

const StMonthChartTrack = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const StMonthChartBar = styled.div<{ $active: boolean; $empty: boolean }>`
  width: 100%;
  max-width: 20px;
  border-radius: 5px 5px 2px 2px;
  background: ${({ $active, $empty }) =>
    $empty ? "#eceff3" : $active ? "#3182f6" : "#bcd3f8"};
  transition: background 0.15s ease;
`;

const StMonthChartLabel = styled.span<{ $active: boolean }>`
  font-size: 0.66rem;
  font-weight: ${({ $active }) => ($active ? 900 : 700)};
  color: ${({ $active }) => ($active ? "#3182f6" : "#a2a6ad")};
`;

const StMonthlyList = styled.div`
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
`;

const StMonthLine = styled.button<{ $active: boolean }>`
  border: none;
  border-top: 1px solid #eef0f2;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "#f5f7fb" : "transparent")};
  padding: 0.62rem 0.55rem;
  display: grid;
  grid-template-columns: 2.4rem 3rem minmax(70px, 1fr) 7rem;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;

  &:first-child {
    border-top: none;
  }

  strong {
    font-size: 0.86rem;
    font-weight: 800;
    color: ${({ $active }) => ($active ? "#3182f6" : "#2b3441")};
    text-align: left;
  }

  span {
    font-size: 0.75rem;
    color: #98a0ab;
    font-weight: 700;
    text-align: left;
  }

  em {
    font-style: normal;
    font-size: 0.85rem;
    font-weight: 900;
    color: #333d4b;
    text-align: right;
    white-space: nowrap;
  }

  .track {
    width: 100%;
    height: 0.4rem;
    border-radius: 999px;
    background: #eef1f5;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    border-radius: 999px;
    background: ${({ $active }) => ($active ? "#3182f6" : "#c3ccd6")};
  }

  @media (max-width: 760px) {
    grid-template-columns: 2rem 2.6rem minmax(40px, 1fr) 5.5rem;
    gap: 0.5rem;

    em {
      font-size: 0.78rem;
    }
  }
`;

const StCategoryList = styled.div`
  margin-top: 0.6rem;
  display: grid;
  gap: 0;
`;

const StCategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid #eef0f2;
  padding: 0.72rem 0.15rem;

  &:first-child {
    border-top: none;
  }

  div {
    display: grid;
    gap: 0.18rem;
  }

  strong {
    font-size: 0.84rem;
    color: ${({ theme }) => theme.colors.gray800};
    font-weight: 900;
  }

  span {
    font-size: 0.74rem;
    color: #858a91;
    font-weight: 700;
  }

  em {
    font-style: normal;
    white-space: nowrap;
    color: #333d4b;
    font-weight: 900;
  }
`;

const StCatSummaryList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 0.6rem;
`;

const StCatGroup = styled.div`
  border-top: 1px solid #eef0f2;

  &:first-child {
    border-top: none;
  }
`;

const StCatButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border: none;
  background: transparent;
  padding: 0.78rem 0.15rem;
  text-align: left;
  cursor: pointer;
`;

const StCatMain = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    color: #2b3441;
  }

  span {
    font-size: 0.74rem;
    color: #98a0ab;
    font-weight: 700;
  }
`;

const StCatRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  em {
    font-style: normal;
    font-size: 0.92rem;
    font-weight: 900;
    color: #333d4b;
    white-space: nowrap;
  }
`;

const StCatChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 1.15rem;
  color: #a2a6ad;
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
`;

const StCatItems = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 0.15rem 0.6rem;
`;

const StCatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.42rem 0;
  border-top: 1px dashed #eef0f2;

  div {
    min-width: 0;
    display: grid;
    gap: 0.12rem;
  }

  strong {
    font-size: 0.82rem;
    font-weight: 700;
    color: #3a3f47;
  }

  span {
    font-size: 0.72rem;
    color: #98a0ab;
  }

  em {
    font-style: normal;
    font-size: 0.82rem;
    font-weight: 800;
    color: #4e5560;
    white-space: nowrap;
  }
`;

const StEmpty = styled.p`
  margin-top: 0.85rem;
  font-size: 0.84rem;
  color: #90949b;
`;
