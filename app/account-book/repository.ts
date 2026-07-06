"use client";

import { supabase } from "@/lib/supabase";
import {
  AccountBookMonthlyMemo,
  AccountBookStore,
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  AssetAccount,
  AssetChange,
  AssetData,
} from "./types";
import {
  ACCOUNT_BOOK_STORE_KEY,
  LEGACY_ACCOUNT_BOOK_KEY,
  getAccountBookStore,
  getWorkspaceById,
  normalizeStore,
  saveAccountBookStore,
  toggleShareLink,
} from "./storage";
import {
  getRepresentativeCategory,
  isSavingsCategory,
} from "./components/WorkspaceLedgerView/utils";

const DEFAULT_WORKSPACE_ANNUAL_SAVING_GOAL = 1_200_000;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRpcStore(raw: Partial<AccountBookStore> | null | undefined) {
  clearLegacyAccountBookLocalData();
  const normalized = normalizeStore(raw || {});
  saveAccountBookStore(normalized);
  return normalized;
}

function persistLocalStore(store: Partial<AccountBookStore> | AccountBookStore) {
  const normalized = normalizeStore(store || {});
  saveAccountBookStore(normalized);
  return normalized;
}

type RoomActionResult = {
  store: AccountBookStore;
  userId: string;
  workspaceId: string;
  inviteCode: string;
};

type UserActionResult = {
  store: AccountBookStore;
  userId: string;
  workspaceId: string;
};

function isLikelyNetworkError(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("load failed")
  );
}

function canAccessWorkspaceForWrite(
  store: AccountBookStore,
  workspaceId: string,
  actorUserId: string,
) {
  const workspace = getWorkspaceById(store, workspaceId);
  if (!workspace) return false;

  return (
    workspace.ownerUserId === actorUserId || workspace.memberIds.includes(actorUserId)
  );
}

function assertEntryWritePermission(
  store: AccountBookStore,
  entry: AccountEntry,
  actorUserId: string,
) {
  const existingEntry =
    store.entries.find((currentEntry) => currentEntry.id === entry.id) || null;

  if (!actorUserId || entry.createdByUserId !== actorUserId) {
    throw new Error("본인이 작성한 내역만 저장할 수 있어요.");
  }

  if (!canAccessWorkspaceForWrite(store, entry.workspaceId, actorUserId)) {
    throw new Error("접근 가능한 가계부방의 내역만 저장할 수 있어요.");
  }

  if (
    existingEntry &&
    (existingEntry.createdByUserId !== actorUserId ||
      existingEntry.workspaceId !== entry.workspaceId)
  ) {
    throw new Error("본인이 작성한 기존 내역만 수정할 수 있어요.");
  }
}

function assertEntryManagePermission(
  store: AccountBookStore,
  entryId: string,
  actorUserId: string,
  actionLabel: string,
) {
  const targetEntry = store.entries.find((entry) => entry.id === entryId) || null;
  if (!targetEntry) {
    throw new Error("대상 내역을 찾지 못했어요.");
  }

  if (!actorUserId || targetEntry.createdByUserId !== actorUserId) {
    throw new Error(`본인이 작성한 내역만 ${actionLabel}할 수 있어요.`);
  }

  return targetEntry;
}

function assertEntrySharePermission(
  store: AccountBookStore,
  sourceEntryId: string,
  sourceWorkspaceId: string,
  targetWorkspaceId: string,
  actorUserId: string,
) {
  const sourceEntry = assertEntryManagePermission(
    store,
    sourceEntryId,
    actorUserId,
    "공유 관리",
  );

  if (sourceEntry.workspaceId !== sourceWorkspaceId) {
    throw new Error("공유 원본 내역 정보가 올바르지 않아요.");
  }

  const targetWorkspace = getWorkspaceById(store, targetWorkspaceId);
  if (!targetWorkspace || targetWorkspace.type !== "shared") {
    throw new Error("공유 대상 공용방을 찾지 못했어요.");
  }

  if (!canAccessWorkspaceForWrite(store, targetWorkspaceId, actorUserId)) {
    throw new Error("참여 중인 공용방에만 공유할 수 있어요.");
  }

  return sourceEntry;
}

function assertMonthlyMemoPermission(
  store: AccountBookStore,
  workspaceId: string,
  actorUserId: string,
) {
  if (!actorUserId) {
    throw new Error("메모를 저장할 사용자 정보를 찾지 못했어요.");
  }

  if (!canAccessWorkspaceForWrite(store, workspaceId, actorUserId)) {
    throw new Error("접근 가능한 가계부방 메모만 저장할 수 있어요.");
  }
}

async function callStoreRpc<TParams extends Record<string, unknown>>(
  name: string,
  params?: TParams,
) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw error;
  }

  return normalizeRpcStore((data || null) as Partial<AccountBookStore> | null);
}

export function clearLegacyAccountBookLocalData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCOUNT_BOOK_STORE_KEY);
  window.localStorage.removeItem(LEGACY_ACCOUNT_BOOK_KEY);
}

export async function fetchAccountBookStore() {
  try {
    const { data, error } = await supabase.rpc("account_book_get_store");
    if (error) {
      throw error;
    }

    const rawStore = (data || null) as Partial<AccountBookStore> | null;
    return normalizeRpcStore(rawStore);
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn("가계부 원격 불러오기에 실패해 로컬 데이터를 사용합니다.", error);
      return getAccountBookStore();
    }

    throw error;
  }
}

async function callRoomActionRpc<TParams extends Record<string, unknown>>(
  name: string,
  params: TParams,
): Promise<RoomActionResult> {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw error;
  }

  const payload = (data || null) as
    | {
        store?: Partial<AccountBookStore> | null;
        userId?: string;
        workspaceId?: string;
        inviteCode?: string;
      }
    | null;

  return {
    store: normalizeRpcStore(payload?.store || {}),
    userId: payload?.userId || "",
    workspaceId: payload?.workspaceId || "",
    inviteCode: payload?.inviteCode || "",
  };
}

export async function upsertAccountBookEntry(
  entry: AccountEntry,
  actorUserId: string,
) {
  try {
    return await callStoreRpc("account_book_upsert_entry", {
      p_entry: entry,
      p_actor_user_id: actorUserId,
    });
  } catch (error) {
    if (!isLikelyNetworkError(error)) {
      throw error;
    }

    if (typeof window !== "undefined") {
      console.warn(
        "가계부 원격 저장에 실패해 로컬 데이터로 내역을 저장합니다.",
        error,
      );
      const currentStore = getAccountBookStore();
      assertEntryWritePermission(currentStore, entry, actorUserId);
      const existingEntry = currentStore.entries.find(
        (currentEntry) => currentEntry.id === entry.id,
      );
      const nextEntries = existingEntry
        ? currentStore.entries.map((currentEntry) =>
            currentEntry.id === entry.id ? entry : currentEntry,
          )
        : [entry, ...currentStore.entries];

      return persistLocalStore({
        ...currentStore,
        entries: nextEntries,
      });
    }

    throw error;
  }
}

export async function deleteAccountBookEntry(entryId: string, actorUserId: string) {
  try {
    return await callStoreRpc("account_book_delete_entry", {
      p_entry_id: entryId,
      p_actor_user_id: actorUserId,
    });
  } catch (error) {
    if (!isLikelyNetworkError(error)) {
      throw error;
    }

    if (typeof window !== "undefined") {
      console.warn(
        "가계부 원격 삭제에 실패해 로컬 데이터에서 내역을 제거합니다.",
        error,
      );
      const currentStore = getAccountBookStore();
      assertEntryManagePermission(currentStore, entryId, actorUserId, "삭제");

      return persistLocalStore({
        ...currentStore,
        entries: currentStore.entries.filter((entry) => entry.id !== entryId),
        shareLinks: currentStore.shareLinks.filter(
          (link) => link.sourceEntryId !== entryId,
        ),
      });
    }

    throw error;
  }
}

export async function toggleAccountBookShareLink(
  sourceEntryId: string,
  sourceWorkspaceId: string,
  targetWorkspaceId: string,
  actorUserId: string,
) {
  try {
    return await callStoreRpc("account_book_toggle_share_link", {
      p_source_entry_id: sourceEntryId,
      p_source_workspace_id: sourceWorkspaceId,
      p_target_workspace_id: targetWorkspaceId,
      p_actor_user_id: actorUserId,
    });
  } catch (error) {
    if (!isLikelyNetworkError(error)) {
      throw error;
    }

    if (typeof window !== "undefined") {
      console.warn(
        "가계부 원격 공유 처리에 실패해 로컬 데이터에만 반영합니다.",
        error,
      );
      const currentStore = getAccountBookStore();
      assertEntrySharePermission(
        currentStore,
        sourceEntryId,
        sourceWorkspaceId,
        targetWorkspaceId,
        actorUserId,
      );
      return persistLocalStore(
        toggleShareLink(
          currentStore,
          sourceEntryId,
          sourceWorkspaceId,
          targetWorkspaceId,
          actorUserId,
        ),
      );
    }

    throw error;
  }
}

export async function upsertAccountBookMonthlyMemo(
  workspaceId: string,
  monthKey: string,
  memo: string,
  actorUserId: string,
) {
  try {
    return await callStoreRpc("account_book_upsert_monthly_memo", {
      p_workspace_id: workspaceId,
      p_month_key: monthKey,
      p_memo: memo,
      p_actor_user_id: actorUserId,
    });
  } catch (error) {
    if (!isLikelyNetworkError(error)) {
      throw error;
    }

    if (typeof window !== "undefined") {
      console.warn(
        "가계부 월 메모 원격 저장에 실패해 로컬 데이터에만 반영합니다.",
        error,
      );
      const currentStore = getAccountBookStore();
      assertMonthlyMemoPermission(currentStore, workspaceId, actorUserId);
      const normalizedMonthKey =
        /^\d{4}-\d{2}$/.test(monthKey)
          ? monthKey
          : new Date().toISOString().slice(0, 7);
      const nextMemo = memo.trim();
      const existingMemo =
        currentStore.monthlyMemos.find(
          (monthlyMemo) =>
            monthlyMemo.workspaceId === workspaceId &&
            monthlyMemo.monthKey === normalizedMonthKey,
        ) || null;

      const nextMonthlyMemos = existingMemo
        ? currentStore.monthlyMemos.map((monthlyMemo) =>
            monthlyMemo.id === existingMemo.id
              ? {
                  ...monthlyMemo,
                  memo: nextMemo,
                  updatedByUserId: actorUserId,
                  updatedAt: new Date().toISOString(),
                }
              : monthlyMemo,
          )
        : [
            {
              id: createId("monthly-memo"),
              workspaceId,
              monthKey: normalizedMonthKey,
              memo: nextMemo,
              updatedByUserId: actorUserId,
              updatedAt: new Date().toISOString(),
            } satisfies AccountBookMonthlyMemo,
            ...currentStore.monthlyMemos,
          ];

      return persistLocalStore({
        ...currentStore,
        monthlyMemos: nextMonthlyMemos,
      });
    }

    throw error;
  }
}

export async function updateAccountBookUser(
  currentUser: AccountBookUser,
  name: string,
  password: string,
  annualSavingGoal = DEFAULT_WORKSPACE_ANNUAL_SAVING_GOAL,
  assetGoalMap: AccountBookWorkspace["assetGoalMap"] = {},
) {
  await callStoreRpc("account_book_upsert_user", {
    p_id: currentUser.id,
    p_name: name,
    p_password: password,
    p_personal_workspace_id: currentUser.personalWorkspaceId,
  });

  return callStoreRpc("account_book_upsert_workspace", {
    p_id: currentUser.personalWorkspaceId,
    p_name: `${name} 개인 가계부`,
    p_type: "personal",
    p_password: password,
    p_annual_saving_goal: annualSavingGoal,
    p_asset_goal_map: assetGoalMap || {},
    p_owner_user_id: currentUser.id,
    p_member_ids: [currentUser.id],
  });
}

export async function createAccountBookUser(name: string, password: string) {
  const userId = createId("user");
  const personalWorkspaceId = createId("workspace");

  await callStoreRpc("account_book_upsert_workspace", {
    p_id: personalWorkspaceId,
    p_name: `${name} 개인 가계부`,
    p_type: "personal",
    p_password: password,
    p_annual_saving_goal: DEFAULT_WORKSPACE_ANNUAL_SAVING_GOAL,
    p_asset_goal_map: {},
    p_owner_user_id: userId,
    p_member_ids: [userId],
  });

  const store = await callStoreRpc("account_book_upsert_user", {
    p_id: userId,
    p_name: name,
    p_password: password,
    p_personal_workspace_id: personalWorkspaceId,
  });

  return {
    store,
    userId,
    workspaceId: personalWorkspaceId,
  } satisfies UserActionResult;
}

export async function deleteAccountBookUser(userId: string) {
  return callStoreRpc("account_book_delete_user", {
    p_user_id: userId,
  });
}

export async function upsertAccountBookWorkspace(
  workspace: AccountBookWorkspace,
) {
  try {
    return await callStoreRpc("account_book_upsert_workspace", {
      p_id: workspace.id,
      p_name: workspace.name,
      p_type: workspace.type,
      p_password: workspace.password,
      p_annual_saving_goal:
        workspace.annualSavingGoal || DEFAULT_WORKSPACE_ANNUAL_SAVING_GOAL,
      p_asset_goal_map: workspace.assetGoalMap || {},
      p_owner_user_id: workspace.ownerUserId || "",
      p_member_ids: workspace.memberIds,
    });
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn(
        "가계부 워크스페이스 저장에 실패해 로컬 데이터에만 반영합니다.",
        error,
      );
      const currentStore = getAccountBookStore();

      return persistLocalStore({
        ...currentStore,
        workspaces: currentStore.workspaces.map((currentWorkspace) =>
          currentWorkspace.id === workspace.id ? workspace : currentWorkspace,
        ),
      });
    }

    throw error;
  }
}

export async function createAccountBookSharedWorkspace(
  name: string,
  password: string,
  memberIds: string[],
) {
  return callStoreRpc("account_book_upsert_workspace", {
    p_id: createId("workspace"),
    p_name: name,
    p_type: "shared",
    p_password: password,
    p_annual_saving_goal: DEFAULT_WORKSPACE_ANNUAL_SAVING_GOAL,
    p_asset_goal_map: {},
    p_owner_user_id: "",
    p_member_ids: memberIds,
  });
}

export async function createAccountBookSharedRoomWithOwner(
  roomName: string,
  roomPassword: string,
  ownerName: string,
  ownerPassword: string,
) {
  return callRoomActionRpc("account_book_create_shared_room", {
    p_room_name: roomName,
    p_room_password: roomPassword,
    p_owner_name: ownerName,
    p_owner_password: ownerPassword,
  });
}

export async function joinAccountBookSharedRoom(
  inviteCode: string,
  userName: string,
  userPassword: string,
) {
  return callRoomActionRpc("account_book_join_shared_room", {
    p_invite_code: inviteCode,
    p_user_name: userName,
    p_user_password: userPassword,
  });
}

export async function addAccountBookSharedRoomMember(
  workspaceId: string,
  userName: string,
  userPassword: string,
) {
  return callStoreRpc("account_book_add_shared_room_member", {
    p_workspace_id: workspaceId,
    p_user_name: userName,
    p_user_password: userPassword,
  });
}

export async function removeAccountBookSharedRoomMember(
  workspaceId: string,
  userId: string,
) {
  return callStoreRpc("account_book_remove_shared_room_member", {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  });
}

export async function deleteAccountBookSharedWorkspace(workspaceId: string) {
  return callStoreRpc("account_book_delete_shared_workspace", {
    p_workspace_id: workspaceId,
  });
}

export async function replaceWorkspaceEntries(
  currentStore: AccountBookStore,
  workspaceId: string,
  actorUserId: string,
  nextEntries: AccountEntry[],
) {
  let latestStore = currentStore;
  const directEntries = currentStore.entries.filter(
    (entry) => entry.workspaceId === workspaceId,
  );

  for (const entry of directEntries) {
    latestStore = await deleteAccountBookEntry(entry.id, actorUserId);
  }

  for (const entry of nextEntries) {
    latestStore = await upsertAccountBookEntry(entry, actorUserId);
  }

  return latestStore;
}

// ── 자산(통장) RPC ──────────────────────────────────────────────────────────
// account_book_get_asset_data 등은 { accounts, changes } JSON을 반환한다.
// json_agg 로 나온 row는 snake_case 키라서 camelCase 로 매핑한다.

type RawAssetAccount = {
  id: string;
  workspace_id: string;
  name: string;
  kind: string;
  goal_amount: number | string | null;
  created_by_user_id: string | null;
  archived: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

type RawAssetChange = {
  id: string;
  workspace_id: string;
  account_id: string;
  date: string;
  amount: number | string;
  change_type: AssetChange["changeType"];
  counterpart_account_id: string | null;
  transfer_group_id: string | null;
  linked_entry_id: string | null;
  memo: string | null;
  created_by_user_id: string | null;
  created_at: string | null;
};

function mapRawAssetData(raw: unknown): AssetData {
  const payload = (raw || {}) as {
    accounts?: RawAssetAccount[] | null;
    changes?: RawAssetChange[] | null;
  };
  const accounts: AssetAccount[] = (payload.accounts || []).map((account) => ({
    id: account.id,
    workspaceId: account.workspace_id,
    name: account.name,
    kind: account.kind,
    goalAmount: Number(account.goal_amount) || 0,
    createdByUserId: account.created_by_user_id || undefined,
    archived: Boolean(account.archived),
    sortOrder: Number(account.sort_order) || 0,
    createdAt: account.created_at || undefined,
    updatedAt: account.updated_at || undefined,
  }));
  const changes: AssetChange[] = (payload.changes || []).map((change) => ({
    id: change.id,
    workspaceId: change.workspace_id,
    accountId: change.account_id,
    date: change.date,
    amount: Number(change.amount) || 0,
    changeType: change.change_type,
    counterpartAccountId: change.counterpart_account_id || undefined,
    transferGroupId: change.transfer_group_id || undefined,
    linkedEntryId: change.linked_entry_id || undefined,
    memo: change.memo || "",
    createdByUserId: change.created_by_user_id || undefined,
    createdAt: change.created_at || undefined,
  }));
  return { accounts, changes };
}

async function callAssetRpc<TParams extends Record<string, unknown>>(
  name: string,
  params: TParams,
): Promise<AssetData> {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    throw error;
  }
  return mapRawAssetData(data);
}

export async function fetchAccountBookAssetData(
  workspaceId: string,
): Promise<AssetData> {
  return callAssetRpc("account_book_get_asset_data", {
    p_workspace_id: workspaceId,
  });
}

export async function upsertAccountBookAssetAccount(
  account: AssetAccount,
  actorUserId: string,
): Promise<AssetData> {
  return callAssetRpc("account_book_upsert_asset_account", {
    p_account: account,
    p_actor_user_id: actorUserId,
  });
}

export async function deleteAccountBookAssetAccount(
  accountId: string,
  actorUserId: string,
): Promise<AssetData> {
  return callAssetRpc("account_book_delete_asset_account", {
    p_account_id: accountId,
    p_actor_user_id: actorUserId,
  });
}

export async function upsertAccountBookAssetChange(
  change: AssetChange,
  actorUserId: string,
): Promise<AssetData> {
  return callAssetRpc("account_book_upsert_asset_change", {
    p_change: change,
    p_actor_user_id: actorUserId,
  });
}

export async function deleteAccountBookAssetChange(
  changeId: string,
  actorUserId: string,
): Promise<AssetData> {
  return callAssetRpc("account_book_delete_asset_change", {
    p_change_id: changeId,
    p_actor_user_id: actorUserId,
  });
}

export async function transferAccountBookAsset(params: {
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  memo?: string;
  actorUserId: string;
}): Promise<AssetData> {
  return callAssetRpc("account_book_transfer_asset", {
    p_workspace_id: params.workspaceId,
    p_from_account_id: params.fromAccountId,
    p_to_account_id: params.toAccountId,
    p_amount: params.amount,
    p_date: params.date,
    p_memo: params.memo || "",
    p_actor_user_id: params.actorUserId,
  });
}

// ── 가계부 자산/저축 내역 ↔ 통장 자동 연동 (Phase 5) ────────────────────────
// 가계부에서 자산/저축으로 저축하면 동명(세부항목) 통장에 'ledger' 입금을 만든다.
// 변동 id는 entry에 종속(`ledger-<entryId>`)이라 재저장 시 중복 없이 갱신된다.

function ledgerChangeId(entryId: string) {
  return `ledger-${entryId}`;
}

/** 가계부 저축 entry를 동명 통장에 자동 입금 반영(생성/갱신), 저축이 아니면 연동 해제. */
export async function syncLedgerSavingToAsset(
  entry: AccountEntry,
  actorUserId: string,
) {
  try {
    const isSaving =
      entry.type === "expense" && isSavingsCategory(entry.category);
    const data = await fetchAccountBookAssetData(entry.workspaceId);
    const linked = data.changes.find(
      (change) => change.linkedEntryId === entry.id,
    );

    if (!isSaving) {
      if (linked) {
        await deleteAccountBookAssetChange(linked.id, actorUserId);
      }
      return;
    }

    const accountName =
      entry.subCategory?.trim() ||
      getRepresentativeCategory(entry.category, entry.type) ||
      "저축";
    let account = data.accounts.find(
      (item) => !item.archived && item.name.trim() === accountName,
    );
    if (!account) {
      const created = await upsertAccountBookAssetAccount(
        {
          id: createId("asset-account"),
          workspaceId: entry.workspaceId,
          name: accountName,
          kind: "기타",
          goalAmount: 0,
          archived: false,
          sortOrder: data.accounts.length,
          createdByUserId: actorUserId,
        },
        actorUserId,
      );
      account = created.accounts.find(
        (item) => !item.archived && item.name.trim() === accountName,
      );
    }
    if (!account) return;

    await upsertAccountBookAssetChange(
      {
        id: ledgerChangeId(entry.id),
        workspaceId: entry.workspaceId,
        accountId: account.id,
        date: entry.date,
        amount: Math.trunc(entry.amount),
        changeType: "ledger",
        linkedEntryId: entry.id,
        memo: entry.item || "",
        createdByUserId: actorUserId,
      },
      actorUserId,
    );
  } catch (error) {
    console.warn("가계부 저축 → 통장 연동 실패(무시):", error);
  }
}

/** 가계부 저축 entry 삭제 시 연동된 통장 변동을 제거. */
export async function removeLedgerAssetLink(
  entryId: string,
  workspaceId: string,
  actorUserId: string,
) {
  try {
    const data = await fetchAccountBookAssetData(workspaceId);
    const linked = data.changes.find(
      (change) => change.linkedEntryId === entryId,
    );
    if (linked) {
      await deleteAccountBookAssetChange(linked.id, actorUserId);
    }
  } catch (error) {
    console.warn("가계부 저축 통장 연동 해제 실패(무시):", error);
  }
}
