import { useState, useEffect, useCallback } from "react";
import {
  ScheduleUser,
  SchedulePart,
  ScheduleStore,
  ScheduleServiceData,
} from "@/types/work-schedule";
import {
  fetchScheduleStore,
  fetchPartServices,
} from "@/services/schedule";

const ACTIVE_USER_KEY = "hwang-schedule-active-user";

function getStoredActiveUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_USER_KEY);
}

function setStoredActiveUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem(ACTIVE_USER_KEY, userId);
  } else {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }
}

export function useScheduleStore(selectedPartId: string | null) {
  const [store, setStore] = useState<ScheduleStore | null>(null);
  const [activeUserId, setActiveUserIdState] = useState<string | null>(null);
  const [services, setServices] = useState<ScheduleServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 초기 로딩
  useEffect(() => {
    const stored = getStoredActiveUserId();
    setActiveUserIdState(stored);
  }, []);

  const loadStore = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchScheduleStore(activeUserId);
      setStore(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  // 파트 선택 시 서비스 로딩
  useEffect(() => {
    if (!selectedPartId) {
      setServices([]);
      return;
    }
    fetchPartServices(selectedPartId)
      .then(setServices)
      .catch(() => setServices([]));
  }, [selectedPartId]);

  const updateActiveUserId = useCallback((userId: string | null) => {
    setActiveUserIdState(userId);
    setStoredActiveUserId(userId);
  }, []);

  // 현재 유저
  const activeUser: ScheduleUser | null =
    store?.users.find((u) => u.id === activeUserId) ?? null;

  // 유저가 접근 가능한 파트
  const myParts: SchedulePart[] = activeUserId
    ? (store?.parts.filter((p) =>
        p.memberIds.includes(activeUserId),
      ) ?? [])
    : [];

  const personalParts = myParts.filter((p) => p.type === "personal");
  const sharedParts = myParts.filter((p) => p.type === "shared");

  // 선택된 파트
  const selectedPart: SchedulePart | null =
    store?.parts.find((p) => p.id === selectedPartId) ?? null;

  return {
    store,
    setStore,
    loading,
    error,
    reload: loadStore,

    activeUser,
    activeUserId,
    updateActiveUserId,

    myParts,
    personalParts,
    sharedParts,
    selectedPart,

    services,
    setServices,
  };
}
