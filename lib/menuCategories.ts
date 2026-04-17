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

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    title: "친구들과 함께",
    emoji: "🤝",
    items: [
      {
        href: "/meeting",
        icon: "📅",
        title: "약속 잡기",
        desc: "친구들과 일정을 잡는 법",
      },
      {
        href: "/calc",
        icon: "💸",
        title: "N빵 계산기",
        desc: "복잡한 셈은 덜어내고",
      },
      {
        href: "/place",
        icon: "📍",
        title: "장소잡기",
        desc: "네이버 검색으로 후보를 골라 투표",
      },
      {
        href: "/game",
        icon: "🎮",
        title: "게임방",
        desc: "심심할 땐 랜덤 게임",
      },
    ],
  },
  {
    title: "일과 시간",
    emoji: "💼",
    items: [
      {
        href: "/overtime",
        icon: "🌙",
        title: "야근 계산기",
        desc: "보상휴가 기준을 빠르게 계산",
      },
      {
        href: "/schedule",
        icon: "🗓️",
        title: "업무 캘린더",
        desc: "프로젝트 일정 관리",
      },
    ],
  },
  {
    title: "매일의 기록",
    emoji: "🌱",
    items: [
      {
        href: "/account-book",
        icon: "🧾",
        title: "가계부",
        desc: "수입/지출을 한눈에 관리",
      },
      {
        href: "/habit",
        icon: "🥕",
        title: "습관 관리",
        desc: "매일매일 쌓이는 성실함",
      },
      {
        href: "/daily",
        icon: "📓",
        title: "일일 기록",
        desc: "한 줄 일기 + 체크리스트 그래프",
      },
      {
        href: "/diet",
        icon: "⚖️",
        title: "체중 관리",
        desc: "평생 숙제 다이어트!",
      },
      {
        href: "/workout",
        icon: "🏋️‍♂️",
        title: "운동 기록",
        desc: "러닝·웨이트 성장 그래프",
      },
      {
        href: "/inbody",
        icon: "🧬",
        title: "인바디 기록",
        desc: "원하는 지표만 골라 추이 보기",
      },
    ],
  },
];

// 기타 독립 페이지 (카테고리 외)
export const EXTRA_MENU: MenuItem[] = [
  { href: "/portfolio", icon: "👩‍💻", title: "포트폴리오", desc: "" },
  { href: "/blog", icon: "📝", title: "블로그", desc: "" },
  { href: "/ui-kit", icon: "🎨", title: "UI Kit 모음집", desc: "" },
];
