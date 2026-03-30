"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  createAccountBookSharedWorkspace,
  createAccountBookUser,
  deleteAccountBookEntry,
  deleteAccountBookSharedWorkspace,
  deleteAccountBookUser,
  fetchAccountBookStore,
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
import { AccountBookStore, AccountEntry } from "./types";

const SETTINGS_ACCESS_KEY = "hwang-account-book-settings-access";

function AccountBookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<AccountBookStore | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const nextStore = await fetchAccountBookStore();
        if (!active) return;
        setStore(nextStore);
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

  const commitStoreChange = async (
    action: () => Promise<AccountBookStore>,
    failureMessage = "가계부 저장에 실패했어요. 잠시 후 다시 시도해주세요.",
  ) => {
    try {
      const savedStore = await action();
      setStore(savedStore);
    } catch (error) {
      console.error("가계부 저장 실패:", error);
      alert(failureMessage);
    }
  };

  const selectedWorkspace = useMemo(() => {
    if (!store || !selectedWorkspaceId) return null;
    return getWorkspaceById(store, selectedWorkspaceId);
  }, [selectedWorkspaceId, store]);

  const selectedEntries = useMemo(() => {
    if (!store || !selectedWorkspaceId) return [];
    return resolveWorkspaceEntries(store, selectedWorkspaceId);
  }, [selectedWorkspaceId, store]);

  const settingsManagerUser = store?.users[0] || null;

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
                setStore(previousStore);
                alert("공유 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
              }
            }}
            onSaveEntry={async (entry: AccountEntry) =>
              commitStoreChange(() => upsertAccountBookEntry(entry))
            }
            onDeleteEntry={async (entryId: string) =>
              commitStoreChange(() => deleteAccountBookEntry(entryId))
            }
            onBack={() => router.push("/account-book")}
          />
        </AccountBookLockGate>
      ) : (
        <WorkspaceHub
          users={store.users}
          workspaces={store.workspaces}
          onSelectWorkspace={(workspaceId) =>
            router.push(`/account-book?workspaceId=${workspaceId}`)
          }
          onOpenManage={() => setIsSettingsOpen(true)}
        />
      )}

      {isSettingsOpen ? (
        <AccountBookLockGate
          password={settingsManagerUser?.password || "6155"}
          accessKey={SETTINGS_ACCESS_KEY}
          title="사용자 / 공용방 설정 비밀번호"
          description={`${
            settingsManagerUser?.name || "관리자"
          }만 설정 화면에 접근할 수 있습니다.`}
          backToHome={false}
          onBack={closeSettings}
          overlay
        >
          <WorkspaceSettingsModal
            key={`${store.users.length}-${store.workspaces.length}`}
            isOpen={isSettingsOpen}
            users={store.users}
            sharedWorkspaces={store.workspaces.filter(
              (workspace) => workspace.type === "shared",
            )}
            onClose={closeSettings}
            onUpdateUser={async (userId, name, password) => {
              const currentUser = store.users.find((user) => user.id === userId);
              if (!currentUser) return;
              await commitStoreChange(
                () => updateAccountBookUser(currentUser, name, password),
                "사용자 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
              );
            }}
            onDeleteUser={async (userId) =>
              commitStoreChange(
                () => deleteAccountBookUser(userId),
                "사용자를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.",
              )
            }
            onAddUser={async (name, password) =>
              commitStoreChange(
                () => createAccountBookUser(name, password),
                "사용자를 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
              )
            }
            onUpdateSharedWorkspace={async (
              workspaceId,
              name,
              password,
              memberIds,
            ) => {
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
                    memberIds,
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
            onAddSharedWorkspace={async (name, password, memberIds) =>
              commitStoreChange(
                () => createAccountBookSharedWorkspace(name, password, memberIds),
                "공용방을 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
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
  min-width: 18rem;
  border-radius: 24px;
  border: 1px solid #d7e2ef;
  background: rgba(255, 255, 255, 0.94);
  color: #4f6077;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 1.2rem 1.3rem;
  text-align: center;
`;
