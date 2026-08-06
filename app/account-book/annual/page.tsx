"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAccountBookStore } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import AssetBoardSection from "../components/AssetBoardSection";
import AssetAnnualFlow from "../components/AssetAnnualFlow";
import { useAssetData } from "../hooks/useAssetData";
import { useStockTrades } from "../hooks/useStockTrades";
import {
  formatAmount,
  getRepresentativeCategory,
  isCardSettlementEntry,
  isSavingsCategory,
  isWelfareEntry,
} from "../components/WorkspaceLedgerView/utils";
import {
  getWorkspaceById,
  resolveWorkspaceEntries,
} from "../storage";
import type { AccountBookStore, ViewMode } from "../types";
import type { AnnualKind, PaymentKey } from "./types";
import {
  StPage,
  StInsightGrid,
  StCard,
  StSectionTitle,
  StBackButton,
  StEmpty,
} from "./page.styles";
import AnnualHeader from "./components/AnnualHeader";
import AnnualSummaryHero from "./components/AnnualSummaryHero";
import AnnualMonthlyFlow from "./components/AnnualMonthlyFlow";
import AnnualInsightSidebar from "./components/AnnualInsightSidebar";

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  // 연도 이동/kind 변경 시 이전 스코프의 월·분류 필터는 더 이상 유효하지 않으므로 초기화한다.
  useEffect(() => {
    setSelectedMonth(null);
    setSelectedCategory(null);
  }, [selectedYear, kind]);

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
  // 투자 계좌의 "올해 목표"는 자산 입금이 아니라 주식 매매(올해 순매수)로 채운다.
  const { trades: stockTrades } = useStockTrades(
    kind === "asset" ? workspaceId : null,
    assetActorUserId,
  );
  const stockYearBuyByAccount = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    const map: Record<string, number> = {};
    for (const trade of stockTrades) {
      if (!trade.date.startsWith(yearPrefix)) continue;
      const amount = trade.quantity * trade.price;
      const signed = trade.side === "buy" ? amount : -amount;
      map[trade.accountId] = (map[trade.accountId] || 0) + signed;
    }
    return map;
  }, [stockTrades, selectedYear]);
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
        !isCardSettlementEntry(entry) &&
        !isWelfareEntry(entry),
    );
  }, [annualEntries, kind]);

  // "많이 나온 분류"에서 분류를 누르면 월별 흐름 차트/통계만 그 분류로 스코프한다.
  // 분류 키 규칙은 insightCategoryGroups와 100% 동일해야 매칭된다.
  const chartEntries = useMemo(() => {
    if (!selectedCategory) return filteredEntries;
    return filteredEntries.filter((entry) => {
      const key =
        kind === "asset"
          ? entry.subCategory?.trim() ||
            entry.item?.trim() ||
            entry.category.trim() ||
            "기타"
          : getRepresentativeCategory(entry.category, entry.type);
      return key === selectedCategory;
    });
  }, [filteredEntries, selectedCategory, kind]);

  const total = useMemo(
    () => chartEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [chartEntries],
  );

  const monthlyRows = useMemo(() => {
    const grouped = chartEntries.reduce<
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
      if (!isWelfareEntry(entry)) {
        acc[month].payments[entry.payment] += entry.amount;
      }
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
  }, [chartEntries]);

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
        if (!isWelfareEntry(entry)) {
          acc[entry.payment] += entry.amount;
        }
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
        <AnnualHeader
          selectedYear={selectedYear}
          kindLabel={kindLabel}
          isAmountHidden={isAmountHidden}
          onBack={() =>
            router.push(buildBackUrl(workspace.id, returnViewMode))
          }
          onPrevYear={() => changeYear(-1)}
          onNextYear={() => changeYear(1)}
          onToggleAmount={() => setIsAmountHidden((prev) => !prev)}
        />

        <AnnualSummaryHero
          kind={kind}
          kindLabel={kindLabel}
          total={total}
          selectedMonth={selectedMonth}
          averageMonthlyAmount={averageMonthlyAmount}
          topMonthRow={topMonthRow}
          activeMonthCount={activeMonthCount}
          latestEntryDate={latestEntryDate}
          maskAmount={maskAmount}
        />

        {kind === "asset" ? (
          <StInsightGrid>
            <AssetBoardSection
              asset={asset}
              currentYear={selectedYear}
              isAmountHidden={isAmountHidden}
              stockYearBuyByAccount={stockYearBuyByAccount}
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
            <AnnualMonthlyFlow
              selectedCategory={selectedCategory}
              selectedMonth={selectedMonth}
              monthlyRows={monthlyRows}
              maxMonthlyAmount={maxMonthlyAmount}
              maskAmount={maskAmount}
              onClearCategory={() => setSelectedCategory(null)}
              onClearMonth={() => setSelectedMonth(null)}
              onToggleMonth={(month) =>
                setSelectedMonth((prev) => (prev === month ? null : month))
              }
            />

            <AnnualInsightSidebar
              kind={kind}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedCategory={selectedCategory}
              incomeSourceRows={incomeSourceRows}
              incomeMemberRows={incomeMemberRows}
              paymentTotals={paymentTotals}
              insightTotal={insightTotal}
              insightCategoryGroups={insightCategoryGroups}
              openAccordions={openAccordions}
              maskAmount={maskAmount}
              onToggleCategory={(category) => {
                setSelectedCategory((prev) =>
                  prev === category ? null : category,
                );
                setOpenAccordions((prev) => ({
                  ...prev,
                  [category]: !(prev[category] ?? false),
                }));
              }}
            />
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
