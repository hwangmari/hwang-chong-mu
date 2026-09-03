"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  StContainer,
  StLoadingWrapper,
  StWrapper,
} from "@/components/styled/layout.styled";
import styled from "styled-components";
import FooterGuide from "@/components/common/FooterGuide";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { SCHEDULE_GUIDE_DATA } from "@/data/footerGuides";
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

  // 허브(파트 목록) 아래에 붙는 사용 안내. 불러오는 중에도 같이 보여 준다
  const hubGuide = (
    <StContainer>
      <StWrapper>
        <FooterGuide
          title={SCHEDULE_GUIDE_DATA.title}
          story={SCHEDULE_GUIDE_DATA.story}
          tips={SCHEDULE_GUIDE_DATA.tips}
        />
      </StWrapper>
    </StContainer>
  );

  if (loading) {
    return (
      <>
        <ScheduleHubSkeleton />
        {!selectedPartId ? hubGuide : null}
      </>
    );
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
        {hubGuide}
      </>
    );
  }

  // 파트 선택됨 → LockGate → 서비스 리스트
  if (!selectedPart) {
    return <StLoadingWrapper>파트를 찾을 수 없습니다.</StLoadingWrapper>;
  }

  const reloadServices = () => {
    fetchPartServices(selectedPartId)
      .then(setServices)
      .catch((e) => console.error("서비스 목록 로딩 실패:", e));
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
    <Suspense fallback={<ScheduleHubSkeleton />}>
      <SchedulePageInner />
    </Suspense>
  );
}

// 허브(파트 목록)와 같은 폭·카드 크기로 자리를 잡아, 목록이 도착해도 화면이 밀리지 않게 한다
function ScheduleHubSkeleton() {
  return (
    <StSkeletonContainer aria-busy="true">
      <StSkeletonHead>
        <SkeletonBlock width="min(100%, 12rem)" height="1.5rem" radius="0.7rem" />
        <SkeletonBlock width="5rem" height="2rem" radius="999px" />
      </StSkeletonHead>
      <SkeletonBlock width="7rem" height="1rem" radius="0.5rem" />
      <StSkeletonGrid>
        <SkeletonBlock height="5.6rem" radius="1rem" />
        <SkeletonBlock height="5.6rem" radius="1rem" />
      </StSkeletonGrid>
      <SkeletonBlock width="7rem" height="1rem" radius="0.5rem" />
      <StSkeletonGrid>
        <SkeletonBlock height="5.6rem" radius="1rem" />
        <SkeletonBlock height="5.6rem" radius="1rem" />
      </StSkeletonGrid>
    </StSkeletonContainer>
  );
}

const StSkeletonContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StSkeletonHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const StSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;
