// 메뉴 목록 화면(홈 "모든 도구", 헤더 메뉴)이 쓰는 모양.
// 이름·아이콘·설명은 직접 적지 않고 lib/services.ts(단일 출처)에서 만들어 온다.
import { CATEGORIES, SERVICES } from "./services";

export type MenuItem = {
  href: string;
  icon: string;
  title: string;
  desc: string;
};

export type MenuCategory = {
  title: string;
  emoji: string;
  items: MenuItem[];
};

export const MENU_CATEGORIES: MenuCategory[] = [...CATEGORIES]
  .sort((a, b) => a.order - b.order)
  .map((category) => ({
    title: category.title,
    emoji: category.emoji,
    items: SERVICES.filter((service) => service.category === category.id).map(
      (service) => ({
        href: service.href,
        icon: service.icon,
        title: service.name,
        desc: service.desc,
      }),
    ),
  }));

// 기타 독립 페이지 (카테고리 외) — 서비스가 아니라서 등록소에 없다.
export const EXTRA_MENU: MenuItem[] = [
  { href: "/portfolio", icon: "👩‍💻", title: "포트폴리오", desc: "" },
  { href: "/blog", icon: "📝", title: "블로그", desc: "" },
  { href: "/ui-kit", icon: "🎨", title: "UI Kit 모음집", desc: "" },
];

// href로 메뉴 항목 찾기 — 아이콘·이름을 다른 화면(내 방 목록 등)에서 그대로 재사용한다.
export function findMenuItem(href: string): MenuItem | undefined {
  for (const category of MENU_CATEGORIES) {
    const found = category.items.find((item) => item.href === href);
    if (found) return found;
  }
  return EXTRA_MENU.find((item) => item.href === href);
}
