// 황총무 오피스 배치도 — 사무실 칸(그림 1칸) 단위.
// 서비스 이름·아이콘·설명은 lib/services.ts(단일 출처)에서 가져오고, 여기서는 "어디에 무엇으로 놓을지"만 적는다.
import { byId, type ServiceCategoryId, type ServiceId } from "@/lib/services";
import { findMenuItem } from "@/lib/menuCategories";

export const MAP_W = 320;
export const MAP_H = 224;
/** 위쪽 벽(창문) 아래 끝 — 발이 이보다 위로는 못 간다 */
export const WALL_Y = 30;
/** 위 줄 구역(돈·일·함께)과 아래 줄(몸과 습관)을 나누는 낮은 칸막이 */
export const ROW_Y = 116;
/** 유리 회의실 왼쪽 벽 x */
export const GLASS_X = 200;

export type Rect = { x: number; y: number; w: number; h: number };
export type ZoneId = ServiceCategoryId | "extra";

export type Station = {
  key: string;
  href: string;
  icon: string;
  name: string;
  desc: string;
  zone: ZoneId;
  /** 가구가 차지하는 곳 (그림·누르는 곳) */
  rect: Rect;
  /** 벽에 걸린 것이라 바닥을 막지 않는다 */
  onWall?: boolean;
  /** 이 앞에 서면 "가까이 있음" — 발 위치 */
  spot: { x: number; y: number };
};

export const ZONES: { id: ZoneId; title: string; emoji: string; x: number; y: number }[] = [
  { id: "money", title: "돈 관리", emoji: "💰", x: 6, y: 33 },
  { id: "work", title: "일과 시간", emoji: "💼", x: 98, y: 33 },
  { id: "together", title: "친구들과 함께", emoji: "🤝", x: 206, y: 33 },
  { id: "daily", title: "몸과 습관", emoji: "🌱", x: 6, y: 121 },
];

type Placement = { rect: Rect; onWall?: boolean; spot?: { x: number; y: number } };

// 바닥 가구는 아래쪽 가운데에서, 벽에 건 것은 벽 바로 아래에서 쓴다
function spotOf(p: Placement) {
  if (p.spot) return p.spot;
  const cx = Math.round(p.rect.x + p.rect.w / 2);
  return p.onWall ? { x: cx, y: WALL_Y + 6 } : { x: cx, y: p.rect.y + p.rect.h + 7 };
}

const SERVICE_PLACES: Record<ServiceId, Placement> = {
  // 돈 관리 — 장부 책상 · 선물 선반
  "account-book": { rect: { x: 10, y: 52, w: 32, h: 20 } },
  "gift-log": { rect: { x: 56, y: 44, w: 28, h: 28 } },
  // 일과 시간 — 벽 칸반 달력 · 황총무 책상(야근 스탠드)
  schedule: { rect: { x: 100, y: 4, w: 44, h: 20 }, onWall: true },
  overtime: { rect: { x: 146, y: 54, w: 40, h: 20 } },
  // 친구들과 함께 — 유리 회의실
  meeting: { rect: { x: 206, y: 4, w: 24, h: 20 }, onWall: true },
  place: { rect: { x: 236, y: 4, w: 34, h: 20 }, onWall: true },
  travel: { rect: { x: 208, y: 92, w: 18, h: 16 }, spot: { x: 217, y: 86 } },
  calc: { rect: { x: 236, y: 58, w: 48, h: 22 } },
  game: { rect: { x: 298, y: 40, w: 16, h: 26 }, spot: { x: 290, y: 60 } },
  tennis: { rect: { x: 296, y: 86, w: 18, h: 22 }, spot: { x: 288, y: 100 } },
  // 몸과 습관 — 탕비실(습관·일기·식단) + 헬스장(인바디·근육·운동·레슨)
  habit: { rect: { x: 10, y: 136, w: 28, h: 22 } },
  daily: { rect: { x: 52, y: 140, w: 32, h: 18 } },
  diet: { rect: { x: 100, y: 128, w: 18, h: 30 } },
  inbody: { rect: { x: 134, y: 136, w: 16, h: 24 } },
  muscle: { rect: { x: 164, y: 132, w: 22, h: 28 } },
  workout: { rect: { x: 206, y: 140, w: 40, h: 18 } },
  lesson: { rect: { x: 266, y: 136, w: 26, h: 22 } },
};

// 서비스가 아닌 페이지 — 벽 액자(포트폴리오) · 벽 책장(블로그)
const EXTRA_PLACES: Record<string, Placement> = {
  "/blog": { rect: { x: 6, y: 2, w: 40, h: 24 }, onWall: true },
  "/portfolio": { rect: { x: 158, y: 5, w: 22, h: 17 }, onWall: true },
};

export const STATIONS: Station[] = [
  ...(Object.keys(SERVICE_PLACES) as ServiceId[]).map((id) => {
    const s = byId(id);
    const p = SERVICE_PLACES[id];
    return {
      key: id,
      href: s.href,
      icon: s.icon,
      name: s.name,
      desc: s.desc,
      zone: s.category as ZoneId,
      rect: p.rect,
      onWall: p.onWall,
      spot: spotOf(p),
    };
  }),
  ...Object.entries(EXTRA_PLACES).map(([href, p]) => {
    const m = findMenuItem(href);
    return {
      key: href.slice(1),
      href,
      icon: m?.icon ?? "✨",
      name: m?.title ?? href,
      desc: href === "/blog" ? "도구 사용 안내와 만든 이야기" : "황총무가 해 온 일",
      zone: "extra" as ZoneId,
      rect: p.rect,
      onWall: p.onWall,
      spot: spotOf(p),
    };
  }),
];

// 장식 가구 (화분·소파 등) — 바닥을 막는다
export const DECOR: { kind: "plant" | "sofa" | "water" | "mat"; x: number; y: number }[] = [
  { kind: "plant", x: 84, y: 96 },
  { kind: "plant", x: 102, y: 96 },
  { kind: "plant", x: 186, y: 32 },
  { kind: "water", x: 186, y: 96 },
  { kind: "sofa", x: 36, y: 192 },
  { kind: "plant", x: 6, y: 194 },
  { kind: "plant", x: 300, y: 194 },
];

const DECOR_SIZE = { plant: { w: 12, h: 18 }, sofa: { w: 40, h: 16 }, water: { w: 10, h: 18 }, mat: { w: 0, h: 0 } };

/** 발이 들어갈 수 없는 곳 — 벽·칸막이·유리벽·바닥 가구 */
export const BLOCKS: Rect[] = [
  { x: 0, y: 0, w: MAP_W, h: WALL_Y },
  // 위/아래 줄 칸막이 (문 세 곳: 30~64 · 150~186 · 유리방 244~276)
  { x: 0, y: ROW_Y - 2, w: 30, h: 4 },
  { x: 64, y: ROW_Y - 2, w: 86, h: 4 },
  { x: 186, y: ROW_Y - 2, w: 58, h: 4 },
  { x: 276, y: ROW_Y - 2, w: 44, h: 4 },
  // 유리 회의실 왼쪽 벽 (문 62~90)
  { x: GLASS_X - 2, y: WALL_Y, w: 4, h: 32 },
  { x: GLASS_X - 2, y: 90, w: 4, h: ROW_Y - 90 },
  ...STATIONS.filter((s) => !s.onWall).map((s) => s.rect),
  ...DECOR.map((d) => ({ x: d.x, y: d.y, ...DECOR_SIZE[d.kind] })),
];

/** 황총무가 처음 서 있는 곳 — 자기 책상 앞 */
export const START = { x: 166, y: 88 };
