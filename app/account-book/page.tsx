"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { useModal } from "@/components/common/ModalProvider";
import AccountBookLockGate from "./components/AccountBookLockGate";
import FooterGuide from "@/components/common/FooterGuide";
import { ACCOUNT_BOOK_GUIDE_DATA } from "@/data/footerGuides";
import WorkspaceHub from "./components/WorkspaceHub";
import WorkspaceLedgerView from "./components/WorkspaceLedgerView";
import WorkspaceSettingsModal from "./components/WorkspaceSettingsModal";
import { StAbLoadingPage, StAbLoadingCard } from "./components/shared";
import { SkeletonBlock } from "@/components/common/Skeleton";
import {
  verifyAccountBookUserPassword,
  verifyAccountBookWorkspacePassword,
} from "./repository";
import { useAccountBookStore } from "./hooks/useAccountBookStore";
import { useAccountBookActions } from "./hooks/useAccountBookActions";
import { ViewMode } from "./types";

const SETTINGS_ACCESS_KEY = "hwang-account-book-settings-access";
// 마지막으로 연 가계부방 — 홈 바로가기(PWA)로 앱을 열면 이 방으로 자동 이동한다.
const LAST_WORKSPACE_KEY = "hwang-account-book-last-workspace";
// 세션당 한 번만 자동 이동(허브로 되돌아왔을 때 다시 튕기지 않도록)
const ENTRY_REDIRECT_FLAG = "hwang-account-book-entry-redirected";

function resolveInitialViewMode(value: string | null): ViewMode {
  if (value === "board" || value === "calendar" || value === "ledger") {
    return value;
  }
  return "calendar";
}

function AccountBookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAlert } = useModal();
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
    reloadStore: storeHelpers.reloadStore,
    commitStoreChange: storeHelpers.commitStoreChange,
  });

  // 워크스페이스를 열면 "마지막 방"으로 기억
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      selectedWorkspaceId &&
      store?.workspaces.some((workspace) => workspace.id === selectedWorkspaceId)
    ) {
      window.localStorage.setItem(LAST_WORKSPACE_KEY, selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, store]);

  // 앱 진입(세션 첫 로드) 시 워크스페이스 미지정이면 마지막 방으로 자동 이동
  // — 모바일 홈 바로가기(PWA)에서 열면 허브가 아니라 바로 그 가계부로 들어간다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!storageReady || !store) return;
    if (selectedWorkspaceId) return;
    if (window.sessionStorage.getItem(ENTRY_REDIRECT_FLAG)) return;
    window.sessionStorage.setItem(ENTRY_REDIRECT_FLAG, "1");
    const last = window.localStorage.getItem(LAST_WORKSPACE_KEY);
    if (last && store.workspaces.some((workspace) => workspace.id === last)) {
      router.replace(`/account-book?workspaceId=${last}`);
    }
  }, [storageReady, store, selectedWorkspaceId, router]);

  const closeSettings = () => {
    setIsSettingsOpen(false);
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SETTINGS_ACCESS_KEY);
    window.dispatchEvent(new Event("account-book-access-change"));
  };

  // 허브(방 목록) 아래에 붙는 사용 안내. 불러오는 중에도 같이 보여 준다
  const hubGuide = (
    <StHubGuideWrap>
      <FooterGuide
        title={ACCOUNT_BOOK_GUIDE_DATA.title}
        story={ACCOUNT_BOOK_GUIDE_DATA.story}
        tips={ACCOUNT_BOOK_GUIDE_DATA.tips}
      />
    </StHubGuideWrap>
  );

  if (!storageReady) {
    return (
      <>
        <HubSkeleton />
        {!selectedWorkspaceId ? hubGuide : null}
      </>
    );
  }

  if (loadError || !store) {
    return (
      <>
        <StAbLoadingPage>
          <StAbLoadingCard>
            {loadError || "가계부 데이터를 불러오지 못했습니다."}
          </StAbLoadingCard>
        </StAbLoadingPage>
        {!selectedWorkspaceId ? hubGuide : null}
      </>
    );
  }

  return (
    <>
      {selectedWorkspace ? (
        <AccountBookLockGate
          onVerify={(input) =>
            verifyAccountBookWorkspacePassword(selectedWorkspace.id, input)
          }
          accessKey={`hwang-account-book-access-${selectedWorkspace.id}`}
          title={`${selectedWorkspace.name} 비밀번호`}
          description="선택한 가계부방 비밀번호를 입력하면 이 방으로 들어갑니다."
          backToHome={false}
          onBack={() =>
            router.push(
              searchParams.get("from") === "my" ? "/my" : "/account-book",
            )
          }
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
            onChangeMonthlyBudget={actions.handleChangeMonthlyBudget}
            onBack={() =>
              router.push(
                searchParams.get("from") === "my" ? "/my" : "/account-book",
              )
            }
            initialViewMode={initialViewMode}
          />
        </AccountBookLockGate>
      ) : (
        <>
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
                void openAlert("먼저 서버방에 참여한 뒤 설정을 열어주세요.");
                return;
              }
              setIsSettingsOpen(true);
            }}
          />
          {hubGuide}
        </>
      )}

      {isSettingsOpen && activeUser ? (
        <AccountBookLockGate
          onVerify={(input) =>
            verifyAccountBookUserPassword(activeUser.id, input)
          }
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
    <Suspense fallback={<HubSkeleton />}>
      <AccountBookPageContent />
    </Suspense>
  );
}

// 허브가 뜨기 전 빈 화면 대신, 실제 허브와 같은 폭·카드 크기로 자리를 잡아 둔다
function HubSkeleton() {
  return (
    <StHubSkeletonPage aria-busy="true">
      <StHubSkeletonInner>
        <StHubSkeletonHead>
          <SkeletonBlock width="min(100%, 14rem)" height="1.6rem" radius="0.7rem" />
          <SkeletonBlock width="min(100%, 20rem)" height="0.85rem" />
        </StHubSkeletonHead>
        <SkeletonBlock height="7.5rem" radius="22px" />
        <StHubSkeletonGrid>
          <SkeletonBlock width="8rem" height="0.9rem" radius="0.5rem" />
          <SkeletonBlock height="6.5rem" radius="22px" />
          <SkeletonBlock height="6.5rem" radius="22px" />
        </StHubSkeletonGrid>
      </StHubSkeletonInner>
    </StHubSkeletonPage>
  );
}

const StHubSkeletonPage = styled.div`
  min-height: 100vh;
  padding: 1.25rem 1.25rem 2rem;
  background: #ffffff;

  @media (max-width: 720px) {
    padding: 0.9rem 0.85rem 1.4rem;
  }
`;

const StHubSkeletonInner = styled.div`
  width: 100%;
  max-width: 1025px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`;

const StHubSkeletonHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StHubSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
`;

const StHubGuideWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 1.5rem auto 2rem;
  padding: 0 1rem;
`;
