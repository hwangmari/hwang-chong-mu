"use client";

import { useCallback, useEffect, useState } from "react";

export type AppUser = { id: string; nickname: string };

// 통합 계정 세션 상태. /api/auth/me로 조회하고, 로그인/로그아웃 후 갱신한다.
// 세션 변경을 여러 컴포넌트가 공유하도록 커스텀 이벤트로 브로드캐스트한다.
const AUTH_CHANGE_EVENT = "hwang-auth-change";

export function broadcastAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: AppUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener(AUTH_CHANGE_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 무시
    }
    setUser(null);
    broadcastAuthChange();
  }, []);

  return { user, loading, refresh, logout };
}
