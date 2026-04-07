"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAccountBookStore } from "../repository";
import { getWorkspaceById, resolveWorkspaceEntries } from "../storage";
import { AccountBookStore } from "../types";

const ACTIVE_USER_ACCESS_KEY = "hwang-account-book-active-user";

function getStoredActiveUserId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_USER_ACCESS_KEY);
}

function setStoredActiveUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    window.localStorage.setItem(ACTIVE_USER_ACCESS_KEY, userId);
    return;
  }
  window.localStorage.removeItem(ACTIVE_USER_ACCESS_KEY);
}

function canAccessWorkspace(
  userId: string,
  workspaceId: string,
  store: AccountBookStore,
) {
  const workspace = getWorkspaceById(store, workspaceId);
  if (!workspace) return false;
  if (workspace.type === "shared") {
    return workspace.memberIds.includes(userId);
  }
  return workspace.ownerUserId === userId || workspace.memberIds.includes(userId);
}

export function useAccountBookStore(selectedWorkspaceId: string | null) {
  const [store, setStore] = useState<AccountBookStore | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // ── Initial Load ──
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const nextStore = await fetchAccountBookStore();
        if (!active) return;
        setStore(nextStore);
        const storedUserId = getStoredActiveUserId();
        setActiveUserId(
          storedUserId && nextStore.users.some((user) => user.id === storedUserId)
            ? storedUserId
            : null,
        );
        setLoadError(null);
      } catch (error) {
        console.error("가계부 불러오기 실패:", error);
        if (!active) return;
        setLoadError("가계부 데이터를 불러오지 못했습니다.");
      } finally {
        if (active) {
          setStorageReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ── Active User ──
  const activeUser = useMemo(
    () => store?.users.find((user) => user.id === activeUserId) || null,
    [activeUserId, store],
  );

  const effectiveActiveUserId = useMemo(() => {
    if (!store || !selectedWorkspaceId) {
      return activeUserId;
    }

    if (
      activeUserId &&
      canAccessWorkspace(activeUserId, selectedWorkspaceId, store)
    ) {
      return activeUserId;
    }

    const workspace = getWorkspaceById(store, selectedWorkspaceId);
    if (!workspace) {
      return activeUserId;
    }

    return workspace.ownerUserId || workspace.memberIds[0] || activeUserId;
  }, [activeUserId, selectedWorkspaceId, store]);

  // ── Selected Workspace ──
  const selectedWorkspace = useMemo(() => {
    if (!store || !selectedWorkspaceId || !effectiveActiveUserId) return null;
    if (!canAccessWorkspace(effectiveActiveUserId, selectedWorkspaceId, store)) {
      return null;
    }
    return getWorkspaceById(store, selectedWorkspaceId);
  }, [effectiveActiveUserId, selectedWorkspaceId, store]);

  const selectedEntries = useMemo(() => {
    if (!store || !selectedWorkspaceId) return [];
    return resolveWorkspaceEntries(store, selectedWorkspaceId);
  }, [selectedWorkspaceId, store]);

  const selectedWorkspaceMonthlyMemos = useMemo(() => {
    if (!store || !selectedWorkspaceId) return [];
    return store.monthlyMemos.filter(
      (monthlyMemo) => monthlyMemo.workspaceId === selectedWorkspaceId,
    );
  }, [selectedWorkspaceId, store]);

  const manageableSharedWorkspaces = useMemo(
    () =>
      activeUser && store
        ? store.workspaces.filter(
            (workspace) =>
              workspace.type === "shared" &&
              workspace.memberIds.includes(activeUser.id),
          )
        : [],
    [activeUser, store],
  );

  // ── Sync Effects ──
  useEffect(() => {
    if (!store) return;
    if (activeUserId && store.users.some((user) => user.id === activeUserId))
      return;
    setActiveUserId(null);
    setStoredActiveUserId(null);
  }, [activeUserId, store]);

  useEffect(() => {
    if (!effectiveActiveUserId || effectiveActiveUserId === activeUserId) return;
    setActiveUserId(effectiveActiveUserId);
    setStoredActiveUserId(effectiveActiveUserId);
  }, [activeUserId, effectiveActiveUserId]);

  // ── Store Mutation Helper ──
  const commitStoreChange = async (
    action: () => Promise<AccountBookStore>,
    failureMessage = "가계부 저장에 실패했어요. 잠시 후 다시 시도해주세요.",
  ) => {
    try {
      const savedStore = await action();
      setStore(savedStore);
      return savedStore;
    } catch (error) {
      console.error("가계부 저장 실패:", error);
      alert(failureMessage);
      return null;
    }
  };

  // ── Active User Setter (with localStorage sync) ──
  const updateActiveUserId = (userId: string | null) => {
    setActiveUserId(userId);
    setStoredActiveUserId(userId);
  };

  return {
    store,
    setStore,
    storageReady,
    loadError,

    activeUser,
    activeUserId,
    effectiveActiveUserId,
    updateActiveUserId,

    selectedWorkspace,
    selectedEntries,
    selectedWorkspaceMonthlyMemos,
    manageableSharedWorkspaces,

    commitStoreChange,
  };
}
