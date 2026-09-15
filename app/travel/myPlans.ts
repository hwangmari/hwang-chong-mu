// 이 브라우저에서 만든/열어 본 여행 목록.
// DB에 목록 조회 화면이 없어서 링크를 기억해 둔다.
// 로그인했다면 계정의 "내 방"에도 함께 등록해 다른 기기에서도 이어서 볼 수 있게 한다. (2026-09-16)
import { linkRoomToAccount } from "@/lib/roomServices";

export const MY_PLANS_KEY = "hcm:travel:my-plans";

// 목록에 남겨 두는 최대 개수 (오래된 것부터 밀려난다)
export const MY_PLANS_MAX = 20;

export type MyPlanItem = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  /** 마지막으로 연 시각 — 목록을 최근 순으로 보여주는 기준 */
  savedAt: string;
};

export function loadMyPlans(): MyPlanItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MY_PLANS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as MyPlanItem[]) : [];
  } catch {
    return [];
  }
}

// 최근에 연 것이 맨 앞. 이미 있는 여행이면 자리만 앞으로 옮긴다.
// savedAt 은 부르는 쪽이 챙기지 않아도 되도록 여기서 찍는다.
export function rememberMyPlan(item: Omit<MyPlanItem, "savedAt">) {
  if (typeof window === "undefined") return;
  const next = [
    { ...item, savedAt: new Date().toISOString() },
    ...loadMyPlans().filter((plan) => plan.id !== item.id),
  ].slice(0, MY_PLANS_MAX);
  window.localStorage.setItem(MY_PLANS_KEY, JSON.stringify(next));
  // 로그인 사용자면 내 계정의 "내 방"에도 등록(비로그인은 서버가 401 → 무시)
  linkRoomToAccount("travel", item.id, item.title);
}

// 목록에서만 지운다. 저장 공간의 여행 자체는 그대로 남는다(링크를 아는 다른 사람은 계속 본다).
export function forgetMyPlan(id: string) {
  if (typeof window === "undefined") return;
  const next = loadMyPlans().filter((plan) => plan.id !== id);
  window.localStorage.setItem(MY_PLANS_KEY, JSON.stringify(next));
}
