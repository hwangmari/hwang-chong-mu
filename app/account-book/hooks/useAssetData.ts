"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteAccountBookAssetAccount,
  deleteAccountBookAssetChange,
  fetchAccountBookAssetData,
  transferAccountBookAsset,
  upsertAccountBookAssetAccount,
  upsertAccountBookAssetChange,
} from "../repository";
import type {
  AssetAccount,
  AssetChange,
  AssetChangeType,
  AssetData,
} from "../types";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}`;
}

export type SaveAccountInput = {
  id?: string;
  name: string;
  kind: string;
  goalAmount?: number;
  sortOrder?: number;
};

export type AddChangeInput = {
  accountId: string;
  date: string;
  amount: number;
  changeType: AssetChangeType;
  memo?: string;
};

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  memo?: string;
};

export function useAssetData(
  workspaceId: string | null,
  actorUserId: string | null,
) {
  const [accounts, setAccounts] = useState<AssetAccount[]>([]);
  const [changes, setChanges] = useState<AssetChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyData = useCallback((data: AssetData) => {
    setAccounts(data.accounts);
    setChanges(data.changes);
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setAccounts([]);
      setChanges([]);
      return;
    }
    let active = true;
    setIsLoading(true);
    void (async () => {
      try {
        const data = await fetchAccountBookAssetData(workspaceId);
        if (!active) return;
        applyData(data);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        console.error("자산 데이터 불러오기 실패:", loadError);
        setError("자산 데이터를 불러오지 못했습니다.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [workspaceId, applyData]);

  // ── 변경(mutation) ──────────────────────────────────────────────────────
  const saveAccount = useCallback(
    async (input: SaveAccountInput) => {
      if (!workspaceId || !actorUserId) return;
      const account: AssetAccount = {
        id: input.id || createId("asset-account"),
        workspaceId,
        name: input.name.trim() || "통장",
        kind: input.kind || "기타",
        goalAmount: Math.max(Math.trunc(input.goalAmount ?? 0), 0),
        createdByUserId: actorUserId,
        archived: false,
        sortOrder: input.sortOrder ?? accounts.length,
      };
      applyData(await upsertAccountBookAssetAccount(account, actorUserId));
    },
    [accounts.length, actorUserId, applyData, workspaceId],
  );

  const removeAccount = useCallback(
    async (accountId: string) => {
      if (!actorUserId) return;
      applyData(await deleteAccountBookAssetAccount(accountId, actorUserId));
    },
    [actorUserId, applyData],
  );

  const addChange = useCallback(
    async (input: AddChangeInput) => {
      if (!workspaceId || !actorUserId) return;
      const change: AssetChange = {
        id: createId("asset-change"),
        workspaceId,
        accountId: input.accountId,
        date: input.date,
        amount: Math.trunc(input.amount),
        changeType: input.changeType,
        memo: input.memo || "",
        createdByUserId: actorUserId,
      };
      applyData(await upsertAccountBookAssetChange(change, actorUserId));
    },
    [actorUserId, applyData, workspaceId],
  );

  const removeChange = useCallback(
    async (changeId: string) => {
      if (!actorUserId) return;
      applyData(await deleteAccountBookAssetChange(changeId, actorUserId));
    },
    [actorUserId, applyData],
  );

  const transfer = useCallback(
    async (input: TransferInput) => {
      if (!workspaceId || !actorUserId) return;
      applyData(
        await transferAccountBookAsset({
          workspaceId,
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount: Math.trunc(input.amount),
          date: input.date,
          memo: input.memo || "",
          actorUserId,
        }),
      );
    },
    [actorUserId, applyData, workspaceId],
  );

  // ── 집계(selectors) ─────────────────────────────────────────────────────
  const activeAccounts = useMemo(
    () =>
      accounts
        .filter((account) => !account.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [accounts],
  );

  const balanceByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const change of changes) {
      map[change.accountId] = (map[change.accountId] || 0) + change.amount;
    }
    return map;
  }, [changes]);

  const totalBalance = useMemo(
    () => changes.reduce((sum, change) => sum + change.amount, 0),
    [changes],
  );

  const changesByAccount = useCallback(
    (accountId: string) =>
      changes
        .filter((change) => change.accountId === accountId)
        .sort((a, b) =>
          `${b.date}-${b.createdAt || ""}`.localeCompare(
            `${a.date}-${a.createdAt || ""}`,
          ),
        ),
    [changes],
  );

  // 실제 저축 흐름만: 입금·가계부연동(+), 출금(−). 이체·초기잔액·조정 제외.
  const isSavingsFlow = (change: AssetChange) =>
    change.changeType === "deposit" ||
    change.changeType === "ledger" ||
    change.changeType === "withdraw";

  const totalSavingsFlow = useMemo(
    () =>
      changes
        .filter(isSavingsFlow)
        .reduce((sum, change) => sum + change.amount, 0),
    [changes],
  );

  // 연도별 "실제 저축" 월별 흐름 + 누적 (이체/초기잔액 제외)
  const monthlySavingsFlow = useCallback(
    (year: number) => {
      const flow = changes.filter(isSavingsFlow);
      const prefix = `${year}-`;
      let cumulative = flow
        .filter((change) => change.date < prefix)
        .reduce((sum, change) => sum + change.amount, 0);
      return Array.from({ length: 12 }, (_, index) => {
        const mm = String(index + 1).padStart(2, "0");
        const monthPrefix = `${year}-${mm}`;
        const monthly = flow
          .filter((change) => change.date.startsWith(monthPrefix))
          .reduce((sum, change) => sum + change.amount, 0);
        cumulative += monthly;
        return {
          monthNumber: index + 1,
          monthLabel: `${index + 1}월`,
          monthly,
          cumulative,
        };
      });
    },
    [changes],
  );

  // 연도별 월별 축적(그 달 변동 합계) + 누적
  const monthlyAccumulation = useCallback(
    (year: number) => {
      const prefix = `${year}-`;
      let cumulative = 0;
      // 해당 연도 이전까지의 누적을 시작값으로
      const priorTotal = changes
        .filter((change) => change.date < prefix)
        .reduce((sum, change) => sum + change.amount, 0);
      cumulative = priorTotal;
      return Array.from({ length: 12 }, (_, index) => {
        const mm = String(index + 1).padStart(2, "0");
        const monthPrefix = `${year}-${mm}`;
        const monthly = changes
          .filter((change) => change.date.startsWith(monthPrefix))
          .reduce((sum, change) => sum + change.amount, 0);
        cumulative += monthly;
        return {
          monthNumber: index + 1,
          monthLabel: `${index + 1}월`,
          monthly,
          cumulative,
        };
      });
    },
    [changes],
  );

  return {
    accounts,
    activeAccounts,
    changes,
    isLoading,
    error,
    balanceByAccount,
    totalBalance,
    changesByAccount,
    monthlyAccumulation,
    monthlySavingsFlow,
    totalSavingsFlow,
    saveAccount,
    removeAccount,
    addChange,
    removeChange,
    transfer,
  };
}
