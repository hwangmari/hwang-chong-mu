"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountBookLockGate from "./components/AccountBookLockGate";
import WorkspaceHub from "./components/WorkspaceHub";
import WorkspaceLedgerView from "./components/WorkspaceLedgerView";
import WorkspaceSettingsModal from "./components/WorkspaceSettingsModal";
import { StAbLoadingPage, StAbLoadingCard } from "./components/shared";
import { useAccountBookStore } from "./hooks/useAccountBookStore";
import { useAccountBookActions } from "./hooks/useAccountBookActions";
import { ViewMode } from "./types";

const SETTINGS_ACCESS_KEY = "hwang-account-book-settings-access";

function resolveInitialViewMode(value: string | null): ViewMode {
  if (value === "board" || value === "calendar" || value === "ledger") {
    return value;
  }
  return "calendar";
}

function AccountBookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const selectedWorkspaceId = searchParams.get("workspaceId");
  const initialViewMode = resolveInitialViewMode(searchParams.get("view"));

  const storeHelpers = useAccountBookStore(selectedWorkspaceId);
  const {
    store,
    storageReady,
    loadError,
    activeUser,
    effectiveActiveUserId,
    selectedWorkspace,
    selectedEntries,
    selectedWorkspaceMonthlyMemos,
    manageableSharedWorkspaces,
    updateActiveUserId,
  } = storeHelpers;

  const actions = useAccountBookActions({
    store: store!,
    setStore: storeHelpers.setStore,
    activeUserId: storeHelpers.activeUserId,
    effectiveActiveUserId,
    activeUser,
    selectedWorkspace,
    updateActiveUserId,
    commitStoreChange: storeHelpers.commitStoreChange,
  });

  const closeSettings = () => {
    setIsSettingsOpen(false);
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SETTINGS_ACCESS_KEY);
    window.dispatchEvent(new Event("account-book-access-change"));
  };

  if (!storageReady) {
    return (
      <StAbLoadingPage>
        <StAbLoadingCard>가계부 허브를 불러오는 중...</StAbLoadingCard>
      </StAbLoadingPage>
    );
  }

  if (loadError || !store) {
    return (
      <StAbLoadingPage>
        <StAbLoadingCard>
          {loadError || "가계부 데이터를 불러오지 못했습니다."}
        </StAbLoadingCard>
      </StAbLoadingPage>
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
            shareTargets={actions.getShareTargets()}
            isEntryShared={actions.checkIsEntryShared}
            monthlyMemos={selectedWorkspaceMonthlyMemos}
            onToggleShare={actions.handleToggleShare}
            onSaveEntry={actions.handleSaveEntry}
            onSaveMonthlyMemo={actions.handleSaveMonthlyMemo}
            onDeleteEntry={actions.handleDeleteEntry}
            onChangeAnnualSavingGoal={actions.handleChangeAnnualSavingGoal}
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
          onCreateServerRoom={actions.handleCreateServerRoom}
          onCreatePersonalWorkspace={actions.handleCreatePersonalWorkspace}
          onCreateSharedWorkspaceForActiveUser={
            actions.handleCreateSharedWorkspaceForActiveUser
          }
          onJoinServerRoom={actions.handleJoinServerRoom}
          onLoginPersonalWorkspace={actions.handleLoginPersonalWorkspace}
          onResetActiveUser={actions.handleResetActiveUser}
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
          storageType="session"
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
            onCreateSharedWorkspace={actions.handleCreateSharedWorkspace}
            onUpdateUser={actions.handleUpdateUser}
            onUpdateSharedWorkspace={actions.handleUpdateSharedWorkspace}
            onDeleteSharedWorkspace={actions.handleDeleteSharedWorkspace}
            onAddRoomMember={actions.handleAddRoomMember}
            onRemoveRoomMember={actions.handleRemoveRoomMember}
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
        <StAbLoadingPage>
          <StAbLoadingCard>가계부 허브를 불러오는 중...</StAbLoadingCard>
        </StAbLoadingPage>
      }
    >
      <AccountBookPageContent />
    </Suspense>
  );
}
