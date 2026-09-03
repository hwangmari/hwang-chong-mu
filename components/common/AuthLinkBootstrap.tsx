"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { mergeMyEvents, type MyEvent } from "@/app/tennis/myEvents";
import {
  STORAGE_MODE_KEY,
  STORAGE_ROOM_KEY,
} from "@/app/overtime/constants";
import { fetchTennisEvent } from "@/services/tennis";

type LinkRow = {
  service: string;
  resourceRef: Record<string, unknown>;
  label: string;
};

// 계정에 등록된 "내 방" 한 줄 (app/api/auth/rooms 응답 형태)
type RoomRow = {
  id: string;
  service: string;
  roomId: string;
  label: string;
  createdAt: string;
};

// 로그인 상태가 되면 연결된 서비스의 진입 정보를 각 서비스의 기존 localStorage 키에
// 미리 채워, 각 서비스 페이지가 코드 변경 없이 자동 진입되게 한다.
// 이미 값이 있으면(수동 진입 중) 덮어쓰지 않는다.
function applyLinks(links: LinkRow[]) {
  for (const link of links) {
    try {
      if (link.service === "workout") {
        // 운동방 비밀번호는 계정에 저장하지 않는다. roomId 만 있으면 자동 진입된다.
        const ref = link.resourceRef as {
          roomId?: string;
          roomName?: string;
        };
        if (ref.roomId && !localStorage.getItem("hwang-workout-session")) {
          localStorage.setItem(
            "hwang-workout-session",
            JSON.stringify({
              roomId: ref.roomId,
              roomName: ref.roomName ?? "",
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

// 계정에 등록된 방 중, 로컬 진입 정보가 필요한 서비스만 미리 채운다.
// 비밀번호·접근 코드가 필요한 서비스(장소·게임·일일기록)는 어차피 다시 물어봐야 하므로 건드리지 않는다.
async function applyRooms(rooms: RoomRow[]) {
  // 테니스: 이 브라우저 목록에 없는 교류전만 채워 넣는다(제목·날짜는 서버에서 확인)
  const tennisRooms = rooms.filter((room) => room.service === "tennis");
  if (tennisRooms.length > 0) {
    const items = await Promise.all(
      tennisRooms.map(async (room): Promise<MyEvent> => {
        try {
          const event = await fetchTennisEvent(room.roomId);
          if (event) {
            return { id: room.roomId, title: event.title, date: event.date };
          }
        } catch {
          // 서버 조회 실패 시 계정에 저장된 이름만 사용
        }
        return { id: room.roomId, title: room.label || "교류전", date: "" };
      }),
    );
    mergeMyEvents(items);
  }

  // 야근 계산기: 이 기기에 연결된 방이 아직 없을 때만 계정의 방 코드를 채운다
  const overtimeRoom = rooms.find((room) => room.service === "overtime");
  if (overtimeRoom?.roomId) {
    try {
      if (!localStorage.getItem(STORAGE_ROOM_KEY)) {
        localStorage.setItem(STORAGE_ROOM_KEY, overtimeRoom.roomId);
        localStorage.setItem(STORAGE_MODE_KEY, "server");
      }
    } catch {
      // 무시
    }
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
    void (async () => {
      try {
        const res = await fetch("/api/auth/rooms", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { rooms?: RoomRow[] };
        if (!active) return;
        await applyRooms(data.rooms ?? []);
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
