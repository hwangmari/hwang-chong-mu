// 경조사비 장부 도메인 타입.
// DB는 snake_case지만 gift_log_* RPC가 camelCase jsonb로 내려주므로 여기 타입이 곧 응답 형태다.

export type GiftDirection = "given" | "received";

export type GiftEventType =
  | "wedding"
  | "funeral"
  | "firstBirthday"
  | "birthday"
  | "etc";

export type GiftRelation =
  | "company"
  | "friend"
  | "relative"
  | "school"
  | "neighbor"
  | "etc";

export type GiftEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  eventType: GiftEventType;
  direction: GiftDirection;
  personName: string;
  relation: GiftRelation;
  relationDetail: string; // 관계 세부 (예: 디지털프로덕트팀, 전 직장 OO). 비워도 됨
  amount: number; // 원
  memo: string;
  // 받은 건에 대해 "나도 냈음" 표시. 낸 금액을 따로 기록하지 않아도 답례 여부를 남긴다
  returned: boolean;
  createdAt: string;
};

// 저장 요청 값. id가 없으면 새 기록, 있으면 수정.
export type GiftEntryInput = {
  id?: string;
  date: string;
  eventType: GiftEventType;
  direction: GiftDirection;
  personName: string;
  relation: GiftRelation;
  relationDetail: string;
  amount: number;
  memo: string;
};

export const DIRECTION_KEYS: GiftDirection[] = ["given", "received"];

export const DIRECTION_LABEL: Record<GiftDirection, string> = {
  given: "냈어요",
  received: "받았어요",
};

export const EVENT_TYPE_KEYS: GiftEventType[] = [
  "wedding",
  "funeral",
  "firstBirthday",
  "birthday",
  "etc",
];

export const EVENT_TYPE_LABEL: Record<GiftEventType, string> = {
  wedding: "결혼",
  funeral: "장례",
  firstBirthday: "돌잔치",
  birthday: "생일",
  etc: "기타",
};

export const EVENT_TYPE_ICON: Record<GiftEventType, string> = {
  wedding: "💍",
  funeral: "🕯️",
  firstBirthday: "🎂",
  birthday: "🎈",
  etc: "🎁",
};

export const RELATION_KEYS: GiftRelation[] = [
  "company",
  "friend",
  "relative",
  "school",
  "neighbor",
  "etc",
];

// 관계 세부 입력칸의 힌트 문구
export const RELATION_DETAIL_PLACEHOLDER: Record<GiftRelation, string> = {
  company: "예) 디지털프로덕트팀, 전 직장 OO",
  friend: "예) 대학 동기, 동호회",
  relative: "예) 외가, 사촌",
  school: "예) 고등학교, 대학원",
  neighbor: "예) 아파트 옆집",
  etc: "예) 거래처, 교회",
};

export const RELATION_LABEL: Record<GiftRelation, string> = {
  company: "회사",
  friend: "친구",
  relative: "친척",
  school: "학교",
  neighbor: "이웃",
  etc: "기타",
};

// 금액 입력을 빠르게 채우는 칩
export const AMOUNT_PRESETS: number[] = [30000, 50000, 100000, 200000, 300000];

// === 집계(파생) 타입 — aggregate.ts가 만든다 ===

export type PersonSummary = {
  personName: string;
  relation: GiftRelation;
  relationDetail: string;
  givenTotal: number; // 내가 준 총액
  receivedTotal: number; // 내가 받은 총액
  balance: number; // 받은 - 준. 양수면 내가 더 받은 상태
  entries: GiftEntry[]; // 날짜 내림차순
  // 받은 기록 중 하나라도 "냈음" 표시가 있으면 true (금액 미기록 답례)
  returnedMarked: boolean;
  receivedIds: string[]; // "냈음" 토글 대상 (받은 기록 id들)
  lastGiven: GiftEntry | null; // "지난번엔 얼마 냈더라?" 즉답용
  lastDate: string;
};

export type DirectionTotal = {
  given: number;
  received: number;
  count: number;
};

export type YearSummary = {
  year: number;
  givenTotal: number;
  receivedTotal: number;
  byEventType: { key: GiftEventType; total: DirectionTotal }[];
  // 관계 세부가 있으면 "회사 · 팀명"처럼 세부 단위로 나뉜다
  byRelation: { key: GiftRelation; detail: string; total: DirectionTotal }[];
};

// 칩·태그·금액에 쓰는 색 "이름". 실제 색은 테마에서 꺼내 쓴다.
// (고정 hex 를 두면 다크 모드에서 글씨가 안 보여서 이름만 남긴다 — page.styles.ts 의 toneInk/toneBg)
export type GiftTone =
  | "rose"
  | "teal"
  | "blue"
  | "indigo"
  | "amber"
  | "orange"
  | "green"
  | "gray";

// 낸 돈은 빨강 계열, 받은 돈은 초록 계열
export const DIRECTION_TONE: Record<GiftDirection, GiftTone> = {
  given: "rose",
  received: "teal",
};

export const EVENT_TYPE_TONE: Record<GiftEventType, GiftTone> = {
  wedding: "rose",
  funeral: "indigo",
  firstBirthday: "amber",
  birthday: "orange",
  etc: "gray",
};

export const RELATION_TONE: Record<GiftRelation, GiftTone> = {
  company: "blue",
  friend: "teal",
  relative: "amber",
  school: "indigo",
  neighbor: "green",
  etc: "gray",
};
