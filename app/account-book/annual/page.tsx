"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { fetchAccountBookStore, upsertAccountBookWorkspace } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import AssetBoardSection from "../components/AssetBoardSection";
import AssetAnnualFlow from "../components/AssetAnnualFlow";
import { useAssetData } from "../hooks/useAssetData";
import {
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
type AssetGoalCategory = "IRP" | "연금저축" | "퇴직연금" | "ISA";

const PAYMENT_META: Array<{ key: PaymentKey; label: string; color: string }> = [
  { key: "cash", label: "현금", color: "#868a92" },
  { key: "card", label: "카드", color: "#888c94" },
  { key: "check_card", label: "체크카드", color: "#3f8f8a" },
];
const ASSET_GOAL_CATEGORIES: AssetGoalCategory[] = [
  "IRP",
  "연금저축",
  "퇴직연금",
  "ISA",
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
  return "calendar";
}

function buildBackUrl(workspaceId?: string, viewMode: ViewMode = "calendar") {
  if (!workspaceId) return "/account-book";
  return `/account-book?workspaceId=${workspaceId}&view=${viewMode}`;
}

function formatGoalInputValue(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("ko-KR");
}

function createEmptyAssetGoalInputs() {
  return {
    IRP: "",
    연금저축: "",
    퇴직연금: "",
    ISA: "",
  } satisfies Record<AssetGoalCategory, string>;
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
  const [assetGoalInputs, setAssetGoalInputs] = useState<
    Record<AssetGoalCategory, string>
  >(createEmptyAssetGoalInputs());
  const [assetGoalSaveState, setAssetGoalSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
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

  const categoryRows = useMemo(() => {
    const grouped = insightEntries.reduce<Record<string, number>>((acc, entry) => {
      const key =
        kind === "asset"
          ? entry.subCategory?.trim() || entry.item.trim() || entry.category.trim() || "기타"
          : getRepresentativeCategory(entry.category, entry.type) || "기타";
      acc[key] = (acc[key] || 0) + entry.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({
        label,
        amount,
        ratio: insightTotal > 0 ? (amount / insightTotal) * 100 : 0,
      }));
  }, [insightEntries, insightTotal, kind]);

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

  const assetCumulativeCategoryRows = useMemo(() => {
    const grouped = filteredEntries.reduce<
      Record<
        string,
        {
          amount: number;
          count: number;
          latestDate: string;
        }
      >
    >((acc, entry) => {
      const key =
        entry.subCategory?.trim() ||
        entry.item?.trim() ||
        entry.category?.trim() ||
        "기타 자산";

      if (!acc[key]) {
        acc[key] = {
          amount: 0,
          count: 0,
          latestDate: entry.date,
        };
      }

      acc[key].amount += entry.amount;
      acc[key].count += 1;
      if (entry.date > acc[key].latestDate) {
        acc[key].latestDate = entry.date;
      }

      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([label, meta]) => ({
        label,
        amount: meta.amount,
        count: meta.count,
        latestDate: meta.latestDate,
        ratio: total > 0 ? (meta.amount / total) * 100 : 0,
      }));
  }, [filteredEntries, total]);

  const assetGoalScopeKey = memberId || "all";
  const persistedAssetGoalInputs = useMemo(() => {
    const savedGoals =
      workspace?.assetGoalMap?.[String(selectedYear)]?.[assetGoalScopeKey] || {};

    return ASSET_GOAL_CATEGORIES.reduce(
      (acc, label) => {
        const value = Number(savedGoals[label]) || 0;
        acc[label] = value > 0 ? value.toLocaleString("ko-KR") : "";
        return acc;
      },
      createEmptyAssetGoalInputs(),
    );
  }, [assetGoalScopeKey, selectedYear, workspace?.assetGoalMap]);

  const persistedAssetGoalSignature = JSON.stringify(persistedAssetGoalInputs);
  const assetGoalInputSignature = JSON.stringify(assetGoalInputs);

  useEffect(() => {
    setAssetGoalInputs(persistedAssetGoalInputs);
    setAssetGoalSaveState("idle");
  }, [persistedAssetGoalSignature, persistedAssetGoalInputs]);

  useEffect(() => {
    if (kind !== "asset" || !workspace || !store) return;
    if (assetGoalInputSignature === persistedAssetGoalSignature) return;

    const timeout = window.setTimeout(async () => {
      try {
        setAssetGoalSaveState("saving");
        const scopedGoalMap = ASSET_GOAL_CATEGORIES.reduce<Record<string, number>>(
          (acc, label) => {
            const value = Number(assetGoalInputs[label].replace(/,/g, "")) || 0;
            if (value > 0) {
              acc[label] = value;
            }
            return acc;
          },
          {},
        );

        const nextAssetGoalMap = {
          ...(workspace.assetGoalMap || {}),
          [String(selectedYear)]: {
            ...((workspace.assetGoalMap || {})[String(selectedYear)] || {}),
            [assetGoalScopeKey]: scopedGoalMap,
          },
        };

        const nextStore = await upsertAccountBookWorkspace({
          ...workspace,
          assetGoalMap: nextAssetGoalMap,
        });
        setStore(nextStore);
        setAssetGoalSaveState("saved");
      } catch (error) {
        console.error("자산 목표 저장 실패:", error);
        setAssetGoalSaveState("error");
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [
    assetGoalInputSignature,
    assetGoalInputs,
    assetGoalScopeKey,
    kind,
    persistedAssetGoalSignature,
    selectedYear,
    store,
    workspace,
  ]);

  const assetGoalRows = useMemo(() => {
    const amountMap = new Map(
      assetCumulativeCategoryRows.map((row) => [row.label, row.amount]),
    );

    return ASSET_GOAL_CATEGORIES.map((label) => {
      const goal = Number(assetGoalInputs[label].replace(/,/g, "")) || 0;
      const saved = amountMap.get(label) || 0;
      const remaining = Math.max(goal - saved, 0);
      const achievementRate = goal > 0 ? (saved / goal) * 100 : null;

      return {
        label,
        goal,
        saved,
        remaining,
        achievementRate,
        isCompleted: goal > 0 && saved >= goal,
      };
    });
  }, [assetCumulativeCategoryRows, assetGoalInputs]);

  const assetGoalSummary = useMemo(() => {
    const totalGoalAmount = assetGoalRows.reduce((sum, row) => sum + row.goal, 0);
    const totalSavedAmount = assetGoalRows.reduce(
      (sum, row) => sum + Math.min(row.saved, row.goal || row.saved),
      0,
    );
    const completedCount = assetGoalRows.filter((row) => row.isCompleted).length;
    const activeGoalCount = assetGoalRows.filter((row) => row.goal > 0).length;

    return {
      totalGoalAmount,
      totalSavedAmount,
      totalRemainingAmount: Math.max(totalGoalAmount - totalSavedAmount, 0),
      completedCount,
      activeGoalCount,
      overallRate:
        totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : null,
    };
  }, [assetGoalRows]);

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
    kind === "income" ? "수입" : kind === "asset" ? "자산/저축" : "지출";
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
                                    ⌄
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
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
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

const StEyebrow = styled.p`
  font-size: 0.78rem;
  font-weight: 800;
  color: #868a91;
`;

const StBackButton = styled.button`
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.white};
  color: #2c4d8a;
  padding: 0.55rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 800;
`;

const StTitle = styled.h1`
  margin-top: 0.2rem;
  font-size: 1.3rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StHeaderDescription = styled.p`
  margin-top: 0.3rem;
  font-size: 0.84rem;
  color: #7a7f87;
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

const StGoalList = styled.div`
  display: grid;
  gap: 0.8rem;
  margin-top: 0.95rem;
`;

const StGoalCard = styled.article`
  border: 1px solid #eaebed;
  border-radius: 16px;
  background: #fdfdfe;
  padding: 0.9rem;
`;

const StGoalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.9rem;

  @media (max-width: 820px) {
    flex-direction: column;
  }

  div {
    display: grid;
    gap: 0.18rem;
  }

  strong {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.gray800};
  }

  span {
    font-size: 0.78rem;
    color: #81858d;
    font-weight: 700;
  }
`;

const StGoalInputWrap = styled.label`
  display: grid;
  grid-template-columns: auto minmax(110px, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  min-width: 250px;
  font-size: 0.76rem;
  color: #7e838b;
  font-weight: 800;

  input {
    width: 100%;
    border: 1px solid #e2e3e5;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.white};
    padding: 0.5rem 0.65rem;
    font-size: 0.84rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray800};
  }

  em {
    font-style: normal;
    color: #898d94;
  }

  @media (max-width: 820px) {
    min-width: 0;
    width: 100%;
  }
`;

const StGoalMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.8rem;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const StGoalMetaCard = styled.div`
  border-radius: 12px;
  background: #f5f6f8;
  padding: 0.6rem 0.7rem;

  span {
    display: block;
    font-size: 0.72rem;
    color: #868a91;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 0.22rem;
    font-size: 0.95rem;
    color: #222b36;
    font-weight: 900;
  }
`;

const StGoalBar = styled.div`
  margin-top: 0.8rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #eceef1;
  overflow: hidden;
`;

const StGoalFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #3182f6;
`;

const StGoalSummaryList = styled.div`
  display: grid;
  gap: 0;
  margin-top: 0.6rem;
`;

const StGoalSummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  border-top: 1px solid #eef0f2;
  padding: 0.72rem 0.15rem;

  &:first-child {
    border-top: none;
  }

  span {
    font-size: 0.78rem;
    color: #81858d;
    font-weight: 700;
  }

  strong {
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.gray800};
    font-weight: 900;
    text-align: right;
  }
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

const StAccordionList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 0.9rem;
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
  font-size: 0.85rem;
  color: #a2a6ad;
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
`;

const StCatItems = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 0.15rem 0.6rem 0.75rem;
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

const StAccordion = styled.article`
  border: 1px solid #e9eaeb;
  border-radius: 18px;
  overflow: hidden;
`;

const StAccordionButton = styled.button`
  width: 100%;
  border: none;
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.8rem 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #182a4b;

  strong {
    font-size: 0.9rem;
    font-weight: 900;
  }

  span {
    font-size: 0.76rem;
    color: #7e838b;
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
  border: 1px solid #f1f2f3;
  border-radius: 14px;
  padding: 0.7rem 0.8rem;

  strong {
    font-size: 0.88rem;
    color: ${({ theme }) => theme.colors.gray800};
  }

  p {
    margin-top: 0.2rem;
    font-size: 0.76rem;
    color: #84888f;
  }

  em {
    font-style: normal;
    font-weight: 800;
    color: #2a4c84;
    white-space: nowrap;
  }
`;

const StEmpty = styled.p`
  margin-top: 0.85rem;
  font-size: 0.84rem;
  color: #90949b;
`;
