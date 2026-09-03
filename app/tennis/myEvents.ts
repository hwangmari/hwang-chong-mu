// 이 브라우저에서 만든/열어 본 교류전 목록.
// DB에 목록 조회 화면이 없어서 링크를 기억해 둔다.
// 로그인했다면 계정의 "내 방"에도 함께 등록해 다른 기기에서도 이어서 볼 수 있게 한다.
import { linkRoomToAccount } from "@/lib/roomServices";

export const MY_EVENTS_KEY = "hcm:tennis:my-events";

// 목록에 남겨 두는 최대 개수 (오래된 것부터 밀려난다)
export const MY_EVENTS_MAX = 20;

export type MyEvent = { id: string; title: string; date: string };

export function loadMyEvents(): MyEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MY_EVENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as MyEvent[]) : [];
  } catch {
    return [];
  }
}

export function rememberMyEvent(item: MyEvent) {
  if (typeof window === "undefined") return;
  const next = [item, ...loadMyEvents().filter((e) => e.id !== item.id)].slice(
    0,
    MY_EVENTS_MAX,
  );
  window.localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(next));
  // 로그인 사용자면 내 계정의 "내 방"에도 등록(비로그인은 서버가 401 → 무시)
  linkRoomToAccount("tennis", item.id, item.title);
}

// 계정에 등록된 교류전 중 이 브라우저에 없는 것만 목록 뒤에 채워 넣는다.
// 이미 있는 건 건드리지 않고, 개수 제한도 그대로 지킨다.
export function mergeMyEvents(items: MyEvent[]) {
  if (typeof window === "undefined") return;
  const existing = loadMyEvents();
  const known = new Set(existing.map((e) => e.id));
  const missing = items.filter((item) => item.id && !known.has(item.id));
  if (missing.length === 0) return;
  const next = [...existing, ...missing].slice(0, MY_EVENTS_MAX);
  window.localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(next));
}
