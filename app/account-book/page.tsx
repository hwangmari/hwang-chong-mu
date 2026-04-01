"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  addAccountBookSharedRoomMember,
  createAccountBookSharedRoomWithOwner,
  createAccountBookSharedWorkspace,
  createAccountBookUser,
  deleteAccountBookEntry,
  deleteAccountBookSharedWorkspace,
  fetchAccountBookStore,
  joinAccountBookSharedRoom,
  removeAccountBookSharedRoomMember,
  toggleAccountBookShareLink,
  updateAccountBookUser,
  upsertAccountBookEntry,
  upsertAccountBookWorkspace,
} from "./repository";
import AccountBookLockGate from "./components/AccountBookLockGate";
import WorkspaceHub from "./components/WorkspaceHub";
import WorkspaceLedgerView from "./components/WorkspaceLedgerView";
import WorkspaceSettingsModal from "./components/WorkspaceSettingsModal";
import {
  getPersonalShareTargets,
  getWorkspaceById,
  isEntrySharedToWorkspace,
  resolveWorkspaceEntries,
  toggleShareLink,
} from "./storage";
import { AccountBookStore, AccountEntry, ViewMode } from "./types";

const SETTINGS_ACCESS_KEY = "hwang-account-book-settings-access";
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

function resolveInitialViewMode(value: string | null): ViewMode {
  if (value === "board" || value === "calendar" || value === "ledger") {
    return value;
  }
  return "calendar";
}

function canAccessWorkspace(userId: string, workspaceId: string, store: AccountBookStore) {
  const workspace = getWorkspaceById(store, workspaceId);
  if (!workspace) return false;
  if (workspace.type === "shared") {
    return workspace.memberIds.includes(userId);
  }
  return workspace.ownerUserId === userId || workspace.memberIds.includes(userId);
}

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

function AccountBookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<AccountBookStore | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

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

  const selectedWorkspaceId = searchParams.get("workspaceId");
  const initialViewMode = resolveInitialViewMode(searchParams.get("view"));
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

  useEffect(() => {
    if (!store) return;
    if (activeUserId && store.users.some((user) => user.id === activeUserId)) return;
    setActiveUserId(null);
    setStoredActiveUserId(null);
  }, [activeUserId, store]);

  useEffect(() => {
    if (!effectiveActiveUserId || effectiveActiveUserId === activeUserId) return;
    setActiveUserId(effectiveActiveUserId);
    setStoredActiveUserId(effectiveActiveUserId);
  }, [activeUserId, effectiveActiveUserId]);

  const closeSettings = () => {
    setIsSettingsOpen(false);
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SETTINGS_ACCESS_KEY);
    window.dispatchEvent(new Event("account-book-access-change"));
  };

  if (!storageReady) {
    return (
      <StLoadingPage>
        <StLoadingCard>가계부 허브를 불러오는 중...</StLoadingCard>
      </StLoadingPage>
    );
  }

  if (loadError || !store) {
    return (
      <StLoadingPage>
        <StLoadingCard>
          {loadError || "가계부 데이터를 불러오지 못했습니다."}
        </StLoadingCard>
      </StLoadingPage>
    );
  }

  return (
    <>
      {selectedWorkspace ? (
        <AccountBookLockGate
          password={selectedWorkspace.password}
          accessKey={`hwang-account-book-access-${selectedWorkspace.id}`}
          title={`${selectedWorkspace.name} 비밀번호`}
          description="선택한 가계부방 비밀번호를 입력하면 이 방으로 들어갑니다."
          backToHome={false}
          onBack={() => router.push("/account-book")}
        >
          <WorkspaceLedgerView
            workspace={selectedWorkspace}
            users={store.users}
            currentUserId={effectiveActiveUserId || activeUser?.id || ""}
            entries={selectedEntries}
            shareTargets={getPersonalShareTargets(store, selectedWorkspace)}
            isEntryShared={(entryId: string, targetWorkspaceId: string) =>
              isEntrySharedToWorkspace(store, entryId, targetWorkspaceId)
            }
            onToggleShare={async (entryId: string, targetWorkspaceId: string) => {
              const sourceEntry = store.entries.find(
                (entry) => entry.id === entryId,
              );
              if (!sourceEntry) return;
              const previousStore = store;
              const optimisticStore = toggleShareLink(
                store,
                sourceEntry.id,
                sourceEntry.workspaceId,
                targetWorkspaceId,
                sourceEntry.createdByUserId,
              );

              setStore(optimisticStore);

              try {
                const savedStore = await toggleAccountBookShareLink(
                  sourceEntry.id,
                  sourceEntry.workspaceId,
                  targetWorkspaceId,
                  sourceEntry.createdByUserId,
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
                alert("공유 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
              }
            }}
            onSaveEntry={async (entry: AccountEntry) =>
              Boolean(await commitStoreChange(() => upsertAccountBookEntry(entry)))
            }
            onDeleteEntry={async (entryId: string) => {
              await commitStoreChange(() => deleteAccountBookEntry(entryId));
            }}
            onChangeAnnualSavingGoal={async (value: number) =>
              Boolean(
                await commitStoreChange(() =>
                  upsertAccountBookWorkspace({
                    ...selectedWorkspace,
                    annualSavingGoal: value,
                  }),
                  "연간 저축 목표를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
                ),
              )
            }
            onBack={() => router.push("/account-book")}
            initialViewMode={initialViewMode}
          />
        </AccountBookLockGate>
      ) : (
        <WorkspaceHub
          activeUser={activeUser}
          users={store.users}
          workspaces={store.workspaces}
          onSelectWorkspace={(workspaceId) =>
            router.push(`/account-book?workspaceId=${workspaceId}`)
          }
          onCreateServerRoom={async (
            roomName,
            roomPassword,
            ownerName,
            ownerPassword,
          ) => {
            try {
              const result = await createAccountBookSharedRoomWithOwner(
                roomName,
                roomPassword,
                ownerName,
                ownerPassword,
              );
              setStore(result.store);
              setActiveUserId(result.userId);
              setStoredActiveUserId(result.userId);
              router.push(`/account-book?workspaceId=${result.workspaceId}`);
              window.alert(
                `서버방이 만들어졌어요. 참여 코드는 ${result.inviteCode} 입니다.`,
              );
            } catch (error) {
              console.error("서버방 생성 실패:", error);
              alert("서버방을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
              throw error;
            }
          }}
          onCreatePersonalWorkspace={async (userName, userPassword) => {
            try {
              const existingUser = findPersonalUserByName(store, userName);
              if (existingUser) {
                if (existingUser.password !== userPassword) {
                  alert(
                    "이미 같은 닉네임의 개인 가계부가 있어요. 개인방 로그인으로 들어가거나 비밀번호를 다시 확인해주세요.",
                  );
                  return;
                }

                const existingWorkspace = store.workspaces.find(
                  (workspace) => workspace.id === existingUser.personalWorkspaceId,
                );

                if (!existingWorkspace) {
                  alert("기존 개인 가계부 작업공간을 찾지 못했어요.");
                  return;
                }

                setActiveUserId(existingUser.id);
                setStoredActiveUserId(existingUser.id);
                router.push(`/account-book?workspaceId=${existingWorkspace.id}`);
                alert("이미 만든 개인 가계부가 있어 기존 작업공간으로 다시 연결했어요.");
                return;
              }

              const result = await createAccountBookUser(userName, userPassword);
              setStore(result.store);
              setActiveUserId(result.userId);
              setStoredActiveUserId(result.userId);
              router.push(`/account-book?workspaceId=${result.workspaceId}`);
            } catch (error) {
              console.error("개인 작업공간 생성 실패:", error);
              alert("개인 작업공간을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
              throw error;
            }
          }}
          onCreateSharedWorkspaceForActiveUser={async (roomName, roomPassword) => {
            if (!activeUser) return;
            await commitStoreChange(
              () =>
                createAccountBookSharedWorkspace(roomName, roomPassword, [
                  activeUser.id,
                ]),
              "공용방을 만들지 못했어요. 잠시 후 다시 시도해주세요.",
            );
          }}
          onJoinServerRoom={async (inviteCode, userName, userPassword) => {
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
                if (existingMember.password !== userPassword) {
                  alert("이미 등록된 참가자 이름입니다. 비밀번호를 다시 확인해주세요.");
                  return;
                }
                setActiveUserId(existingMember.id);
                setStoredActiveUserId(existingMember.id);
                router.push("/account-book");
                return;
              }

              const result = await joinAccountBookSharedRoom(
                inviteCode,
                userName,
                userPassword,
              );
              setStore(result.store);
              setActiveUserId(result.userId);
              setStoredActiveUserId(result.userId);
              router.push("/account-book");
            } catch (error) {
              console.error("서버방 참여 실패:", error);
              alert("참여 코드 확인 후 다시 시도해주세요.");
              throw error;
            }
          }}
          onLoginPersonalWorkspace={async (userName, userPassword) => {
            const targetUser = findPersonalUserByName(store, userName);
            if (!targetUser) {
              alert("일치하는 개인 가계부 사용자를 찾지 못했어요.");
              return;
            }

            if (targetUser.password !== userPassword) {
              alert("개인 비밀번호가 맞지 않아요.");
              return;
            }

            const targetWorkspace = store.workspaces.find(
              (workspace) => workspace.id === targetUser.personalWorkspaceId,
            );

            if (!targetWorkspace) {
              alert("개인 가계부 작업공간을 찾지 못했어요.");
              return;
            }

            setActiveUserId(targetUser.id);
            setStoredActiveUserId(targetUser.id);
            router.push(`/account-book?workspaceId=${targetWorkspace.id}`);
          }}
          onResetActiveUser={() => {
            setActiveUserId(null);
            setStoredActiveUserId(null);
            router.push("/account-book");
          }}
          onOpenManage={() => {
            if (!activeUser) {
              window.alert("먼저 서버방에 참여한 뒤 설정을 열어주세요.");
              return;
            }
            setIsSettingsOpen(true);
          }}
        />
      )}

      {isSettingsOpen && activeUser ? (
        <AccountBookLockGate
          password={activeUser.password}
          accessKey={SETTINGS_ACCESS_KEY}
          title="서버방 설정 비밀번호"
          description={`${activeUser.name} 계정 비밀번호를 입력하면 참여 중인 서버방 참가자 설정을 열 수 있습니다.`}
          backToHome={false}
          onBack={closeSettings}
          overlay
        >
          <WorkspaceSettingsModal
            isOpen={isSettingsOpen}
            activeUser={activeUser}
            users={store.users}
            sharedWorkspaces={manageableSharedWorkspaces}
            onClose={closeSettings}
            onCreateSharedWorkspace={async (name, password) => {
              await commitStoreChange(
                () =>
                  createAccountBookSharedWorkspace(name, password, [
                    activeUser.id,
                  ]),
                "공용방을 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
              );
            }}
            onUpdateUser={async (userId, name, password) => {
              const currentUser = store.users.find((user) => user.id === userId);
              if (!currentUser) return;
              const currentPersonalWorkspace = store.workspaces.find(
                (workspace) => workspace.id === currentUser.personalWorkspaceId,
              );
              await commitStoreChange(
                () =>
                  updateAccountBookUser(
                    currentUser,
                    name,
                    password,
                    currentPersonalWorkspace?.annualSavingGoal,
                  ),
                "사용자 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
              );
            }}
            onUpdateSharedWorkspace={async (workspaceId, name, password) => {
              const currentWorkspace = store.workspaces.find(
                (workspace) => workspace.id === workspaceId,
              );
              if (!currentWorkspace) return;
              await commitStoreChange(
                () =>
                  upsertAccountBookWorkspace({
                    ...currentWorkspace,
                    name,
                    password,
                  }),
                "공용방 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
              );
            }}
            onDeleteSharedWorkspace={async (workspaceId) =>
              commitStoreChange(
                () => deleteAccountBookSharedWorkspace(workspaceId),
                "공용방을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.",
              )
            }
            onAddRoomMember={async (workspaceId, name, password) => {
              if (findRoomMemberByName(store, workspaceId, name)) {
                alert("이미 이 방에 같은 이름의 참가자가 있습니다.");
                return;
              }

              await commitStoreChange(
                () =>
                  addAccountBookSharedRoomMember(workspaceId, name, password),
                "서버방 참가자를 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
              );
            }}
            onRemoveRoomMember={async (workspaceId, userId) =>
              commitStoreChange(
                () => removeAccountBookSharedRoomMember(workspaceId, userId),
                "서버방 참가자를 제외하지 못했어요. 잠시 후 다시 시도해주세요.",
              )
            }
          />
        </AccountBookLockGate>
      ) : null}
    </>
  );
}

export default function AccountBookPage() {
  return (
    <Suspense
      fallback={
        <StLoadingPage>
          <StLoadingCard>가계부 허브를 불러오는 중...</StLoadingCard>
        </StLoadingPage>
      }
    >
      <AccountBookPageContent />
    </Suspense>
  );
}

const StLoadingPage = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #f6f8fc 0%, #edf2f8 100%);
  padding: 1rem;
`;

const StLoadingCard = styled.section`
  width: min(100%, 18rem);
  border-radius: 24px;
  border: 1px solid #d7e2ef;
  background: rgba(255, 255, 255, 0.94);
  color: #4f6077;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 1.2rem 1.3rem;
  text-align: center;
`;
