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
export const MEMBER_FALLBACK = "사용자1";
export const ALL_PARTICIPANTS_ID = "all";

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    label: "식비/외식",
    color: "#9b9b9b",
    icon: "🍽️",
    description: "식사, 카페, 편의점 지출",
  },
  {
    label: "병원/의료",
    color: "#bf8a79",
    icon: "🏥",
    description: "병원/약국/검진 관련 비용",
  },
  {
    label: "선물/기타",
    color: "#3c3d41",
    icon: "🎁",
    description: "선물, 이벤트, 기타 지출",
  },
  {
    label: "쇼핑/패션",
    color: "#bf8a79",
    icon: "🛍️",
    description: "의류/잡화/온라인 쇼핑",
  },
  {
    label: "쇼핑/기타",
    color: "#818bd7",
    icon: "📦",
    description: "일반 상품 구매",
  },
  {
    label: "교통/택시",
    color: "#78c99b",
    icon: "🚕",
    description: "택시/이동 서비스 비용",
  },
  {
    label: "여행/관광",
    color: "#68b383",
    icon: "🧳",
    description: "여행/관광/레저 비용",
  },
  {
    label: "주차/교통",
    color: "#dbc85a",
    icon: "🅿️",
    description: "주차장/교통 보조 비용",
  },
  {
    label: "결제/플랫폼",
    color: "#d8c553",
    icon: "💳",
    description: "플랫폼/페이 결제",
  },
  {
    label: "문화/구독",
    color: "#67b182",
    icon: "🎬",
    description: "콘텐츠/문화/구독 결제",
  },
  {
    label: "저축",
    color: "#5d9cec",
    icon: "💰",
    description: "예금/적금/자산 증식성 지출",
  },
  {
    label: "교통카드/충전",
    color: "#e28da8",
    icon: "🚇",
    description: "교통카드 충전/사용",
  },
  {
    label: "통행료",
    color: "#bbd271",
    icon: "🛣️",
    description: "고속도로/유료도로 통행료",
  },
  { label: "약국", color: "#7f86d6", icon: "💊", description: "약국 결제" },
];

const ASSET_SUBCATEGORY_OPTIONS = [
  "예금",
  "적금",
  "주식",
  "ETF",
  "연금",
  "코인",
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

export function toPaymentValue(text: string): PaymentType | null {
  if (text.includes("체크")) return "check_card";
  if (text.includes("현금")) return "cash";
  if (text.includes("카드")) return "card";
  return null;
}

export function inferCategoryFromItemText(text: string) {
  if (!text) return null;
  if (/식당|밥|카페|편의점|마트|치킨|한우|커피/.test(text)) return "식비/외식";
  if (/병원|약국|의원|검사|진료/.test(text)) return "병원/의료";
  if (/택시|우버|카카오 ?t|교통/.test(text)) return "교통/택시";
  if (/주차|주차장/.test(text)) return "주차/교통";
  if (/통행료|하이패스/.test(text)) return "통행료";
  if (/여행|숙소|항공|레저/.test(text)) return "여행/관광";
  if (/선물|이벤트|축의|조의/.test(text)) return "선물/기타";
  if (/적금|예금|주식|etf|연금|코인/.test(text.toLowerCase())) return "저축";
  if (/구독|넷플릭스|유튜브|티빙|멜론|문화/.test(text)) return "문화/구독";
  if (/페이|결제|플랫폼/.test(text)) return "결제/플랫폼";
  if (/옷|신발|가방|패션/.test(text)) return "쇼핑/패션";
  if (/쇼핑|구매|쿠팡|이마트|롯데마트|올리브영/.test(text)) return "쇼핑/기타";
  return null;
}

export function inferAssetSubCategoryFromText(text: string) {
  const lower = text.toLowerCase();
  return (
    ASSET_SUBCATEGORY_OPTIONS.find((option) =>
      lower.includes(option.toLowerCase()),
    ) || ""
  );
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
      .replace(/\d{1,2}[./-]\s*\d{1,2}/g, " ")
      .replace(createKoreanUnitAmountRegex(), " ")
      .replace(/-?\d[\d,]*\s*원?/g, " ")
      .replace(
        /구매했어요|구매했어|구매함|구매|결제했어요|결제했어|결제함|결제|사용했어요|사용했어|사용함|사용|썼어요|썼어|샀어요|샀어|샀다|입금됐어|입금|수입|지출|환급|정산받았어|받았어|받음|월급|급여/g,
        " ",
      )
      .replace(/체크카드|체크|현금|카드|계좌이체|이체|송금/g, " ")
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
  const detailText = [merchant, item].filter(Boolean).join(" ");
  const category =
    inferCategoryFromItemText(detailText || text) ||
    (type === "income" ? "월급" : "쇼핑/기타");
  const subCategory =
    category === "저축" ? inferAssetSubCategoryFromText(text) : "";
  const normalizedItem =
    item || merchant || (type === "income" ? "수입" : "미입력");

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
    cardCompany: CARD_COMPANY_DEFAULT,
    payment,
    memo: "",
    rawText: text,
  };
}

function normalizeOcrLine(text: string) {
  return text
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  if (/(\d{1,2}\s*월\s*\d{1,2}\s*일)|(\d{4}[-./]\d{1,2}[-./]\d{1,2})/.test(text)) {
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
          .replace(/-?(?:(?:\d[\d,]*)\s*(?:만|천|백|십)\s*)+(?:\d[\d,]*)?\s*원?/g, " ")
          .replace(/(-?\d[\d,]*)\s*원/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      if (!merchant) {
        pendingMerchant = "";
        pendingLines = [];
        continue;
      }
      const memoLine =
        isInstallmentLine(nextLineLooksLikeMerchant ? nextNextLine : nextLine)
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
        inferCategoryFromItemText(merchant || supportText) || "쇼핑/기타";
      const subCategory =
        category === "저축" ? inferAssetSubCategoryFromText(supportText) : "";

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
          currentDateLabel && merchant && amount > 0 ? "high" : scoreCandidateText(supportText),
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
    ["2026-02-02", "expense", "식비/외식", "주말 장보기", 84000, primaryUser],
    ["2026-02-04", "expense", "주차/교통", "카카오 T 주차", 4500, primaryUser],
    ["2026-02-07", "expense", "쇼핑/기타", "생활용품", 32000, secondaryUser],
    ["2026-02-10", "income", "월급", "월급", 3200000, primaryUser],
    ["2026-02-12", "expense", "병원/의료", "정기 검진", 58000, primaryUser],
    ["2026-02-14", "expense", "선물/기타", "부모님 선물", 69000, secondaryUser],
    ["2026-02-18", "expense", "저축", "적금 이체", 500000, primaryUser],
    ["2026-02-20", "expense", "교통/택시", "우버 택시", 9200, primaryUser],
  ] as const;

  return samples.map(([date, type, category, item, amount, user], index) => ({
    id: `seed-${workspace.id}-${index}`,
    date,
    member: user.name,
    workspaceId: workspace.id,
    createdByUserId: user.id,
    type,
    category,
    subCategory: category === "저축" ? "적금" : "",
    item,
    amount,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: type === "income" ? "cash" : "card",
    memo: "",
  }));
}
