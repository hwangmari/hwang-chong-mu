"use client";

import { supabase } from "@/lib/supabase";
import {
  AccountBookStore,
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
} from "./types";
import {
  ACCOUNT_BOOK_STORE_KEY,
  LEGACY_ACCOUNT_BOOK_KEY,
  getAccountBookStore,
  normalizeStore,
  saveAccountBookStore,
  toggleShareLink,
} from "./storage";

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

export async function upsertAccountBookEntry(entry: AccountEntry) {
  try {
    return await callStoreRpc("account_book_upsert_entry", {
      p_entry: entry,
    });
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn(
        "가계부 원격 저장에 실패해 로컬 데이터로 내역을 저장합니다.",
        error,
      );
      const currentStore = getAccountBookStore();
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

export async function deleteAccountBookEntry(entryId: string) {
  try {
    return await callStoreRpc("account_book_delete_entry", {
      p_entry_id: entryId,
    });
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn(
        "가계부 원격 삭제에 실패해 로컬 데이터에서 내역을 제거합니다.",
        error,
      );
      const currentStore = getAccountBookStore();

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
  sharedByUserId: string,
) {
  try {
    return await callStoreRpc("account_book_toggle_share_link", {
      p_source_entry_id: sourceEntryId,
      p_source_workspace_id: sourceWorkspaceId,
      p_target_workspace_id: targetWorkspaceId,
      p_shared_by_user_id: sharedByUserId,
    });
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn(
        "가계부 원격 공유 처리에 실패해 로컬 데이터에만 반영합니다.",
        error,
      );
      const currentStore = getAccountBookStore();
      return persistLocalStore(
        toggleShareLink(
          currentStore,
          sourceEntryId,
          sourceWorkspaceId,
          targetWorkspaceId,
          sharedByUserId,
        ),
      );
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
  nextEntries: AccountEntry[],
) {
  let latestStore = currentStore;
  const directEntries = currentStore.entries.filter(
    (entry) => entry.workspaceId === workspaceId,
  );

  for (const entry of directEntries) {
    latestStore = await deleteAccountBookEntry(entry.id);
  }

  for (const entry of nextEntries) {
    latestStore = await upsertAccountBookEntry(entry);
  }

  return latestStore;
}
