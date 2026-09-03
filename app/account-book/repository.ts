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
  StockTrade,
} from "./types";
import {
  ACCOUNT_BOOK_STORE_KEY,
  LEGACY_ACCOUNT_BOOK_KEY,
  clearStoredAccountBookSession,
  getAccountBookStore,
  getStoredSessionToken,
  getWorkspaceById,
  normalizeStore,
  saveAccountBookStore,
  setStoredSessionToken,
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

// 마이그레이션 SQL을 아직 실행하지 않은 상태(= 새 RPC가 DB에 없음)를 알아본다.
// PostgREST는 없는 함수를 부르면 PGRST202, Postgres는 42883(undefined_function)을 준다.
// 에러 코드만 본다. 메시지 문구("does not exist")로 판단하면 컬럼/테이블이 없다는
// 전혀 다른 에러까지 "구버전이구나"로 오해해 예전 전체 노출 경로로 되돌아갈 수 있다.
function isMissingFunctionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : "";

  return code === "PGRST202" || code === "42883";
}

// 서버가 출입증을 거부하면 'UNAUTHORIZED' 라는 말로 알려준다.
// 이때는 저장해 둔 출입증을 버리고 다시 로그인하게 해야 한다.
export function isAccountBookUnauthorizedError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toUpperCase()
      : "";
  const details =
    "details" in error && typeof error.details === "string"
      ? error.details.toUpperCase()
      : "";

  return message.includes("UNAUTHORIZED") || details.includes("UNAUTHORIZED");
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

// 저장/삭제 RPC들은 마지막에 무인자 account_book_get_store()를 호출해 그 결과를 돌려준다.
// 그 무인자 버전은 이제 "빈 껍데기"라서(전체 노출을 막으려고 그렇게 바꿨다) 쓸 수 없다.
// 그래서 반환값은 버리고, 지금 로그인한 사람 기준으로 다시 한 번 받아온다.
async function callStoreRpc<TParams extends Record<string, unknown>>(
  name: string,
  params?: TParams,
) {
  const { error } = await supabase.rpc(name, params);
  if (error) {
    if (isAccountBookUnauthorizedError(error)) {
      clearStoredAccountBookSession();
    }
    throw error;
  }

  return fetchAccountBookStore();
}

/** 출입증이 필요한 RPC 를 부를 때 쓰는 파라미터. 출입증이 없으면 바로 막는다. */
function requireSessionToken() {
  const token = getStoredSessionToken();
  if (!token) {
    throw new Error("UNAUTHORIZED: 로그인이 필요합니다.");
  }
  return token;
}

export function clearLegacyAccountBookLocalData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCOUNT_BOOK_STORE_KEY);
  window.localStorage.removeItem(LEGACY_ACCOUNT_BOOK_KEY);
}

/** 로그인 화면에 보여줄 사용자 목록. 비밀번호는 서버가 아예 내려주지 않는다. */
export async function fetchAccountBookUserList(): Promise<AccountBookUser[]> {
  const { data, error } = await supabase.rpc("account_book_list_users");
  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : []) as AccountBookUser[];
}

/**
 * 로그인 — 비밀번호가 맞으면 서버가 임시 출입증(token)을 발급한다.
 * 그 출입증을 localStorage 에 넣어두고, 이후 모든 요청에 함께 보낸다.
 * 비밀번호 자체는 절대 저장하지 않는다.
 */
export async function verifyAccountBookUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("account_book_user_login", {
    p_user_id: userId,
    p_password: password,
  });
  if (error) {
    throw error;
  }

  const payload = (data || null) as { ok?: boolean; token?: string } | null;
  if (!payload?.ok || !payload.token) {
    return false;
  }

  setStoredSessionToken(payload.token);
  return true;
}

/** 로그아웃 — 서버의 출입증을 폐기하고 브라우저에 남은 것도 지운다. */
export async function logoutAccountBook() {
  const token = getStoredSessionToken();
  clearStoredAccountBookSession();
  if (!token) return;

  try {
    await supabase.rpc("account_book_logout", { p_token: token });
  } catch (error) {
    console.warn("가계부 로그아웃 처리에 실패했습니다(무시).", error);
  }
}

/** 가계부방 비밀번호 확인 — 출입증 주인이 그 방 멤버일 때만 물어볼 수 있다. */
export async function verifyAccountBookWorkspacePassword(
  workspaceId: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("account_book_workspace_unlock", {
    p_token: requireSessionToken(),
    p_workspace_id: workspaceId,
    p_password: password,
  });
  if (error) {
    if (isAccountBookUnauthorizedError(error)) {
      clearStoredAccountBookSession();
    }
    throw error;
  }

  return data === true;
}

/**
 * 가계부 데이터 불러오기.
 *
 * 예전에는 인자 없는 account_book_get_store()가 "모든 사람의 비밀번호와 모든 내역"을
 * 통째로 내려줬다. 이제는 로그인할 때 받은 출입증을 함께 보내고,
 * 서버가 그 출입증 주인이 볼 수 있는 범위만 내려준다.
 *
 * - 로그인 전(출입증 없음): 사용자 목록만 받아 껍데기 store를 만든다.
 * - 출입증이 만료/무효면: 저장해 둔 출입증을 지우고 로그인 전 상태로 되돌린다.
 * - 마이그레이션 SQL을 아직 실행하지 않았다면(새 RPC 없음) 예전 무인자 호출로 되돌아가
 *   앱이 멈추지 않게 한다. 읽기에만 적용되는 폴백이고, 로그인·수정은 그냥 막힌다.
 */
export async function fetchAccountBookStore() {
  try {
    const token = getStoredSessionToken();

    if (!token) {
      try {
        const users = await fetchAccountBookUserList();
        return normalizeRpcStore({ version: 1, users });
      } catch (error) {
        if (!isMissingFunctionError(error)) {
          throw error;
        }
        // SQL 실행 전 폴백(읽기 전용)
        return fetchLegacyAccountBookStore();
      }
    }

    const { data, error } = await supabase.rpc("account_book_get_store", {
      p_token: token,
    });

    if (error) {
      if (isAccountBookUnauthorizedError(error)) {
        // 출입증 만료 — 로그인 전 화면으로 되돌린다.
        clearStoredAccountBookSession();
        const users = await fetchAccountBookUserList();
        return normalizeRpcStore({ version: 1, users });
      }
      if (!isMissingFunctionError(error)) {
        throw error;
      }
      // SQL 실행 전 폴백(읽기 전용)
      return fetchLegacyAccountBookStore();
    }

    return normalizeRpcStore((data || null) as Partial<AccountBookStore> | null);
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn("가계부 원격 불러오기에 실패해 로컬 데이터를 사용합니다.", error);
      return getAccountBookStore();
    }

    throw error;
  }
}

/** 마이그레이션 SQL 실행 전에만 쓰이는 옛 경로(인자 없는 get_store). */
async function fetchLegacyAccountBookStore() {
  console.warn(
    "가계부 보안 SQL(20260904_scope_account_book_get_store.sql)이 아직 적용되지 않았습니다.",
  );
  const { data, error } = await supabase.rpc("account_book_get_store");
  if (error) {
    throw error;
  }

  return normalizeRpcStore((data || null) as Partial<AccountBookStore> | null);
}

async function callRoomActionRpc<TParams extends Record<string, unknown>>(
  name: string,
  params: TParams,
  loginPassword: string,
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

  const userId = payload?.userId || "";

  // 방을 만들거나 참여하면 그 자리에서 바로 로그인해 출입증을 받아온다.
  // (출입증이 없으면 서버가 아무 데이터도 내려주지 않는다.)
  if (userId) {
    await verifyAccountBookUserPassword(userId, loginPassword);
  }

  // payload.store는 전체 노출 시절의 무인자 get_store 결과라 쓰지 않는다.
  // 방금 받은 출입증 기준으로 다시 받아온다.
  return {
    store: await fetchAccountBookStore(),
    userId,
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

/**
 * 사용자 이름/비밀번호 수정.
 * 화면이 더 이상 기존 비밀번호를 들고 있지 않으므로, 비밀번호 칸을 비워두면 그대로 유지된다.
 * (개인 가계부방 이름/비밀번호도 서버에서 함께 맞춰 준다 — 예전 두 번 호출하던 동작과 같다.)
 */
export async function updateAccountBookUser(
  userId: string,
  name: string,
  password: string,
) {
  return callStoreRpc("account_book_update_user_profile", {
    p_token: requireSessionToken(),
    p_user_id: userId,
    p_name: name,
    p_password: password,
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
    p_monthly_budget: 0,
    p_asset_goal_map: {},
    p_owner_user_id: userId,
    p_member_ids: [userId],
  });

  await callStoreRpc("account_book_upsert_user", {
    p_id: userId,
    p_name: name,
    p_password: password,
    p_personal_workspace_id: personalWorkspaceId,
  });

  // 방금 만든 계정으로 바로 로그인해 출입증을 받아둔다.
  await verifyAccountBookUserPassword(userId, password);
  const store = await fetchAccountBookStore();

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

type WorkspaceSettingsPatch = Pick<
  AccountBookWorkspace,
  "annualSavingGoal" | "monthlyBudget" | "monthlyBudgets" | "assetGoalMap"
>;

/**
 * 예산·목표만 수정.
 * 예전에는 이때도 upsert_workspace에 비밀번호를 같이 실어 보냈는데,
 * 이제 화면에 비밀번호가 없으므로 필요한 값만 바꾸는 전용 RPC를 쓴다.
 */
export async function updateAccountBookWorkspaceSettings(
  workspace: AccountBookWorkspace,
  patch: Partial<WorkspaceSettingsPatch>,
) {
  const nextWorkspace: AccountBookWorkspace = { ...workspace, ...patch };

  try {
    return await callStoreRpc("account_book_set_workspace_settings", {
      p_token: requireSessionToken(),
      p_workspace_id: nextWorkspace.id,
      p_annual_saving_goal:
        nextWorkspace.annualSavingGoal || DEFAULT_WORKSPACE_ANNUAL_SAVING_GOAL,
      p_monthly_budget: nextWorkspace.monthlyBudget || 0,
      p_monthly_budgets: nextWorkspace.monthlyBudgets ?? {},
      p_asset_goal_map: nextWorkspace.assetGoalMap || {},
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
          currentWorkspace.id === nextWorkspace.id
            ? nextWorkspace
            : currentWorkspace,
        ),
      });
    }

    throw error;
  }
}

/**
 * 가계부방 이름/비밀번호 수정.
 * 비밀번호를 빈 문자열로 보내면 서버가 기존 비밀번호를 그대로 둔다.
 */
export async function updateAccountBookWorkspaceProfile(
  workspaceId: string,
  name: string,
  password: string,
) {
  return callStoreRpc("account_book_update_workspace_profile", {
    p_token: requireSessionToken(),
    p_workspace_id: workspaceId,
    p_name: name,
    p_password: password,
  });
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
    p_monthly_budget: 0,
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
  return callRoomActionRpc(
    "account_book_create_shared_room",
    {
      p_room_name: roomName,
      p_room_password: roomPassword,
      p_owner_name: ownerName,
      p_owner_password: ownerPassword,
    },
    ownerPassword,
  );
}

export async function joinAccountBookSharedRoom(
  inviteCode: string,
  userName: string,
  userPassword: string,
) {
  return callRoomActionRpc(
    "account_book_join_shared_room",
    {
      p_invite_code: inviteCode,
      p_user_name: userName,
      p_user_password: userPassword,
    },
    userPassword,
  );
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

// ── 투자 계좌 매매일지 (주식 포트폴리오) ────────────────────────────────────
// mutation RPC는 갱신된 trades 전체를 반환 → 훅에서 상태를 통째로 교체한다.

type RawStockTrade = {
  id: string;
  workspace_id: string;
  account_id: string;
  date: string;
  side: StockTrade["side"];
  stock_code: string;
  stock_name: string;
  quantity: number | string;
  price: number | string;
  fee: number | string | null;
  memo: string | null;
  created_by_user_id: string | null;
};

function mapRawStockTrades(raw: unknown): StockTrade[] {
  const rows = (Array.isArray(raw) ? raw : []) as RawStockTrade[];
  return rows.map((trade) => ({
    id: trade.id,
    workspaceId: trade.workspace_id,
    accountId: trade.account_id,
    date: trade.date,
    side: trade.side,
    stockCode: trade.stock_code,
    stockName: trade.stock_name,
    quantity: Number(trade.quantity) || 0,
    price: Number(trade.price) || 0,
    fee: Number(trade.fee) || 0,
    memo: trade.memo || undefined,
    createdByUserId: trade.created_by_user_id || "",
  }));
}

export async function fetchStockTrades(
  workspaceId: string,
): Promise<StockTrade[]> {
  const { data, error } = await supabase.rpc(
    "account_book_get_stock_trades",
    { p_workspace_id: workspaceId },
  );
  if (error) {
    throw error;
  }
  return mapRawStockTrades(data);
}

export async function upsertStockTrade(
  trade: StockTrade,
  actorUserId: string,
): Promise<StockTrade[]> {
  const { data, error } = await supabase.rpc(
    "account_book_upsert_stock_trade",
    { p_trade: trade, p_actor_user_id: actorUserId },
  );
  if (error) {
    throw error;
  }
  return mapRawStockTrades(data);
}

export async function deleteStockTrade(
  tradeId: string,
  actorUserId: string,
): Promise<StockTrade[]> {
  const { data, error } = await supabase.rpc(
    "account_book_delete_stock_trade",
    { p_trade_id: tradeId, p_actor_user_id: actorUserId },
  );
  if (error) {
    throw error;
  }
  return mapRawStockTrades(data);
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
