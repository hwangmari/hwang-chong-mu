import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import {
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  CategoryOption,
  EntryType,
  PaymentType,
} from "../../types";
import type {
  ExtractedImageEntryCandidate,
  NaturalParseContext,
} from "./types";

export const CARD_COMPANY_DEFAULT = "KB국민카드";
export const CHECK_CARD_BRAND_DEFAULT = "네이버하나머니";
export const MEMBER_FALLBACK = "사용자1";
export const ALL_PARTICIPANTS_ID = "all";
export const INCOME_CATEGORY_LABEL = "수입";
export const SAVINGS_CATEGORY_LABEL = "자산/저축";
export const CARD_COMPANY_OPTIONS = [
  "KB국민카드",
  "신한카드",
  "삼성카드",
  "네이버현대카드",
  "현대카드",
  "롯데카드",
  "하나카드",
  "우리카드",
  "NH농협카드",
  "BC카드",
] as const;
export const CHECK_CARD_BRAND_OPTIONS = [
  "네이버하나머니",
  "카카오",
  "토스",
  "페이코",
] as const;

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    label: "생활비",
    color: "#bf8a79",
    icon: "🍽️",
    description: "식비, 의료, 약국, 구독, 플랫폼 결제",
  },
  {
    label: "고정비",
    color: "#5f73d9",
    icon: "📌",
    description: "공과금, 통신비, 보험료 같은 반복 지출",
  },
  {
    label: "이동/차량",
    color: "#dbc85a",
    icon: "🚗",
    description: "택시, 주차, 주유, 충전, 교통카드, 통행료",
  },
  {
    label: "쇼핑/여가",
    color: "#818bd7",
    icon: "🛍️",
    description: "쇼핑, 패션, 여행, 여가 소비",
  },
  {
    label: "특별/기타",
    color: "#3c3d41",
    icon: "🎁",
    description: "선물, 경조사, 이벤트 같은 특별 지출",
  },
  {
    label: "카드대금",
    color: "#5d6f8d",
    icon: "💳",
    description: "카드 청구액, 이용대금, 결제대금 같은 정산 내역",
  },
  {
    label: SAVINGS_CATEGORY_LABEL,
    color: "#5d9cec",
    icon: "💰",
    description: "예금, 연금, 투자처럼 자산을 쌓는 항목",
  },
];

export const INCOME_CATEGORY_OPTIONS: CategoryOption[] = [
  {
    label: INCOME_CATEGORY_LABEL,
    color: "#4f7cff",
    icon: "💼",
    description: "월급, 입금, 환급 등 들어온 금액",
  },
];

const ASSET_SUBCATEGORY_OPTIONS = [
  "예금",
  "적금",
  "CMA",
  "ISA",
  "청약",
  "비상금",
  "연금저축",
  "IRP",
  "퇴직연금",
  "주식",
  "해외주식",
  "ETF",
  "펀드",
  "채권",
  "코인",
] as const;
const FIXED_EXPENSE_SUBCATEGORY_OPTIONS = [
  "공과금",
  "핸드폰비",
  "보험료",
  "관리비",
  "구독료",
  "대출이자",
  "기타",
] as const;
const FUEL_KEYWORD_PATTERN =
  /주유|주유소|셀프주유|알뜰주유소|gs칼텍스|gscaltex|s-?oil|에스오일|sk에너지|skenergy|현대오일뱅크|오일뱅크/i;
const EV_CHARGE_KEYWORD_PATTERN =
  /전기차|ev|급속충전|완속충전|슈퍼차저|supercharger|충전/i;
const FOOD_KEYWORD_PATTERN =
  /우아한형제들|배달의민족|배민|요기요|쿠팡이츠|식당|밥|점심|저녁|아침|브런치|한식|중식|일식|분식|치킨|피자|햄버거|버거|국밥|김밥|샐러드|도시락|카페|커피|디저트|베이커리|빵|편의점|마트|이마트|홈플러스|롯데마트/i;
const PHARMACY_KEYWORD_PATTERN = /약국|온누리약국|처방약|일반약|상비약|영양제/i;
const MEDICAL_KEYWORD_PATTERN =
  /병원|의원|클리닉|한의원|치과|검사|진료|응급실|물리치료|건강검진/i;
const TAXI_TRANSIT_KEYWORD_PATTERN =
  /택시|우버|카카오 ?t|버스|지하철|기차|ktx|srt|철도/i;
const TRANSIT_CARD_KEYWORD_PATTERN =
  /티머니|캐시비|레일플러스|교통카드|정기권/i;
const TOLL_KEYWORD_PATTERN = /통행료|하이패스|유료도로|톨게이트/i;
const TRAVEL_KEYWORD_PATTERN =
  /여행|관광|숙소|호텔|모텔|리조트|에어비앤비|야놀자|여기어때|항공|비행기|렌터카|렌트카|레저/i;
const GIFT_KEYWORD_PATTERN = /선물|꽃다발|꽃|케이크|경조사|축의|조의|이벤트/i;
const FIXED_EXPENSE_KEYWORD_PATTERN =
  /공과금|전기|가스|수도|휴대폰|핸드폰|통신비|인터넷|와이파이|보험|관리비|아파트관리비/i;
const SAVINGS_KEYWORD_PATTERN =
  /적금|예금|cma|isa|청약|비상금|연금저축|퇴직연금|연금|irp|주식|해외주식|etf|펀드|채권|코인|투자/i;
const CULTURE_SUBSCRIPTION_KEYWORD_PATTERN =
  /구독|넷플릭스|유튜브\s?프리미엄|youtube|티빙|웨이브|디즈니|왓챠|멜론|지니뮤직|spotify|스포티파이|리디북스|밀리의서재|도서|서점|영화|전시|공연/i;
const PLATFORM_PAY_KEYWORD_PATTERN =
  /네이버페이|카카오페이|토스페이|페이코|payco|paypal|간편결제|플랫폼/i;
const FASHION_BEAUTY_KEYWORD_PATTERN =
  /무신사|지그재그|에이블리|29cm|wconcept|올리브영|화장품|뷰티|미용|의류|신발|가방|패션/i;
const SHOPPING_GENERAL_KEYWORD_PATTERN =
  /쿠팡|11번가|g마켓|옥션|네이버쇼핑|오늘의집|다이소|생활용품|생필품|가전|가구|온라인쇼핑|쇼핑|구매/i;
const CARD_SETTLEMENT_KEYWORD_PATTERN =
  /카드대금|이용대금|대금결제|결제대금|카드값|청구금액|결제일|자동이체|카드결제/i;
const CAR_COMPANY_NOISE_PATTERN =
  /kb\s*국민\s*카드|국민\s*카드|신한\s*카드|삼성\s*카드|네이버\s*현대\s*카드|현대\s*카드|롯데\s*카드|롯데\s*카트|하나\s*카드|우리\s*카드|농협\s*카드|nh\s*농협\s*카드|bc\s*카드|bccard|네이버\s*하나\s*머니|카카오\s*페이|토스\s*페이|페이코|payco/gi;
const CATEGORY_DETAIL_OPTIONS: Record<string, readonly string[]> = {
  생활비: ["식비", "카페", "병원", "약국", "구독", "플랫폼"],
  고정비: FIXED_EXPENSE_SUBCATEGORY_OPTIONS,
  "이동/차량": ["택시", "주유", "주차", "충전", "교통카드", "통행료"],
  "쇼핑/여가": ["쇼핑", "패션", "여행", "레저"],
  "특별/기타": ["선물", "경조사", "이벤트", "기타"],
  카드대금: ["카드대금", "이용대금", "결제대금", "자동이체"],
  [SAVINGS_CATEGORY_LABEL]: ASSET_SUBCATEGORY_OPTIONS,
};
const CATEGORY_DETAIL_RULES = [
  {
    category: "식비/외식",
    detail: "배민",
    patterns: [/우아한형제들/i, /배달의민족/i, /\b배민\b/i],
  },
  {
    category: "식비/외식",
    detail: "쿠팡이츠",
    patterns: [/쿠팡이츠/i],
  },
  {
    category: "식비/외식",
    detail: "요기요",
    patterns: [/요기요/i],
  },
  {
    category: "식비/외식",
    detail: "카페",
    patterns: [/스타벅스/i, /투썸/i, /메가커피/i, /커피/i, /카페/i],
  },
  {
    category: "식비/외식",
    detail: "편의점",
    patterns: [/gs25/i, /cu\b/i, /세븐일레븐/i, /편의점/i],
  },
  {
    category: "식비/외식",
    detail: "마트",
    patterns: [/이마트/i, /홈플러스/i, /롯데마트/i, /마트/i],
  },
  {
    category: "식비/외식",
    detail: "식당",
    patterns: [/식당/i, /한식/i, /중식/i, /일식/i, /분식/i, /치킨/i, /피자/i],
  },
  {
    category: "교통/택시",
    detail: "택시",
    patterns: [/카카오 ?t/i, /우버/i, /택시/i],
  },
  {
    category: "교통/택시",
    detail: "버스",
    patterns: [/버스/i],
  },
  {
    category: "교통/택시",
    detail: "지하철",
    patterns: [/지하철/i],
  },
  {
    category: "교통/택시",
    detail: "기차",
    patterns: [/ktx/i, /srt/i, /기차/i],
  },
  {
    category: "주차/교통",
    detail: "주유",
    patterns: [FUEL_KEYWORD_PATTERN],
  },
  {
    category: "주차/교통",
    detail: "주차장",
    patterns: [/주차|주차장/i],
  },
  {
    category: "주차/교통",
    detail: "충전",
    patterns: [EV_CHARGE_KEYWORD_PATTERN],
  },
  {
    category: "주차/교통",
    detail: "대리",
    patterns: [/대리/i],
  },
  {
    category: "결제/플랫폼",
    detail: "네이버페이",
    patterns: [/네이버페이/i],
  },
  {
    category: "결제/플랫폼",
    detail: "카카오페이",
    patterns: [/카카오페이/i],
  },
  {
    category: "결제/플랫폼",
    detail: "토스페이",
    patterns: [/토스페이/i],
  },
  {
    category: "문화/구독",
    detail: "OTT",
    patterns: [/넷플릭스/i, /티빙/i, /웨이브/i, /디즈니/i],
  },
  {
    category: "문화/구독",
    detail: "음악",
    patterns: [/멜론/i, /지니/i, /spotify/i, /스포티파이/i, /애플뮤직/i],
  },
  {
    category: "문화/구독",
    detail: "도서",
    patterns: [/리디북스/i, /밀리의서재/i, /도서/i, /서점/i],
  },
  {
    category: "문화/구독",
    detail: "전시",
    patterns: [/전시/i, /공연/i, /영화/i],
  },
  {
    category: "여행/관광",
    detail: "숙소",
    patterns: [
      /숙소/i,
      /호텔/i,
      /모텔/i,
      /리조트/i,
      /에어비앤비/i,
      /야놀자/i,
      /여기어때/i,
    ],
  },
  {
    category: "여행/관광",
    detail: "항공",
    patterns: [/항공/i, /비행기/i],
  },
  {
    category: "여행/관광",
    detail: "레저",
    patterns: [/레저/i],
  },
  {
    category: "여행/관광",
    detail: "관광",
    patterns: [/관광/i, /여행/i],
  },
  {
    category: "약국",
    detail: "처방약",
    patterns: [/처방약/i],
  },
  {
    category: "약국",
    detail: "일반약",
    patterns: [/일반약/i, /상비약/i],
  },
  {
    category: "약국",
    detail: "영양제",
    patterns: [/영양제/i],
  },
] as const;
const CARD_COMPANY_PATTERNS = [
  [/kb국민카드|국민카드|kb국민/i, "KB국민카드"],
  [/신한카드|shinhan/i, "신한카드"],
  [/삼성카드|samsungcard/i, "삼성카드"],
  [/네이버현대카드|네이버현대|naverhyundaicard/i, "네이버현대카드"],
  [/현대카드|hyundaicard/i, "현대카드"],
  [/롯데카드|롯데카트|lottecard/i, "롯데카드"],
  [/하나카드|hanacard/i, "하나카드"],
  [/우리카드|wooricard/i, "우리카드"],
  [/nh농협카드|농협카드|nhcard/i, "NH농협카드"],
  [/\bbc카드\b|\bbccard\b/i, "BC카드"],
] as const;
const CHECK_CARD_BRAND_PATTERNS = [
  [/네이버하나머니|하나머니/i, "네이버하나머니"],
  [/카카오페이|카카오\s*pay/i, "카카오"],
  [/토스페이|토스\s*pay|토스결제/i, "토스"],
  [/페이코|\bpayco\b/i, "페이코"],
] as const;

const KOREAN_UNIT_AMOUNT_PATTERN =
  "-?(?:(?:\\d[\\d,]*)\\s*(?:만|천|백|십)\\s*)+(?:\\d[\\d,]*)?\\s*원?";

export function createEntryId() {
  return `entry-${Math.random().toString(36).slice(2, 10)}`;
}

export function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseIsoDate(isoDate: string) {
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

export function formatSelectedDateTitle(selectedDate: string) {
  const parsed = parseIsoDate(selectedDate);
  if (!parsed) return "선택한 날짜";
  return format(parsed, "M월 d일 EEEE", { locale: ko });
}

export function paymentLabel(payment: PaymentType) {
  if (payment === "cash") return "현금";
  if (payment === "check_card") return "체크카드";
  return "카드";
}

export function getDefaultCardCompany(payment: PaymentType) {
  if (payment === "cash") return "";
  return payment === "check_card"
    ? CHECK_CARD_BRAND_DEFAULT
    : CARD_COMPANY_DEFAULT;
}

export function getCardCompanyOptions(payment: PaymentType): string[] {
  return payment === "check_card"
    ? [...CHECK_CARD_BRAND_OPTIONS]
    : [...CARD_COMPANY_OPTIONS];
}

export function getCategoryDetailOptions(category: string) {
  return [...(CATEGORY_DETAIL_OPTIONS[category] || [])];
}

export function getRepresentativeExpenseCategory(category: string) {
  const normalizedCategory = category.trim();

  if (!normalizedCategory) return "생활비";

  if (
    [
      "생활비",
      "식비/외식",
      "병원/의료",
      "약국",
      "문화/구독",
      "결제/플랫폼",
    ].includes(normalizedCategory)
  ) {
    return "생활비";
  }

  if (
    [
      "이동/차량",
      "교통/택시",
      "주차/교통",
      "교통카드/충전",
      "통행료",
    ].includes(normalizedCategory)
  ) {
    return "이동/차량";
  }

  if (
    ["쇼핑/여가", "쇼핑/패션", "쇼핑/기타", "여행/관광"].includes(
      normalizedCategory,
    )
  ) {
    return "쇼핑/여가";
  }

  if (["특별/기타", "선물/기타"].includes(normalizedCategory)) {
    return "특별/기타";
  }

  if (["카드대금", "카드결제", "청구결제"].includes(normalizedCategory)) {
    return "카드대금";
  }

  if (normalizedCategory === "고정비") {
    return "고정비";
  }

  if ([SAVINGS_CATEGORY_LABEL, "저축"].includes(normalizedCategory)) {
    return SAVINGS_CATEGORY_LABEL;
  }

  return normalizedCategory;
}

export function getRepresentativeCategory(category: string, type: EntryType) {
  if (type === "income") {
    return INCOME_CATEGORY_LABEL;
  }

  return getRepresentativeExpenseCategory(category);
}

export function isSavingsCategory(category: string) {
  return getRepresentativeExpenseCategory(category) === SAVINGS_CATEGORY_LABEL;
}

export function isFixedExpenseCategory(category: string) {
  return getRepresentativeExpenseCategory(category) === "고정비";
}

export function toPaymentValue(text: string): PaymentType | null {
  if (CARD_SETTLEMENT_KEYWORD_PATTERN.test(text)) return "cash";
  if (text.includes("체크")) return "check_card";
  if (text.includes("현금")) return "cash";
  if (text.includes("카드")) return "card";
  return null;
}

export function inferCategoryFromItemText(text: string) {
  if (!text) return null;
  if (CARD_SETTLEMENT_KEYWORD_PATTERN.test(text)) return "카드대금";
  if (SAVINGS_KEYWORD_PATTERN.test(text)) return SAVINGS_CATEGORY_LABEL;
  if (PHARMACY_KEYWORD_PATTERN.test(text)) return "생활비";
  if (MEDICAL_KEYWORD_PATTERN.test(text)) return "생활비";
  if (TRANSIT_CARD_KEYWORD_PATTERN.test(text)) return "이동/차량";
  if (TOLL_KEYWORD_PATTERN.test(text)) return "이동/차량";
  if (
    /주차|주차장|대리|세차/i.test(text) ||
    FUEL_KEYWORD_PATTERN.test(text) ||
    EV_CHARGE_KEYWORD_PATTERN.test(text)
  ) {
    return "이동/차량";
  }
  if (TAXI_TRANSIT_KEYWORD_PATTERN.test(text)) return "이동/차량";
  if (TRAVEL_KEYWORD_PATTERN.test(text)) return "쇼핑/여가";
  if (GIFT_KEYWORD_PATTERN.test(text)) return "특별/기타";
  if (FIXED_EXPENSE_KEYWORD_PATTERN.test(text)) return "고정비";
  if (CULTURE_SUBSCRIPTION_KEYWORD_PATTERN.test(text)) return "생활비";
  if (PLATFORM_PAY_KEYWORD_PATTERN.test(text)) return "생활비";
  if (FASHION_BEAUTY_KEYWORD_PATTERN.test(text)) return "쇼핑/여가";
  if (FOOD_KEYWORD_PATTERN.test(text)) return "생활비";
  if (SHOPPING_GENERAL_KEYWORD_PATTERN.test(text)) return "쇼핑/여가";
  return null;
}

export function normalizeExpenseCategorySelection(
  category: string,
  subCategory = "",
): { category: string; subCategory: string } {
  const normalizedCategory = getRepresentativeExpenseCategory(category);
  const normalizedSubCategory = subCategory.trim();

  const aliasMap: Array<{
    pattern: RegExp;
    category: string;
    subCategory?: string;
  }> = [
    { pattern: /^카드대금|이용대금|결제대금|카드값|청구금액$/i, category: "카드대금" },
    {
      pattern: /^주유|주유소|세차$/i,
      category: "이동/차량",
      subCategory: "주유",
    },
    {
      pattern: /^충전|전기차충전|급속충전|완속충전$/i,
      category: "이동/차량",
      subCategory: "충전",
    },
    { pattern: /^주차|주차장$/i, category: "이동/차량", subCategory: "주차장" },
    { pattern: /^대리$/i, category: "이동/차량", subCategory: "대리" },
    { pattern: /^택시$/i, category: "이동/차량", subCategory: "택시" },
    { pattern: /^버스$/i, category: "이동/차량", subCategory: "버스" },
    { pattern: /^지하철$/i, category: "이동/차량", subCategory: "지하철" },
    { pattern: /^기차|ktx|srt$/i, category: "이동/차량", subCategory: "기차" },
    { pattern: /^교통카드|티머니|캐시비$/i, category: "이동/차량", subCategory: "교통카드" },
    { pattern: /^하이패스|통행료$/i, category: "이동/차량", subCategory: "통행료" },
    { pattern: /^처방약|일반약|영양제$/i, category: "생활비", subCategory: "약국" },
    { pattern: /^숙소|항공|레저|관광$/i, category: "쇼핑/여가" },
  ];

  const matchedAlias = aliasMap.find(({ pattern }) =>
    pattern.test(normalizedCategory),
  );
  if (matchedAlias) {
    return {
      category: matchedAlias.category,
      subCategory: normalizedSubCategory || matchedAlias.subCategory || "",
    };
  }

  return {
    category: normalizedCategory,
    subCategory: normalizedSubCategory,
  };
}

export function inferAssetSubCategoryFromText(text: string) {
  const lower = text.toLowerCase();
  const assetRules: Array<[RegExp, (typeof ASSET_SUBCATEGORY_OPTIONS)[number]]> = [
    [/연금저축|연저펀|연저/i, "연금저축"],
    [/퇴직연금/i, "퇴직연금"],
    [/\birp\b/i, "IRP"],
    [/\bisa\b/i, "ISA"],
    [/\bcma\b/i, "CMA"],
    [/청약저축|주택청약|청약/i, "청약"],
    [/비상금/i, "비상금"],
    [/미국주식|해외주식|해외\s*주식/i, "해외주식"],
    [/국내주식|주식/i, "주식"],
    [/\betf\b/i, "ETF"],
    [/펀드/i, "펀드"],
    [/채권/i, "채권"],
    [/코인|비트코인|이더리움|가상자산/i, "코인"],
    [/예금/i, "예금"],
    [/적금/i, "적금"],
  ];

  return assetRules.find(([pattern]) => pattern.test(lower))?.[1] || "";
}

export function inferSubCategoryFromText(category: string, text: string) {
  if (!text) return "";
  if (isSavingsCategory(category)) {
    return inferAssetSubCategoryFromText(text);
  }
  if (isFixedExpenseCategory(category)) {
    if (/전기|가스|수도|공과금/.test(text)) return "공과금";
    if (/휴대폰|핸드폰|통신비/.test(text)) return "핸드폰비";
    if (/보험/.test(text)) return "보험료";
    if (/관리비/.test(text)) return "관리비";
    if (/구독/.test(text)) return "구독료";
    if (/이자/.test(text)) return "대출이자";
  }

  const matchedRule = CATEGORY_DETAIL_RULES.find(
    (rule) =>
      getRepresentativeExpenseCategory(rule.category) ===
        getRepresentativeExpenseCategory(category) &&
      rule.patterns.some((pattern) => pattern.test(text)),
  );
  if (matchedRule) {
    return matchedRule.detail;
  }

  return (
    getCategoryDetailOptions(category).find((option) =>
      text.includes(option),
    ) || ""
  );
}

export function inferCardCompanyFromText(
  text: string,
  payment: PaymentType = "card",
) {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, "").replace(/카트/g, "카드");
  if (payment === "check_card") {
    return (
      CHECK_CARD_BRAND_PATTERNS.find(([pattern]) => pattern.test(normalized))?.[1] ||
      ""
    );
  }
  return (
    CARD_COMPANY_PATTERNS.find(([pattern]) => pattern.test(normalized))?.[1] ||
    ""
  );
}

function normalizeCompanyLabel(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

export function isCardSettlementEntry(
  entry: Pick<
    AccountEntry,
    | "type"
    | "category"
    | "payment"
    | "merchant"
    | "item"
    | "memo"
    | "rawText"
    | "cardCompany"
  >,
) {
  if (entry.type !== "expense") return false;
  if (entry.payment !== "cash") return false;
  if (getRepresentativeExpenseCategory(entry.category || "") === "카드대금") {
    return true;
  }

  const merchantText = normalizeCompanyLabel(entry.merchant || "");
  const itemText = normalizeCompanyLabel(entry.item || "");
  const memoText = normalizeCompanyLabel(entry.memo || "");
  const rawText = normalizeCompanyLabel(entry.rawText || "");
  const cardCompanyText = normalizeCompanyLabel(entry.cardCompany || "");
  const mergedText = [
    merchantText,
    itemText,
    memoText,
    rawText,
    cardCompanyText,
  ]
    .filter(Boolean)
    .join(" ");
  const settlementKeywordPattern =
    CARD_SETTLEMENT_KEYWORD_PATTERN;
  const hasSettlementKeyword = settlementKeywordPattern.test(mergedText);
  const matchedCompany = [...CARD_COMPANY_OPTIONS].find((company) => {
    const normalizedCompany = normalizeCompanyLabel(company);
    return (
      merchantText.includes(normalizedCompany) ||
      itemText.includes(normalizedCompany) ||
      memoText.includes(normalizedCompany) ||
      rawText.includes(normalizedCompany) ||
      (cardCompanyText && cardCompanyText === normalizedCompany)
    );
  });

  return Boolean(matchedCompany) && hasSettlementKeyword;
}

export function parseQuickDate(text: string, fallbackDate: string) {
  if (text.includes("오늘")) {
    return toIsoDate(new Date());
  }

  if (text.includes("어제")) {
    return toIsoDate(subDays(new Date(), 1));
  }

  if (text.includes("그제")) {
    return toIsoDate(subDays(new Date(), 2));
  }

  const monthDayMatch = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (monthDayMatch) {
    const year = fallbackDate.slice(0, 4);
    const [, month, day] = monthDayMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const fullDateMatch = text.match(/(\d{4})[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})/);
  if (fullDateMatch) {
    const [, year, month, day] = fullDateMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortDateMatch = text.match(/(\d{1,2})[./월\s]+(\d{1,2})/);
  if (shortDateMatch) {
    const year = fallbackDate.slice(0, 4);
    const [, month, day] = shortDateMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return fallbackDate;
}

function normalizeNaturalText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function createKoreanUnitAmountRegex() {
  return new RegExp(KOREAN_UNIT_AMOUNT_PATTERN, "g");
}

function parseKoreanUnitAmount(fragment: string) {
  const compact = fragment
    .replace(/원/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
  if (!compact) return 0;

  const isNegative = compact.startsWith("-");
  const source = isNegative ? compact.slice(1) : compact;
  let total = 0;
  let rest = source;
  const unitMap = [
    ["만", 10000],
    ["천", 1000],
    ["백", 100],
    ["십", 10],
  ] as const;

  unitMap.forEach(([unit, multiplier]) => {
    const match = rest.match(new RegExp(`(\\d+)${unit}`));
    if (!match) return;
    total += Number(match[1]) * multiplier;
    rest = rest.replace(new RegExp(`\\d+${unit}`), "");
  });

  const tailNumber = rest.match(/\d+/);
  if (tailNumber) {
    total += Number(tailNumber[0]);
  }

  return isNegative ? -total : total;
}

export function parseAmountValue(text: string) {
  const koreanUnitMatches = Array.from(
    text.matchAll(createKoreanUnitAmountRegex()),
  );
  if (koreanUnitMatches.length > 0) {
    return parseKoreanUnitAmount(koreanUnitMatches.at(-1)?.[0] || "");
  }

  const explicitAmountMatches = Array.from(text.matchAll(/(-?\d[\d,]*)\s*원/g));
  if (explicitAmountMatches.length > 0) {
    const value = explicitAmountMatches.at(-1)?.[1] || "0";
    return Number(value.replace(/,/g, ""));
  }

  const numericMatches = Array.from(text.matchAll(/(-?\d[\d,]*)/g));
  if (numericMatches.length === 0) return 0;
  const value = numericMatches.at(-1)?.[1] || "0";
  return Number(value.replace(/,/g, ""));
}

function detectEntryType(text: string): EntryType {
  return /수입|입금|월급|급여|환급|정산받|받았/.test(text)
    ? "income"
    : "expense";
}

function detectPayment(text: string, type: EntryType): PaymentType {
  if (type === "income") return "cash";
  if (
    /네이버하나머니|하나머니|카카오페이|카카오\s*pay|토스페이|토스\s*pay|페이코|payco/i.test(
      text,
    )
  ) {
    return "check_card";
  }
  if (/체크카드|체크/.test(text)) return "check_card";
  if (/현금|계좌이체|이체|송금/.test(text)) return "cash";
  if (/카드|네이버페이|카카오페이|토스페이|pay/.test(text.toLowerCase())) {
    return "card";
  }
  return "card";
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeNaturalNoise(text: string, memberNames: string[]) {
  const memberPattern =
    memberNames.length > 0
      ? new RegExp(memberNames.map((name) => escapeRegExp(name)).join("|"), "g")
      : null;
  return normalizeNaturalText(
    text
      .replace(/오늘|어제|그제/g, " ")
      .replace(/\d{4}[-./]\s*\d{1,2}[-./]\s*\d{1,2}/g, " ")
      .replace(/\d{1,2}\s*월\s*\d{1,2}\s*일/g, " ")
      .replace(/(^|\s)\d{1,2}\s*일(?=\s|$)/g, " ")
      .replace(/\d{1,2}[./-]\s*\d{1,2}/g, " ")
      .replace(createKoreanUnitAmountRegex(), " ")
      .replace(/-?\d[\d,]*\s*원?/g, " ")
      .replace(
        /구매했어요|구매했어|구매함|구매|결제했어요|결제했어|결제함|결제|사용했어요|사용했어|사용함|사용|썼어요|썼어|샀어요|샀어|샀다|입금됐어|입금|수입|지출|환급|정산받았어|받았어|받음|월급|급여/g,
        " ",
      )
      .replace(CAR_COMPANY_NOISE_PATTERN, " ")
      .replace(/체크카드|체크|현금|카드|계좌이체|이체|송금/g, " ")
      .replace(/일시불|할부/g, " ")
      .replace(memberPattern || /$^/, " ")
      .replace(/[()]/g, " "),
  );
}

function extractMerchantAndItem(text: string, memberNames: string[]) {
  const cleaned = removeNaturalNoise(text, memberNames);
  if (!cleaned) {
    return { merchant: "", item: "" };
  }

  const tokens = cleaned
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 1) {
    return { merchant: "", item: tokens[0] };
  }

  return {
    merchant: tokens[0],
    item: tokens.slice(1).join(" "),
  };
}

export function formatPreviewDate(date: string) {
  const parsed = parseIsoDate(date);
  if (!parsed) return date;
  return format(parsed, "M월 d일", { locale: ko });
}

export function parseNaturalInputEntry(
  rawText: string,
  context: NaturalParseContext,
): AccountEntry | null {
  const text = normalizeNaturalText(rawText);
  if (!text) return null;

  const amount = parseAmountValue(text);
  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const type = detectEntryType(text);
  const date = parseQuickDate(text, context.fallbackDate);
  const payment = detectPayment(text, type);
  const matchedUser =
    context.memberUsers.find((user) => text.includes(user.name)) ||
    context.memberUsers[0] ||
    context.users[0];
  const { merchant, item } = extractMerchantAndItem(
    text,
    context.memberUsers.map((user) => user.name).filter(Boolean),
  );
  const detailText = [merchant, item, text].filter(Boolean).join(" ");
  const category =
    inferCategoryFromItemText(detailText || text) ||
    (type === "income" ? INCOME_CATEGORY_LABEL : "생활비");
  const subCategory = inferSubCategoryFromText(category, detailText || text);
  const normalizedItem =
    item || merchant || (type === "income" ? "수입" : "미입력");
  const cardCompany =
    payment === "cash"
      ? ""
      : inferCardCompanyFromText(text, payment) || getDefaultCardCompany(payment);

  return {
    id: createEntryId(),
    date,
    member: matchedUser?.name || context.defaultMember,
    workspaceId: context.workspaceId,
    createdByUserId: matchedUser?.id || context.users[0].id,
    type,
    category,
    subCategory,
    merchant,
    item: normalizedItem,
    amount,
    cardCompany,
    payment,
    memo: "",
    rawText: text,
  };
}

function normalizeOcrLine(text: string) {
  return text.replace(/[|]/g, " ").replace(/\s+/g, " ").trim();
}

function isOcrNoiseLine(text: string) {
  return (
    !text ||
    /^(4:\d{2}|[0-9]{1,2}%|LOCA|all|€|>|<|ㅋㄷ|—|\(I)$/i.test(text) ||
    /결제예정금액|결제예|카드|Image too small|Line cannot be recognized/i.test(
      text,
    )
  );
}

function isInstallmentLine(text: string) {
  return /일시불|할부/.test(text);
}

function extractDateLabel(text: string) {
  const match = text.match(/(\d{1,2}\s*월\s*\d{1,2}\s*일(?:\s*[가-힣]+요일)?)/);
  return match?.[1] || "";
}

function normalizeCandidateFragment(text?: string) {
  return (text || "")
    .toLowerCase()
    .replace(/[^0-9a-zA-Z가-힣]+/g, "")
    .trim();
}

export function getExtractedImageCandidateDuplicateKey(
  candidate: ExtractedImageEntryCandidate,
) {
  return [
    candidate.date,
    candidate.amount,
    candidate.type,
    normalizeCandidateFragment(candidate.merchant || candidate.item),
    normalizeCandidateFragment(candidate.item || candidate.merchant),
  ].join("|");
}

export function getAccountEntryDuplicateKey(
  entry: Pick<AccountEntry, "date" | "amount" | "type" | "merchant" | "item">,
) {
  return [
    entry.date,
    entry.amount,
    entry.type,
    normalizeCandidateFragment(entry.merchant || entry.item),
    normalizeCandidateFragment(entry.item || entry.merchant),
  ].join("|");
}

function scoreCandidateText(text: string) {
  let score = 0;
  if (parseAmountValue(text) > 0) score += 1;
  if (
    /(\d{1,2}\s*월\s*\d{1,2}\s*일)|(\d{4}[-./]\d{1,2}[-./]\d{1,2})/.test(text)
  ) {
    score += 1;
  }
  if (toPaymentValue(text)) score += 1;
  return (score >= 3 ? "high" : score === 2 ? "medium" : "low") as
    | "high"
    | "medium"
    | "low";
}

export function extractImageCandidatesFromText(
  rawText: string,
  context: NaturalParseContext,
) {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter((line) => line.length >= 2)
    .filter((line) => !isOcrNoiseLine(line));

  if (lines.length === 0) return [];
  const candidates: ExtractedImageEntryCandidate[] = [];
  let currentDateLabel = "";
  let currentDate = context.fallbackDate;
  let pendingMerchant = "";
  let pendingLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const dateLabel = extractDateLabel(line);

    if (dateLabel) {
      currentDateLabel = dateLabel;
      currentDate = parseQuickDate(dateLabel, context.fallbackDate);
      pendingMerchant = "";
      pendingLines = [];
      continue;
    }

    if (isInstallmentLine(line)) {
      if (pendingLines.length > 0) {
        pendingLines.push(line);
      }
      continue;
    }

    const amount = parseAmountValue(line);
    if (amount > 0) {
      const nextLine = lines[index + 1] || "";
      const nextNextLine = lines[index + 2] || "";
      const nextLineLooksLikeMerchant =
        Boolean(nextLine) &&
        !extractDateLabel(nextLine) &&
        !isInstallmentLine(nextLine) &&
        parseAmountValue(nextLine) === 0;
      const merchant =
        pendingMerchant ||
        (nextLineLooksLikeMerchant ? nextLine : "") ||
        line
          .replace(
            /-?(?:(?:\d[\d,]*)\s*(?:만|천|백|십)\s*)+(?:\d[\d,]*)?\s*원?/g,
            " ",
          )
          .replace(/(-?\d[\d,]*)\s*원/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      if (!merchant) {
        pendingMerchant = "";
        pendingLines = [];
        continue;
      }
      const memoLine = isInstallmentLine(
        nextLineLooksLikeMerchant ? nextNextLine : nextLine,
      )
        ? nextLineLooksLikeMerchant
          ? nextNextLine
          : nextLine
        : "";
      const rawParts = [
        currentDateLabel,
        ...pendingLines,
        line,
        nextLineLooksLikeMerchant ? nextLine : "",
        memoLine,
      ].filter(Boolean);
      const supportText = rawParts.join(" ");
      const category =
        inferCategoryFromItemText(supportText || merchant) || "생활비";
      const subCategory = inferSubCategoryFromText(category, supportText);

      const candidate: ExtractedImageEntryCandidate = {
        id: `ocr-local-${Date.now()}-${candidates.length}`,
        date: currentDate,
        merchant,
        item: merchant || "미입력",
        amount,
        payment: "card",
        type: "expense",
        category,
        subCategory,
        memo: memoLine,
        rawText: supportText,
        confidence:
          currentDateLabel && merchant && amount > 0
            ? "high"
            : scoreCandidateText(supportText),
      };

      candidates.push(candidate);

      if (nextLineLooksLikeMerchant) {
        index += 1;
      }
      if (memoLine) {
        index += 1;
      }
      pendingMerchant = "";
      pendingLines = [];
      continue;
    }

    pendingMerchant = pendingMerchant ? `${pendingMerchant} ${line}` : line;
    pendingLines = [...pendingLines, line];
  }

  if (candidates.length > 0) {
    return candidates;
  }

  const fallbackText = lines.slice(0, 8).join(" ");
  const fallbackParsed = parseNaturalInputEntry(fallbackText, context);
  if (!fallbackParsed) return [];

  return [
    {
      id: `ocr-local-${Date.now()}-0`,
      date: fallbackParsed.date,
      merchant: fallbackParsed.merchant || "",
      item: fallbackParsed.item || fallbackParsed.merchant || "미입력",
      amount: fallbackParsed.amount,
      payment: fallbackParsed.payment,
      type: fallbackParsed.type,
      category: fallbackParsed.category,
      subCategory: fallbackParsed.subCategory || "",
      memo: fallbackParsed.memo || "",
      rawText: fallbackText,
      confidence: scoreCandidateText(fallbackText),
    },
  ];
}

export function createWorkspaceSeedEntries(
  workspace: AccountBookWorkspace,
  users: AccountBookUser[],
): AccountEntry[] {
  const memberUsers = users.filter((user) =>
    workspace.memberIds.includes(user.id),
  );
  const primaryUser = memberUsers[0] || users[0];
  const secondaryUser = memberUsers[1] || primaryUser;
  const samples = [
    ["2026-02-02", "expense", "생활비", "주말 장보기", 84000, primaryUser],
    ["2026-02-04", "expense", "이동/차량", "카카오 T 주차", 4500, primaryUser],
    ["2026-02-07", "expense", "쇼핑/여가", "생활용품", 32000, secondaryUser],
    ["2026-02-10", "income", INCOME_CATEGORY_LABEL, "월급", 3200000, primaryUser],
    ["2026-02-12", "expense", "생활비", "정기 검진", 58000, primaryUser],
    ["2026-02-14", "expense", "특별/기타", "부모님 선물", 69000, secondaryUser],
    ["2026-02-18", "expense", SAVINGS_CATEGORY_LABEL, "적금 이체", 500000, primaryUser],
    ["2026-02-20", "expense", "이동/차량", "우버 택시", 9200, primaryUser],
  ] as const;

  return samples.map(([date, type, category, item, amount, user], index) => ({
    id: `seed-${workspace.id}-${index}`,
    date,
    member: user.name,
    workspaceId: workspace.id,
    createdByUserId: user.id,
    type,
    category,
    subCategory: category === SAVINGS_CATEGORY_LABEL ? "적금" : "",
    item,
    amount,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: type === "income" ? "cash" : "card",
    memo: "",
  }));
}
