// 서비스 목록의 단일 출처(single source of truth).
//
// 서비스 이름·아이콘·설명이 메뉴, 헤더 제목, 내 방 목록, 포트폴리오 빠른 이동,
// 사이트맵, 페이지별 SEO에 따로따로 적혀 있어 서로 달라지는 일이 있었다.
// (예: 메뉴는 "게임방", 헤더는 "황총무 게임방" / 메뉴는 💸, 내 방은 🧮)
// 그래서 여기 한 번만 적고 나머지 화면은 전부 이 파일을 읽어 간다.
//
// 값을 고칠 때는 이 파일만 고치면 된다. 다른 곳에 같은 이름을 또 적지 않는다.

export type ServiceId =
  | "meeting"
  | "calc"
  | "place"
  | "game"
  | "tennis"
  | "overtime"
  | "schedule"
  | "account-book"
  | "gift-log"
  | "habit"
  | "daily"
  | "diet"
  | "workout"
  | "inbody";

export type ServiceCategoryId = "together" | "work" | "money" | "daily";

// 이 서비스에 들어가려면 무엇이 필요한지
// open  = 그냥 열린다 (로그인·비밀번호 없음)
// room  = 방 주소나 방 비밀번호/접근 코드가 필요하다
// login = 통합 계정 로그인이 필요하다 (검색 노출도 하지 않는다)
export type ServiceAccess = "open" | "room" | "login";

export type ServiceDef = {
  id: ServiceId;
  href: string;
  icon: string;
  /** 어디서나 쓰는 정식 이름 (메뉴·헤더·포트폴리오·내 방) */
  name: string;
  /** 이름이 길어 좁은 칩에 안 들어갈 때만 쓰는 짧은 이름 (5자 이하) */
  shortName?: string;
  /** 메뉴에 한 줄로 붙는 설명 */
  desc: string;
  category: ServiceCategoryId;
  /** 페이지 <title> */
  seoTitle: string;
  /** 검색 결과에 나오는 설명 (90자 이하) */
  seoDescription: string;
  access: ServiceAccess;
  /** hwang_user_rooms 에 방을 여러 개 등록하는 서비스 */
  room?: boolean;
  /** hwang_user_links 에 연결을 하나 저장하는 서비스 */
  link?: boolean;
};

export type ServiceCategory = {
  id: ServiceCategoryId;
  title: string;
  emoji: string;
  order: number;
  /** 홈 '모든 도구'에서 PC 3열 중 몇 번째 열에 놓이는지. 같은 열 번호면 위아래로 쌓인다 */
  column: 1 | 2 | 3;
};

// 4묶음이지만 PC 화면은 3열을 유지한다 — 작은 두 묶음(일과 시간·돈 관리)은 가운데 열에 위아래로 (2026-09-08 사용자 결정)
export const CATEGORIES: ServiceCategory[] = [
  { id: "together", title: "친구들과 함께", emoji: "🤝", order: 1, column: 1 },
  { id: "work", title: "일과 시간", emoji: "💼", order: 2, column: 2 },
  { id: "money", title: "돈 관리", emoji: "💰", order: 3, column: 2 },
  { id: "daily", title: "몸과 습관", emoji: "🌱", order: 4, column: 3 },
];

// 배열 순서 = 화면에 보이는 순서 (분류 안에서의 순서도 이 순서를 따른다)
export const SERVICES: ServiceDef[] = [
  {
    id: "meeting",
    href: "/meeting",
    icon: "📅",
    name: "약속 잡기",
    desc: "친구들과 일정을 잡는 법",
    category: "together",
    seoTitle: "황총무의 약속 잡기",
    seoDescription: "친구들과 약속을 가장 스마트하게 잡는 방법 📅",
    access: "room",
    room: true,
  },
  {
    id: "calc",
    href: "/calc",
    icon: "💸",
    name: "여행 경비 계산기",
    shortName: "여행 경비",
    desc: "각자 낸 대로 적으면 송금 최소화",
    category: "together",
    seoTitle: "황총무 여행 경비 계산기",
    seoDescription:
      "여행·모임에서 각자 낸 돈을 적으면 송금 횟수를 줄여 정산해 주는 계산기",
    access: "room",
    room: true,
  },
  {
    id: "place",
    href: "/place",
    icon: "📍",
    name: "장소잡기",
    desc: "네이버 검색으로 후보를 골라 투표",
    category: "together",
    seoTitle: "황총무 장소잡기",
    seoDescription:
      "네이버 검색으로 모임 장소 후보를 모으고 투표로 정하는 장소 정하기",
    access: "room",
    room: true,
  },
  {
    id: "game",
    href: "/game",
    icon: "🎮",
    name: "게임방",
    desc: "심심할 땐 랜덤 게임",
    category: "together",
    seoTitle: "황총무 게임방",
    seoDescription:
      "사다리 타기·돌림판을 바로 돌리거나 친구들과 방을 만들어 함께 하는 게임방",
    access: "room",
    room: true,
  },
  {
    id: "tennis",
    href: "/tennis",
    icon: "🎾",
    name: "테니스 교류전",
    shortName: "테니스",
    desc: "대진표 보고 점수 넣으면 승점 순위",
    category: "together",
    seoTitle: "황총무 테니스 교류전",
    seoDescription:
      "테니스 교류전 대진표를 보고 경기 점수를 넣으면 승점 순위가 바로 나오는 서비스",
    access: "room",
    room: true,
  },
  {
    id: "overtime",
    href: "/overtime",
    icon: "🌙",
    name: "야근 계산기",
    desc: "보상휴가 기준을 빠르게 계산",
    category: "work",
    seoTitle: "황총무 야근 계산기",
    seoDescription:
      "야근한 시간을 적으면 회사 기준에 맞춰 보상휴가 일수를 계산해 주는 도구",
    access: "open",
    room: true,
  },
  {
    id: "schedule",
    href: "/schedule",
    icon: "🗓️",
    name: "업무 캘린더",
    desc: "프로젝트 일정 관리",
    category: "work",
    seoTitle: "황총무 업무 캘린더",
    seoDescription: "프로젝트 일정을 파트별로 모아 함께 보는 업무용 캘린더",
    access: "room",
    link: true,
  },
  {
    id: "gift-log",
    href: "/gift-log",
    icon: "🎁",
    name: "경조사비 장부",
    shortName: "경조사비",
    desc: "축의금·부조금 주고받은 내역",
    category: "money",
    seoTitle: "황총무 경조사비 장부",
    seoDescription:
      "축의금·부조금을 사람별로 기록하고, 얼마 해야 할지 바로 찾아보는 장부",
    access: "login",
  },
  {
    id: "account-book",
    href: "/account-book",
    icon: "🧾",
    name: "가계부",
    desc: "수입/지출을 한눈에 관리",
    category: "money",
    seoTitle: "황총무 가계부",
    seoDescription: "문장등록과 월별 흐름으로 빠르게 쓰는 가계부",
    access: "room",
    link: true,
  },
  {
    id: "habit",
    href: "/habit",
    icon: "🥕",
    name: "습관 관리",
    desc: "매일매일 쌓이는 성실함",
    category: "daily",
    seoTitle: "황총무 습관 관리",
    seoDescription: "지키고 싶은 습관을 만들고 해낸 날을 채워 가는 습관 기록장",
    access: "open",
    link: true,
  },
  {
    id: "daily",
    href: "/daily",
    icon: "📓",
    name: "일일 기록",
    desc: "한 줄 일기 + 체크리스트 그래프",
    category: "daily",
    seoTitle: "황총무 일일 기록",
    seoDescription:
      "한 줄 일기와 체크리스트를 매일 남기고 그래프로 돌아보는 기록장",
    access: "room",
    room: true,
  },
  {
    id: "diet",
    href: "/diet",
    icon: "⚖️",
    name: "체중 관리",
    desc: "평생 숙제 다이어트!",
    category: "daily",
    seoTitle: "황총무 체중 관리",
    seoDescription:
      "매일의 식단과 몸무게를 기록하며 목표 체중까지 따라가는 다이어트 수첩",
    access: "open",
    link: true,
  },
  {
    id: "workout",
    href: "/workout",
    icon: "🏋️‍♂️",
    name: "운동 기록",
    desc: "러닝·웨이트 성장 그래프",
    category: "daily",
    seoTitle: "황총무 운동 기록",
    seoDescription: "러닝과 웨이트 기록을 모아 성장 그래프로 보여주는 운동 수첩",
    access: "room",
    link: true,
  },
  {
    id: "inbody",
    href: "/inbody",
    icon: "🧬",
    name: "인바디 기록",
    desc: "원하는 지표만 골라 추이 보기",
    category: "daily",
    seoTitle: "황총무 인바디 기록",
    seoDescription: "원하는 인바디 지표만 골라 추이를 보는 개인 체성분 수첩",
    access: "room",
  },
];

const BY_ID = new Map<ServiceId, ServiceDef>(SERVICES.map((s) => [s.id, s]));
const BY_HREF = new Map<string, ServiceDef>(SERVICES.map((s) => [s.href, s]));

export function byId(id: ServiceId): ServiceDef;
export function byId(id: string): ServiceDef | undefined;
export function byId(id: string): ServiceDef | undefined {
  return BY_ID.get(id as ServiceId);
}

/** 주소로 서비스 찾기. /calc/123 처럼 하위 주소도 /calc 로 찾아 준다. */
export function byHref(pathname: string): ServiceDef | undefined {
  const exact = BY_HREF.get(pathname);
  if (exact) return exact;
  // 하위 주소는 가장 긴 것부터 맞춰 본다 (/account-book 이 /account 보다 먼저 걸리도록)
  let best: ServiceDef | undefined;
  for (const service of SERVICES) {
    if (!pathname.startsWith(`${service.href}/`)) continue;
    if (!best || service.href.length > best.href.length) best = service;
  }
  return best;
}

/** 좁은 자리에 넣을 이름 (짧은 이름이 있으면 그걸로) */
export function chipName(service: ServiceDef) {
  return service.shortName ?? service.name;
}

export function servicesOf(category: ServiceCategoryId) {
  return SERVICES.filter((service) => service.category === category);
}
