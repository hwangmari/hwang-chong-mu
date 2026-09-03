// 통합 계정의 "내 방"에 등록할 수 있는 서비스 정의.
// /my(홈 대시보드)와 /account(연결 관리)가 같은 아이콘·이름·링크를 쓰도록 한곳에 모았다.
// 아이콘·이름은 가능한 한 lib/menuCategories.ts(메뉴 목록)의 값을 그대로 재사용한다.
import { findMenuItem } from "./menuCategories";

// hwang_user_rooms.service 에 저장되는 값. SQL(supabase/20260903_extend_hwang_rooms_services.sql)과
// API(app/api/auth/rooms/route.ts)의 허용 목록과 항상 같아야 한다.
export const ROOM_SERVICES = [
  "meeting",
  "calc",
  "place",
  "tennis",
  "game",
  "overtime",
  "daily",
] as const;

export type RoomService = (typeof ROOM_SERVICES)[number];

// 홈 대시보드 위젯과 같은 아이콘 톤 팔레트
export type RoomServiceTone =
  | "blue"
  | "amber"
  | "green"
  | "teal"
  | "indigo"
  | "rose";

type RoomServiceDef = {
  // 메뉴 목록에서 아이콘·이름을 가져올 때 쓰는 경로
  menuHref: string;
  tone: RoomServiceTone;
  // 등록된 방을 여는 주소. 야근 계산기처럼 주소에 방 id가 없는 서비스도 있다.
  href: (roomId: string) => string;
  // 아직 등록된 방이 없을 때 /account에 보여줄 안내
  emptyHint: string;
  // 메뉴 목록과 다른 이름을 쓰고 싶을 때만 지정(기존 화면 문구 유지)
  icon?: string;
  name?: string;
};

const DEFS: Record<RoomService, RoomServiceDef> = {
  meeting: {
    menuHref: "/meeting",
    tone: "indigo",
    icon: "📅",
    name: "약속잡기",
    href: (roomId) => `/meeting/room/${roomId}`,
    emptyHint: "약속 방을 만들면 자동으로 등록돼요.",
  },
  calc: {
    menuHref: "/calc",
    tone: "rose",
    icon: "🧮",
    name: "정산방",
    href: (roomId) => `/calc/${roomId}`,
    emptyHint: "정산 방을 만들면 자동으로 등록돼요.",
  },
  place: {
    menuHref: "/place",
    tone: "teal",
    href: (roomId) => `/place/${roomId}`,
    emptyHint: "장소 투표를 만들면 자동으로 등록돼요.",
  },
  tennis: {
    menuHref: "/tennis",
    tone: "green",
    href: (roomId) => `/tennis/${roomId}`,
    emptyHint: "교류전을 만들면 자동으로 등록돼요.",
  },
  game: {
    menuHref: "/game",
    tone: "amber",
    href: (roomId) => `/game/${roomId}`,
    emptyHint: "게임방을 만들거나 들어가면 자동으로 등록돼요.",
  },
  overtime: {
    menuHref: "/overtime",
    tone: "blue",
    // 야근 계산기는 주소에 방이 없고, 로그인하면 저장된 방으로 자동 연결된다.
    href: () => "/overtime",
    emptyHint: "야근 계산기에서 서버 저장 방을 만들거나 연결하면 등록돼요.",
  },
  daily: {
    menuHref: "/daily",
    tone: "green",
    href: (roomId) => `/daily/${roomId}`,
    emptyHint: "기록장을 만들거나 열면 자동으로 등록돼요.",
  },
};

export type RoomServiceMeta = {
  icon: string;
  name: string;
  tone: RoomServiceTone;
  href: (roomId: string) => string;
  emptyHint: string;
};

export const ROOM_SERVICE_META: Record<RoomService, RoomServiceMeta> =
  ROOM_SERVICES.reduce(
    (acc, service) => {
      const def = DEFS[service];
      const menu = findMenuItem(def.menuHref);
      acc[service] = {
        icon: def.icon ?? menu?.icon ?? "📌",
        name: def.name ?? menu?.title ?? service,
        tone: def.tone,
        href: def.href,
        emptyHint: def.emptyHint,
      };
      return acc;
    },
    {} as Record<RoomService, RoomServiceMeta>,
  );

export function isRoomService(value: unknown): value is RoomService {
  return (
    typeof value === "string" &&
    (ROOM_SERVICES as readonly string[]).includes(value)
  );
}

// 방의 비밀번호·접근 코드는 계정에 저장하지 않는다는 안내 (내 방 목록 화면 공통 문구)
export const ROOM_SECRET_NOTICE =
  "방 비밀번호·접근 코드는 계정에 저장하지 않아요. 들어갈 때 다시 물어봐요.";

// 계정에 등록할 방 이름은 너무 길면 잘라서 저장한다.
export const ROOM_LABEL_MAX = 40;

export function toRoomLabel(raw: string | null | undefined) {
  const trimmed = (raw ?? "").trim();
  return trimmed.length > ROOM_LABEL_MAX
    ? trimmed.slice(0, ROOM_LABEL_MAX)
    : trimmed;
}

// 로그인 사용자면 내 계정에 자동 등록(비로그인은 서버가 401 → 무시)
export function linkRoomToAccount(
  service: RoomService,
  roomId: string,
  label: string,
) {
  if (!roomId) return;
  void fetch("/api/auth/rooms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ service, roomId, label: toRoomLabel(label) }),
  }).catch(() => {});
}
