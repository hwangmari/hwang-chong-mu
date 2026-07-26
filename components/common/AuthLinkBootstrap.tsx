"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

type LinkRow = {
  service: string;
  resourceRef: Record<string, unknown>;
  label: string;
};

// 로그인 상태가 되면 연결된 서비스의 진입 정보를 각 서비스의 기존 localStorage 키에
// 미리 채워, 각 서비스 페이지가 코드 변경 없이 자동 진입되게 한다.
// 이미 값이 있으면(수동 진입 중) 덮어쓰지 않는다.
function applyLinks(links: LinkRow[]) {
  for (const link of links) {
    try {
      if (link.service === "workout") {
        const ref = link.resourceRef as {
          roomId?: string;
          roomName?: string;
          password?: string;
        };
        if (ref.roomId && !localStorage.getItem("hwang-workout-session")) {
          localStorage.setItem(
            "hwang-workout-session",
            JSON.stringify({
              roomId: ref.roomId,
              roomName: ref.roomName ?? "",
              password: ref.password ?? "",
            }),
          );
        }
      } else if (link.service === "account-book") {
        const ref = link.resourceRef as {
          activeUserId?: string;
          workspaceId?: string;
        };
        if (ref.activeUserId) {
          if (!localStorage.getItem("hwang-account-book-active-user")) {
            localStorage.setItem(
              "hwang-account-book-active-user",
              ref.activeUserId,
            );
          }
        }
        if (ref.workspaceId) {
          if (!localStorage.getItem("hwang-account-book-last-workspace")) {
            localStorage.setItem(
              "hwang-account-book-last-workspace",
              ref.workspaceId,
            );
          }
          // 로그인이 곧 인증이므로 PIN 게이트를 자동 해제
          const accessKey = `hwang-account-book-access-${ref.workspaceId}`;
          if (!localStorage.getItem(accessKey)) {
            localStorage.setItem(accessKey, "true");
          }
        }
      }
      // habit/diet는 로컬 신원이 없어 pre-fill 대상 아님(대시보드에서 직접 링크로 활용).
    } catch {
      // 무시
    }
  }
  // 가계부 잠금 상태 구독자에게 변경 알림
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("account-book-access-change"));
  }
}

export default function AuthLinkBootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/auth/links", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { links?: LinkRow[] };
        if (!active) return;
        applyLinks(data.links ?? []);
      } catch {
        // 무시
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return null;
}
