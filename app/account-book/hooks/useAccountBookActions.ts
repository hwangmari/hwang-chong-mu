"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/common/ModalProvider";
import {
  addAccountBookSharedRoomMember,
  createAccountBookSharedRoomWithOwner,
  createAccountBookSharedWorkspace,
  createAccountBookUser,
  deleteAccountBookEntry,
  deleteAccountBookSharedWorkspace,
  fetchAccountBookStore,
  joinAccountBookSharedRoom,
  logoutAccountBook,
  removeAccountBookSharedRoomMember,
  removeLedgerAssetLink,
  syncLedgerSavingToAsset,
  toggleAccountBookShareLink,
  updateAccountBookUser,
  updateAccountBookWorkspaceProfile,
  updateAccountBookWorkspaceSettings,
  upsertAccountBookEntry,
  upsertAccountBookMonthlyMemo,
  verifyAccountBookUserPassword,
} from "../repository";
import {
  getPersonalShareTargets,
  getWorkspaceById,
  isEntrySharedToWorkspace,
  toggleShareLink,
} from "../storage";
import { AccountBookStore, AccountBookWorkspace, AccountEntry } from "../types";

function normalizeMemberName(name: string) {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

function findPersonalUserByName(store: AccountBookStore, userName: string) {
  const normalizedUserName = normalizeMemberName(userName);
  return (
    store.users.find(
      (user) => normalizeMemberName(user.name) === normalizedUserName,
    ) || null
  );
}

function findRoomMemberByName(
  store: AccountBookStore,
  workspaceId: string,
  userName: string,
) {
  const workspace = getWorkspaceById(store, workspaceId);
  if (!workspace || workspace.type !== "shared") return null;
  const normalizedUserName = normalizeMemberName(userName);
  return (
    store.users.find(
      (user) =>
        workspace.memberIds.includes(user.id) &&
        normalizeMemberName(user.name) === normalizedUserName,
    ) || null
  );
}

type StoreHelpers = {
  store: AccountBookStore;
  setStore: (store: AccountBookStore) => void;
  activeUserId: string | null;
  effectiveActiveUserId: string | null;
  activeUser: { id: string; name: string } | null;
  selectedWorkspace: AccountBookWorkspace | null;
  updateActiveUserId: (userId: string | null) => void;
  reloadStore: () => Promise<AccountBookStore | null>;
  commitStoreChange: (
    action: () => Promise<AccountBookStore>,
    failureMessage?: string,
  ) => Promise<AccountBookStore | null>;
};

export function useAccountBookActions(helpers: StoreHelpers) {
  const router = useRouter();
  const { openAlert } = useModal();
  const {
    store,
    setStore,
    activeUserId,
    effectiveActiveUserId,
    activeUser,
    selectedWorkspace,
    updateActiveUserId,
    reloadStore,
    commitStoreChange,
  } = helpers;

  // 비밀번호는 서버만 알고 있다. 화면은 "맞다/틀리다"만 물어본다.
  // (예전에는 store에 담겨 내려온 평문 비밀번호를 브라우저에서 비교했다.)
  const checkUserPassword = useCallback(
    async (userId: string, userPassword: string) => {
      try {
        return await verifyAccountBookUserPassword(userId, userPassword);
      } catch (error) {
        console.error("비밀번호 확인 실패:", error);
        void openAlert(
          "비밀번호를 확인하지 못했어요. 잠시 후 다시 시도해주세요.",
        );
        return null;
      }
    },
    [openAlert],
  );

  // 로그인 전에는 서버가 방 목록을 내려주지 않는다.
  // 그래서 비밀번호 확인 후 그 사람 기준으로 다시 받아온 뒤 개인방을 찾는다.
  const findPersonalWorkspace = useCallback(
    (nextStore: AccountBookStore, user: { id: string; personalWorkspaceId: string }) =>
      nextStore.workspaces.find(
        (workspace) => workspace.id === user.personalWorkspaceId,
      ) ||
      nextStore.workspaces.find(
        (workspace) =>
          workspace.type === "personal" && workspace.ownerUserId === user.id,
      ) ||
      null,
    [],
  );

  const getActingUserId = useCallback(
    () => effectiveActiveUserId || activeUser?.id || "",
    [effectiveActiveUserId, activeUser],
  );

  // ── Workspace Ledger Actions ──

  const handleToggleShare = useCallback(
    async (entryId: string, targetWorkspaceId: string) => {
      const actingUserId = getActingUserId();
      const sourceEntry = store.entries.find((entry) => entry.id === entryId);
      if (!sourceEntry || !actingUserId) return;
      if (sourceEntry.createdByUserId !== actingUserId) {
        void openAlert("내가 작성한 내역만 공유 상태를 바꿀 수 있어요.");
        return;
      }
      const previousStore = store;
      const optimisticStore = toggleShareLink(
        store,
        sourceEntry.id,
        sourceEntry.workspaceId,
        targetWorkspaceId,
        actingUserId,
      );

      setStore(optimisticStore);

      try {
        const savedStore = await toggleAccountBookShareLink(
          sourceEntry.id,
          sourceEntry.workspaceId,
          targetWorkspaceId,
          actingUserId,
        );
        setStore(savedStore);
      } catch (error) {
        console.error("가계부 공유 처리 실패:", error);
        try {
          const latestStore = await fetchAccountBookStore();
          setStore(latestStore);
        } catch {
          setStore(previousStore);
        }
        void openAlert(
          error instanceof Error
            ? error.message
            : "공유 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
        );
      }
    },
    [store, setStore, getActingUserId, openAlert],
  );

  const handleSaveEntry = useCallback(
    async (entry: AccountEntry) => {
      const saved = Boolean(
        await commitStoreChange(() =>
          upsertAccountBookEntry(entry, getActingUserId()),
        ),
      );
      if (saved) {
        // 가계부 자산/저축 저축 → 동명 통장 자동 입금(반영 실패해도 저장은 유지)
        void syncLedgerSavingToAsset(entry, getActingUserId());
      }
      return saved;
    },
    [commitStoreChange, getActingUserId],
  );

  const handleSaveMonthlyMemo = useCallback(
    async (monthKey: string, memo: string) => {
      if (!selectedWorkspace) return false;
      return Boolean(
        await commitStoreChange(
          () =>
            upsertAccountBookMonthlyMemo(
              selectedWorkspace.id,
              monthKey,
              memo,
              getActingUserId(),
            ),
          "이번 달 메모를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    },
    [selectedWorkspace, commitStoreChange, getActingUserId],
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const targetEntry = store?.entries.find((entry) => entry.id === entryId);
      const result = await commitStoreChange(() =>
        deleteAccountBookEntry(entryId, getActingUserId()),
      );
      if (result && targetEntry) {
        // 연동된 통장 변동도 함께 제거(실패해도 삭제는 유지)
        void removeLedgerAssetLink(
          entryId,
          targetEntry.workspaceId,
          getActingUserId(),
        );
      }
    },
    [store, commitStoreChange, getActingUserId],
  );

  const handleChangeAnnualSavingGoal = useCallback(
    async (value: number) => {
      if (!selectedWorkspace) return false;
      return Boolean(
        await commitStoreChange(
          () =>
            updateAccountBookWorkspaceSettings(selectedWorkspace, {
              annualSavingGoal: value,
            }),
          "연간 저축 목표를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    },
    [selectedWorkspace, commitStoreChange],
  );

  const handleChangeMonthlyBudget = useCallback(
    async (value: number, monthKey: string) => {
      if (!selectedWorkspace) return false;
      const nextBudgets = { ...(selectedWorkspace.monthlyBudgets ?? {}) };
      if (value > 0) nextBudgets[monthKey] = Math.trunc(value);
      else delete nextBudgets[monthKey];
      return Boolean(
        await commitStoreChange(
          () =>
            updateAccountBookWorkspaceSettings(selectedWorkspace, {
              monthlyBudgets: nextBudgets,
            }),
          "월 예산을 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    },
    [selectedWorkspace, commitStoreChange],
  );

  const getShareTargets = useCallback(() => {
    if (!selectedWorkspace) return [];
    return getPersonalShareTargets(store, selectedWorkspace);
  }, [store, selectedWorkspace]);

  const checkIsEntryShared = useCallback(
    (entryId: string, targetWorkspaceId: string) =>
      isEntrySharedToWorkspace(store, entryId, targetWorkspaceId),
    [store],
  );

  // ── Workspace Hub Actions ──

  const handleCreateServerRoom = useCallback(
    async (
      roomName: string,
      roomPassword: string,
      ownerName: string,
      ownerPassword: string,
    ) => {
      try {
        const result = await createAccountBookSharedRoomWithOwner(
          roomName,
          roomPassword,
          ownerName,
          ownerPassword,
        );
        setStore(result.store);
        updateActiveUserId(result.userId);
        router.push(`/account-book?workspaceId=${result.workspaceId}`);
        void openAlert(
          `서버방이 만들어졌어요. 참여 코드는 ${result.inviteCode} 입니다.`,
        );
      } catch (error) {
        console.error("서버방 생성 실패:", error);
        void openAlert("서버방을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
        throw error;
      }
    },
    [setStore, updateActiveUserId, router, openAlert],
  );

  const handleCreatePersonalWorkspace = useCallback(
    async (userName: string, userPassword: string) => {
      try {
        const existingUser = findPersonalUserByName(store, userName);
        if (existingUser) {
          const isCorrect = await checkUserPassword(
            existingUser.id,
            userPassword,
          );
          if (isCorrect === null) return;
          if (!isCorrect) {
            void openAlert(
              "이미 같은 닉네임의 개인 가계부가 있어요. 개인방 로그인으로 들어가거나 비밀번호를 다시 확인해주세요.",
            );
            return;
          }

          updateActiveUserId(existingUser.id);
          const nextStore = await reloadStore();
          const existingWorkspace = nextStore
            ? findPersonalWorkspace(nextStore, existingUser)
            : null;

          if (!existingWorkspace) {
            void openAlert("기존 개인 가계부 작업공간을 찾지 못했어요.");
            return;
          }

          router.push(`/account-book?workspaceId=${existingWorkspace.id}`);
          void openAlert(
            "이미 만든 개인 가계부가 있어 기존 작업공간으로 다시 연결했어요.",
          );
          return;
        }

        const result = await createAccountBookUser(userName, userPassword);
        setStore(result.store);
        updateActiveUserId(result.userId);
        router.push(`/account-book?workspaceId=${result.workspaceId}`);
      } catch (error) {
        console.error("개인 작업공간 생성 실패:", error);
        void openAlert("개인 작업공간을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
        throw error;
      }
    },
    [
      store,
      setStore,
      updateActiveUserId,
      reloadStore,
      router,
      openAlert,
      checkUserPassword,
      findPersonalWorkspace,
    ],
  );

  const handleCreateSharedWorkspaceForActiveUser = useCallback(
    async (roomName: string, roomPassword: string) => {
      if (!activeUser) return;
      await commitStoreChange(
        () =>
          createAccountBookSharedWorkspace(roomName, roomPassword, [
            activeUser.id,
          ]),
        "공용방을 만들지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    },
    [activeUser, commitStoreChange],
  );

  const handleJoinServerRoom = useCallback(
    async (inviteCode: string, userName: string, userPassword: string) => {
      try {
        const targetWorkspace = store.workspaces.find(
          (workspace) =>
            workspace.type === "shared" &&
            (workspace.inviteCode || "").toUpperCase() === inviteCode,
        );
        const existingMember =
          targetWorkspace &&
          findRoomMemberByName(store, targetWorkspace.id, userName);

        if (targetWorkspace && existingMember) {
          const isCorrect = await checkUserPassword(
            existingMember.id,
            userPassword,
          );
          if (isCorrect === null) return;
          if (!isCorrect) {
            void openAlert(
              "이미 등록된 참가자 이름입니다. 비밀번호를 다시 확인해주세요.",
            );
            return;
          }
          updateActiveUserId(existingMember.id);
          await reloadStore();
          router.push("/account-book");
          return;
        }

        const result = await joinAccountBookSharedRoom(
          inviteCode,
          userName,
          userPassword,
        );
        setStore(result.store);
        updateActiveUserId(result.userId);
        router.push("/account-book");
      } catch (error) {
        console.error("서버방 참여 실패:", error);
        void openAlert("참여 코드 확인 후 다시 시도해주세요.");
        throw error;
      }
    },
    [
      store,
      setStore,
      updateActiveUserId,
      reloadStore,
      router,
      openAlert,
      checkUserPassword,
    ],
  );

  const handleLoginPersonalWorkspace = useCallback(
    async (userName: string, userPassword: string) => {
      const targetUser = findPersonalUserByName(store, userName);
      if (!targetUser) {
        void openAlert("일치하는 개인 가계부 사용자를 찾지 못했어요.");
        return;
      }

      const isCorrect = await checkUserPassword(targetUser.id, userPassword);
      if (isCorrect === null) return;
      if (!isCorrect) {
        void openAlert("개인 비밀번호가 맞지 않아요.");
        return;
      }

      updateActiveUserId(targetUser.id);
      const nextStore = await reloadStore();
      const targetWorkspace = nextStore
        ? findPersonalWorkspace(nextStore, targetUser)
        : null;

      if (!targetWorkspace) {
        void openAlert("개인 가계부 작업공간을 찾지 못했어요.");
        return;
      }

      router.push(`/account-book?workspaceId=${targetWorkspace.id}`);
    },
    [
      store,
      updateActiveUserId,
      reloadStore,
      router,
      openAlert,
      checkUserPassword,
      findPersonalWorkspace,
    ],
  );

  const handleResetActiveUser = useCallback(() => {
    // 서버의 출입증도 함께 폐기한다(브라우저에만 지우면 토큰이 계속 유효하다).
    void logoutAccountBook();
    updateActiveUserId(null);
    router.push("/account-book");
  }, [updateActiveUserId, router]);

  // ── Settings Actions ──

  const handleCreateSharedWorkspace = useCallback(
    async (name: string, password: string) => {
      if (!activeUser) return;
      await commitStoreChange(
        () =>
          createAccountBookSharedWorkspace(name, password, [activeUser.id]),
        "공용방을 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    },
    [activeUser, commitStoreChange],
  );

  const handleUpdateUser = useCallback(
    // password가 빈 문자열이면 서버가 기존 비밀번호를 그대로 둔다
    // (화면이 더 이상 기존 비밀번호를 들고 있지 않기 때문).
    async (userId: string, name: string, password: string) => {
      const currentUser = store.users.find((user) => user.id === userId);
      if (!currentUser) return;
      await commitStoreChange(
        () => updateAccountBookUser(userId, name, password),
        "사용자 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    },
    [store, commitStoreChange],
  );

  const handleUpdateSharedWorkspace = useCallback(
    async (workspaceId: string, name: string, password: string) => {
      const currentWorkspace = store.workspaces.find(
        (workspace) => workspace.id === workspaceId,
      );
      if (!currentWorkspace) return;
      await commitStoreChange(
        // password가 빈 문자열이면 서버가 기존 비밀번호를 그대로 둔다.
        () => updateAccountBookWorkspaceProfile(workspaceId, name, password),
        "공용방 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    },
    [store, commitStoreChange],
  );

  const handleDeleteSharedWorkspace = useCallback(
    async (workspaceId: string) =>
      commitStoreChange(
        () => deleteAccountBookSharedWorkspace(workspaceId),
        "공용방을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.",
      ),
    [commitStoreChange],
  );

  const handleAddRoomMember = useCallback(
    async (workspaceId: string, name: string, password: string) => {
      if (findRoomMemberByName(store, workspaceId, name)) {
        void openAlert("이미 이 방에 같은 이름의 참가자가 있습니다.");
        return;
      }

      await commitStoreChange(
        () => addAccountBookSharedRoomMember(workspaceId, name, password),
        "서버방 참가자를 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    },
    [store, commitStoreChange, openAlert],
  );

  const handleRemoveRoomMember = useCallback(
    async (workspaceId: string, userId: string) =>
      commitStoreChange(
        () => removeAccountBookSharedRoomMember(workspaceId, userId),
        "서버방 참가자를 제외하지 못했어요. 잠시 후 다시 시도해주세요.",
      ),
    [commitStoreChange],
  );

  return {
    // Ledger actions
    handleToggleShare,
    handleSaveEntry,
    handleSaveMonthlyMemo,
    handleDeleteEntry,
    handleChangeAnnualSavingGoal,
    handleChangeMonthlyBudget,
    getShareTargets,
    checkIsEntryShared,

    // Hub actions
    handleCreateServerRoom,
    handleCreatePersonalWorkspace,
    handleCreateSharedWorkspaceForActiveUser,
    handleJoinServerRoom,
    handleLoginPersonalWorkspace,
    handleResetActiveUser,

    // Settings actions
    handleCreateSharedWorkspace,
    handleUpdateUser,
    handleUpdateSharedWorkspace,
    handleDeleteSharedWorkspace,
    handleAddRoomMember,
    handleRemoveRoomMember,
  };
}
