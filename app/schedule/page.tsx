"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { StLoadingWrapper } from "@/components/styled/layout.styled";
// import BlogGuideLink from "@/components/common/BlogGuideLink";
import { useScheduleStore } from "@/hooks/useScheduleStore";
import { useSchedulePartActions } from "@/hooks/useSchedulePartActions";
import { fetchPartServices } from "@/services/schedule";
import ScheduleHub from "./components/ScheduleHub";
import ScheduleSessionGate from "./components/ScheduleSessionGate";
import ScheduleWorkspaceView from "./components/ScheduleWorkspaceView";

function SchedulePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPartId = searchParams.get("workspaceId");

  const {
    loading,
    activeUser,
    activeUserId,
    updateActiveUserId,
    personalParts,
    sharedParts,
    selectedPart,
    services,
    setServices,
    reload,
  } = useScheduleStore(selectedPartId);

  const {
    handleCreatePersonal,
    handleLogin,
    handleCreateSharedPart,
    handleJoinPart,
    handleEnterPart,
    handleLogout,
    handleCreateService,
  } = useSchedulePartActions({
    activeUserId,
    updateActiveUserId,
    reload,
    setServices,
  });

  if (loading) {
    return <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>;
  }

  // 파트 미선택 → 허브
  if (!selectedPartId) {
    return (
      <>
        <ScheduleHub
          activeUser={activeUser}
          personalParts={personalParts}
          sharedParts={sharedParts}
          onSelectPart={(partId) =>
            router.push(`/schedule?workspaceId=${partId}`)
          }
          onCreatePersonal={handleCreatePersonal}
          onLogin={handleLogin}
          onCreateSharedPart={handleCreateSharedPart}
          onJoinPart={handleJoinPart}
          onLogout={handleLogout}
        />
        {/* <ScheduleGuideWrap>
          <BlogGuideLink guideId="schedule-guide" />
        </ScheduleGuideWrap> */}
      </>
    );
  }

  // 파트 선택됨 → LockGate → 서비스 리스트
  if (!selectedPart) {
    return <StLoadingWrapper>파트를 찾을 수 없습니다.</StLoadingWrapper>;
  }

  const reloadServices = () => {
    fetchPartServices(selectedPartId).then(setServices).catch(() => {});
  };

  return (
    <ScheduleSessionGate
      workspaceId={selectedPart.id}
      workspaceName={selectedPart.name}
      onEnter={(password) => handleEnterPart(selectedPart.id, password)}
      onBack={() => router.push("/schedule")}
    >
      <ScheduleWorkspaceView
        part={selectedPart}
        services={services}
        onBack={() => router.push("/schedule")}
        onCreateService={handleCreateService}
        onReloadServices={reloadServices}
      />
    </ScheduleSessionGate>
  );
}

export default function ScheduleListPage() {
  return (
    <Suspense fallback={<StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>}>
      <SchedulePageInner />
    </Suspense>
  );
}

const ScheduleGuideWrap = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 1.5rem auto 2rem;
  padding: 0 1rem;
`;
