import { useCallback } from "react";
import {
  createScheduleUser,
  loginScheduleUser,
  createSharedPart,
  joinSharedPart,
  createServiceInPart,
  fetchPartServices,
} from "@/services/schedule";

interface UseSchedulePartActionsParams {
  updateActiveUserId: (userId: string | null) => void;
  reload: () => Promise<void>;
  setServices: (services: any[]) => void;
}

export function useSchedulePartActions({
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

  // 로그인
  const handleLogin = useCallback(
    async (name: string, password: string) => {
      const user = await loginScheduleUser(name, password);
      updateActiveUserId(user.id);
      await reload();
      return user;
    },
    [updateActiveUserId, reload],
  );

  // 공용 파트 생성
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
      await reload();
      return { user, part };
    },
    [updateActiveUserId, reload],
  );

  // 파트 참여
  const handleJoinPart = useCallback(
    async (inviteCode: string, userName: string, userPassword: string) => {
      const { user, part } = await joinSharedPart(
        inviteCode,
        userName,
        userPassword,
      );
      updateActiveUserId(user.id);
      await reload();
      return { user, part };
    },
    [updateActiveUserId, reload],
  );

  // 로그아웃
  const handleLogout = useCallback(() => {
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
    handleLogout,
    handleCreateService,
  };
}
