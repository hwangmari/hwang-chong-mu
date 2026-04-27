import { useCallback } from "react";
import {
  createScheduleUser,
  createSharedPart,
  joinSharedPart,
  createServiceInPart,
  fetchPartServices,
} from "@/services/schedule";
import {
  enterWorkspaceApi,
  joinWorkspaceApi,
  leaveWorkspaceApi,
  loginScheduleUserApi,
} from "@/services/schedule-auth";

interface UseSchedulePartActionsParams {
  activeUserId: string | null;
  updateActiveUserId: (userId: string | null) => void;
  reload: () => Promise<void>;
  setServices: (services: any[]) => void;
}

export function useSchedulePartActions({
  activeUserId,
  updateActiveUserId,
  reload,
  setServices,
}: UseSchedulePartActionsParams) {
  // 개인 계정 생성
  const handleCreatePersonal = useCallback(
    async (name: string, password: string) => {
      const { user } = await createScheduleUser(name, password);
      updateActiveUserId(user.id);
      await reload();
      return user;
    },
    [updateActiveUserId, reload],
  );

  // 로그인 — 서버 라우트 경유로 비번 검증 (평문 → 해시 자동 업그레이드)
  const handleLogin = useCallback(
    async (name: string, password: string) => {
      const { user } = await loginScheduleUserApi(name, password);
      updateActiveUserId(user.id);
      await reload();
      return {
        id: user.id,
        name: user.name,
        password: "",
        personalPartId: user.personalWorkspaceId ?? undefined,
      };
    },
    [updateActiveUserId, reload],
  );

  // 공용 파트 생성 — 생성 직후 서버 세션 쿠키 발급
  const handleCreateSharedPart = useCallback(
    async (
      partName: string,
      partPassword: string,
      ownerName: string,
      ownerPassword: string,
    ) => {
      const { user, part } = await createSharedPart(
        partName,
        partPassword,
        ownerName,
        ownerPassword,
      );
      updateActiveUserId(user.id);
      try {
        await enterWorkspaceApi(user.id, part.id, partPassword);
      } catch (err) {
        console.warn("공용 파트 세션 발급 실패", err);
      }
      await reload();
      return { user, part };
    },
    [updateActiveUserId, reload],
  );

  // 파트 참여 — 초대코드로 DB 상 멤버 추가 후 서버 세션 발급
  const handleJoinPart = useCallback(
    async (inviteCode: string, userName: string, userPassword: string) => {
      const { user, part } = await joinSharedPart(
        inviteCode,
        userName,
        userPassword,
      );
      updateActiveUserId(user.id);
      try {
        await joinWorkspaceApi(user.id, inviteCode);
      } catch (err) {
        console.warn("파트 세션 발급 실패", err);
      }
      await reload();
      return { user, part };
    },
    [updateActiveUserId, reload],
  );

  // 기존 워크스페이스 입장: 세션 쿠키 발급 (Gate 컴포넌트에서 사용)
  const handleEnterPart = useCallback(
    async (partId: string, password: string) => {
      if (!activeUserId) {
        throw new Error("로그인된 사용자가 없습니다.");
      }
      await enterWorkspaceApi(activeUserId, partId, password);
    },
    [activeUserId],
  );

  // 로그아웃 — 서버 세션도 함께 종료
  const handleLogout = useCallback(async () => {
    try {
      await leaveWorkspaceApi();
    } catch {
      // 세션이 이미 없어도 무시
    }
    updateActiveUserId(null);
  }, [updateActiveUserId]);

  // 서비스 생성 (파트 내)
  const handleCreateService = useCallback(
    async (partId: string, title: string, description: string) => {
      const svc = await createServiceInPart(partId, title, description);
      const services = await fetchPartServices(partId);
      setServices(services);
      return svc;
    },
    [setServices],
  );

  return {
    handleCreatePersonal,
    handleLogin,
    handleCreateSharedPart,
    handleJoinPart,
    handleEnterPart,
    handleLogout,
    handleCreateService,
  };
}
