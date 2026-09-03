"use client";

import { useEffect, useMemo, useState } from "react";
import { useModal } from "@/components/common/ModalProvider";
import {
  fetchAccountBookStore,
  isAccountBookUnauthorizedError,
} from "../repository";
import {
  clearStoredAccountBookSession,
  getStoredActiveUserId,
  getStoredSessionToken,
  getWorkspaceById,
  resolveWorkspaceEntries,
  setStoredActiveUserId,
} from "../storage";
import { AccountBookStore } from "../types";

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
  const { openAlert } = useModal();
  const [store, setStore] = useState<AccountBookStore | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // ── Initial Load ──
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        // 저장해 둔 출입증으로 "내가 볼 수 있는 것만" 받아온다.
        // 출입증이 만료됐으면 fetchAccountBookStore가 알아서 지우고 껍데기를 준다.
        const nextStore = await fetchAccountBookStore();
        if (!active) return;
        setStore(nextStore);

        // 출입증 없이 남아 있는 활성 사용자 표시는 신뢰하지 않는다(로그인 전과 같게 본다).
        const storedUserId = getStoredSessionToken()
          ? getStoredActiveUserId()
          : null;
        if (!storedUserId) {
          clearStoredAccountBookSession();
        }
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
    clearStoredAccountBookSession();
  }, [activeUserId, store]);

  useEffect(() => {
    if (!effectiveActiveUserId || effectiveActiveUserId === activeUserId) return;
    setActiveUserId(effectiveActiveUserId);
    setStoredActiveUserId(effectiveActiveUserId);
  }, [activeUserId, effectiveActiveUserId]);

  // 출입증이 만료되었거나 서버가 거부했을 때: 흔적을 지우고 로그인 전 화면으로 되돌린다.
  const handleExpiredSession = async () => {
    clearStoredAccountBookSession();
    setActiveUserId(null);
    try {
      setStore(await fetchAccountBookStore());
    } catch (error) {
      console.error("가계부 다시 불러오기 실패:", error);
    }
    void openAlert("로그인이 풀렸어요. 비밀번호를 다시 입력해 주세요.");
  };

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
      if (isAccountBookUnauthorizedError(error)) {
        await handleExpiredSession();
        return null;
      }
      void openAlert(failureMessage);
      return null;
    }
  };

  // ── Active User Setter (with localStorage sync) ──
  const updateActiveUserId = (userId: string | null) => {
    setActiveUserId(userId);
    setStoredActiveUserId(userId);
  };

  // 로그인/방 참여 직후처럼 "보이는 범위"가 달라졌을 때 다시 받아온다.
  // (서버가 출입증 주인에 따라 다른 범위를 내려주므로 로그인만 하고 끝내면 화면이 비어 보인다.)
  const reloadStore = async () => {
    try {
      const nextStore = await fetchAccountBookStore();
      setStore(nextStore);
      return nextStore;
    } catch (error) {
      console.error("가계부 다시 불러오기 실패:", error);
      if (isAccountBookUnauthorizedError(error)) {
        await handleExpiredSession();
        return null;
      }
      void openAlert("가계부를 다시 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      return null;
    }
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
    reloadStore,

    selectedWorkspace,
    selectedEntries,
    selectedWorkspaceMonthlyMemos,
    manageableSharedWorkspaces,

    commitStoreChange,
  };
}
