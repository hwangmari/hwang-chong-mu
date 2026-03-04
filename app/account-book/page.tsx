"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import styled from "styled-components";
import AccountBookLockGate from "./components/AccountBookLockGate";
import CalendarPanel from "./components/CalendarPanel";
import DetailEntriesPanel from "./components/DetailEntriesPanel";
import EntryFormModal from "./components/EntryFormModal";
import MonthlyBoardPanel from "./components/MonthlyBoardPanel";
import TopSummaryControls from "./components/TopSummaryControls";
import WorkspaceHeader from "./components/WorkspaceHeader";
import {
  AccountEntry,
  CategoryOption,
  EntryType,
  PaymentType,
  ViewMode,
} from "./types";

const STORAGE_KEY = "hwang-account-book-v2";
const CARD_COMPANY_DEFAULT = "KB국민카드";
const BASE_DATE = "2026-02-01";
const MEMBER_OPTIONS = ["나", "남편"] as const;
const ASSET_SUBCATEGORY_OPTIONS = [
  "예금",
  "적금",
  "주식",
  "ETF",
  "연금",
  "코인",
] as const;
function mapLegacyCategory(category?: string) {
  if (!category) return "기타";
  if (category === "실적 인정") return "결제/플랫폼";
  if (category === "대형결제/할인") return "쇼핑/기타";
  return category;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
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

const SEEDED_ENTRIES: AccountEntry[] = [
  {
    id: "seed-1",
    date: "2026-02-13",
    type: "expense",
    category: "병원/의료",
    item: "연세가정의원",
    amount: 78000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-2",
    date: "2026-02-15",
    type: "expense",
    category: "문화/구독",
    item: "(주)에스케이플래닛_문화비",
    amount: 15000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-3",
    date: "2026-02-14",
    type: "expense",
    category: "문화/구독",
    item: "(주)에스케이플래닛_문화비",
    amount: 15000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-4",
    date: "2026-02-14",
    type: "expense",
    category: "문화/구독",
    item: "(주)에스케이플래닛_문화비 (취소)",
    amount: -15000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "취소 반영",
  },
  {
    id: "seed-5",
    date: "2026-02-10",
    type: "expense",
    category: "주차/교통",
    item: "카카오 T 주차",
    amount: 2000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-6",
    date: "2026-02-09",
    type: "expense",
    category: "주차/교통",
    item: "카카오 T 주차",
    amount: 1100,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-7",
    date: "2026-02-06",
    type: "expense",
    category: "주차/교통",
    item: "카카오 T 주차",
    amount: 7500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-8",
    date: "2026-02-05",
    type: "expense",
    category: "주차/교통",
    item: "카카오 T 주차",
    amount: 3500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-9",
    date: "2026-02-04",
    type: "expense",
    category: "주차/교통",
    item: "카카오 T 주차",
    amount: 2600,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-10",
    date: "2026-02-03",
    type: "expense",
    category: "주차/교통",
    item: "카카오 T 주차",
    amount: 7500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-11",
    date: "2026-02-09",
    type: "expense",
    category: "선물/기타",
    item: "선물하기_카카오페이",
    amount: 69900,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-12",
    date: "2026-02-02",
    type: "expense",
    category: "쇼핑/기타",
    item: "나이스결제대행(주)",
    amount: 55979,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-13",
    date: "2026-02-15",
    type: "expense",
    category: "쇼핑/기타",
    item: "롯데마트 보틀벙커 서울역점",
    amount: 100,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-14",
    date: "2026-02-09",
    type: "expense",
    category: "결제/플랫폼",
    item: "NICE결제대행",
    amount: 10000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "실적 인정",
  },
  {
    id: "seed-15",
    date: "2026-02-12",
    type: "expense",
    category: "식비/외식",
    item: "고메이494한남(식품)",
    amount: 59000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "실적 인정",
  },
  {
    id: "seed-16",
    date: "2026-02-16",
    type: "expense",
    category: "결제/플랫폼",
    item: "이니시스(일반)",
    amount: 69100,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "실적 인정",
  },
  {
    id: "seed-17",
    date: "2026-02-10",
    type: "expense",
    category: "교통/택시",
    item: "우버택시_법인_4",
    amount: 5400,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-18",
    date: "2026-02-05",
    type: "expense",
    category: "교통/택시",
    item: "우버택시_법인_4",
    amount: 13500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-19",
    date: "2026-02-02",
    type: "expense",
    category: "교통/택시",
    item: "우버택시_0",
    amount: 10100,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-20",
    date: "2026-02-01",
    type: "expense",
    category: "교통/택시",
    item: "우버택시_0",
    amount: 7400,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-21",
    date: "2026-02-01",
    type: "expense",
    category: "교통/택시",
    item: "우버택시_0",
    amount: 5600,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-22",
    date: "2026-02-01",
    type: "expense",
    category: "교통/택시",
    item: "우버택시_0",
    amount: 6300,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-23",
    date: "2026-02-08",
    type: "expense",
    category: "통행료",
    item: "한국도로공사 2건",
    amount: 1500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-24",
    date: "2026-02-08",
    type: "expense",
    category: "통행료",
    item: "강남순환도로 2건",
    amount: 1900,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-25",
    date: "2026-02-04",
    type: "expense",
    category: "교통카드/충전",
    item: "모바일티머니선불형",
    amount: 10000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-26",
    date: "2026-02-01",
    type: "expense",
    category: "식비/외식",
    item: "밀양돼지국밥",
    amount: 47000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-27",
    date: "2026-02-08",
    type: "expense",
    category: "식비/외식",
    item: "셀렉토커피상도두산점",
    amount: 3900,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-28",
    date: "2026-02-11",
    type: "expense",
    category: "식비/외식",
    item: "씨유CU대방서울점",
    amount: 2090,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-29",
    date: "2026-02-01",
    type: "expense",
    category: "식비/외식",
    item: "세븐일레븐부산송도에이스점",
    amount: 2400,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-30",
    date: "2026-02-08",
    type: "expense",
    category: "식비/외식",
    item: "GS25상도트레지움점",
    amount: 29900,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-31",
    date: "2026-02-01",
    type: "expense",
    category: "식비/외식",
    item: "모모스커피",
    amount: 23500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-32",
    date: "2026-02-01",
    type: "expense",
    category: "식비/외식",
    item: "이마트24송도케이블카상부점",
    amount: 2500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-33",
    date: "2026-02-15",
    type: "expense",
    category: "식비/외식",
    item: "이마트24광주중대로점",
    amount: 17900,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-34",
    date: "2026-02-02",
    type: "expense",
    category: "쇼핑/패션",
    item: "세틀뱅크(주)-무신사",
    amount: 63156,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "29cm 포인트사용 -3,324원 표시",
  },
  {
    id: "seed-35",
    date: "2026-02-01",
    type: "expense",
    category: "여행/관광",
    item: "송도해상케이블카",
    amount: 40000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-36",
    date: "2026-02-11",
    type: "expense",
    category: "결제/플랫폼",
    item: "네이버페이",
    amount: 2000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-37",
    date: "2026-02-15",
    type: "expense",
    category: "결제/플랫폼",
    item: "네이버파이낸셜",
    amount: 1000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-38",
    date: "2026-02-14",
    type: "expense",
    category: "결제/플랫폼",
    item: "나이스정보통신(대리점)",
    amount: 19916,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
  {
    id: "seed-39",
    date: "2026-02-15",
    type: "expense",
    category: "쇼핑/기타",
    item: "태원한우",
    amount: 490000,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "이용금액 490,000원 / 온누리상품권 청구할인 490,000원",
  },
  {
    id: "seed-40",
    date: "2026-02-01",
    type: "expense",
    category: "약국",
    item: "새부산약국",
    amount: 2500,
    cardCompany: CARD_COMPANY_DEFAULT,
    payment: "card",
    memo: "",
  },
];

function createEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatSelectedDateTitle(selectedDate: string) {
  if (!selectedDate) return "상세 내역";
  const parsed = parseIsoDate(selectedDate);
  if (!parsed) return "상세 내역";
  if (Number.isNaN(parsed.getTime())) return "상세 내역";
  return `${format(parsed, "M월 d일", { locale: ko })} 상세 내역`;
}

function paymentLabel(payment: PaymentType) {
  if (payment === "cash") return "현금";
  if (payment === "card") return "카드";
  return "체크카드";
}

function toPaymentValue(text: string): PaymentType | null {
  if (text.includes("체크카드")) return "check_card";
  if (text.includes("현금")) return "cash";
  if (text.includes("카드")) return "card";
  return null;
}

function inferCategoryFromItemText(text: string) {
  if (
    text.includes("식당") ||
    text.includes("점심") ||
    text.includes("저녁") ||
    text.includes("카페")
  ) {
    return "식비/외식";
  }
  if (text.includes("쇼핑") || text.includes("무신사") || text.includes("옷")) {
    return "쇼핑/기타";
  }
  if (
    text.includes("차비") ||
    text.includes("택시") ||
    text.includes("우버") ||
    text.includes("버스")
  ) {
    return "교통/택시";
  }
  if (
    text.includes("저축") ||
    text.includes("적금") ||
    text.includes("예금")
  ) {
    return "저축";
  }
  return "";
}

function inferAssetSubCategoryFromText(text: string) {
  const matched = ASSET_SUBCATEGORY_OPTIONS.find((option) =>
    text.toLowerCase().includes(option.toLowerCase()),
  );
  return matched || "";
}

function inferMemberFromText(text: string): "나" | "남편" {
  // 라인 단위 명시(예: "남편 지출", "나 수입")를 최우선으로 해석
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.some((line) => /^남편(\s|$|지출|수입)/.test(line))) return "남편";
  if (lines.some((line) => /^나(\s|$|지출|수입)/.test(line))) return "나";

  // 백업 규칙: 명시 키워드 포함 여부 (한 글자 '나' 오인 방지)
  if (/(^|\s|,)(남편)(\s|,|$|지출|수입)/.test(text)) return "남편";
  if (/(^|\s|,)(나)(\s|,|$|지출|수입)/.test(text)) return "나";

  return "나";
}

function parseQuickDate(text: string, fallbackDate: string) {
  const trimmed = text.trim();
  if (trimmed.includes("오늘")) return toIsoDate(new Date());

  const full = trimmed.match(/(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/);
  if (full) {
    const y = Number(full[1]);
    const m = String(Number(full[2])).padStart(2, "0");
    const d = String(Number(full[3])).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const md = trimmed.match(/(\d{1,2})[.\-/월\s]+(\d{1,2})/);
  if (md) {
    const year = fallbackDate.slice(0, 4);
    const m = String(Number(md[1])).padStart(2, "0");
    const d = String(Number(md[2])).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  return fallbackDate;
}

function normalizeEntry(
  raw: Partial<AccountEntry>,
  fallbackId: string,
): AccountEntry {
  return {
    id: raw.id || fallbackId,
    date: raw.date || BASE_DATE,
    member: raw.member || "나",
    type: raw.type === "income" ? "income" : "expense",
    category: mapLegacyCategory(raw.category),
    subCategory: raw.subCategory || "",
    item: raw.item || raw.memo || "항목명 없음",
    amount: Number(raw.amount) || 0,
    cardCompany: raw.cardCompany || CARD_COMPANY_DEFAULT,
    payment:
      raw.payment === "cash"
        ? "cash"
        : raw.payment === "check_card"
          ? "check_card"
          : "card",
    memo: raw.memo || "",
  };
}

function getSavedEntries(): AccountEntry[] {
  if (typeof window === "undefined") {
    return SEEDED_ENTRIES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEEDED_ENTRIES;
    const parsed = JSON.parse(raw) as Partial<AccountEntry>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEEDED_ENTRIES;
    return parsed.map((entry, index) =>
      normalizeEntry(entry, `saved-${index}`),
    );
  } catch {
    return SEEDED_ENTRIES;
  }
}

export default function AccountBookPage() {
  const [entries, setEntries] = useState<AccountEntry[]>(() =>
    getSavedEntries(),
  );
  const [storageReady, setStorageReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(parseIsoDate(BASE_DATE) ?? new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(BASE_DATE);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedBoardColumnId, setSelectedBoardColumnId] = useState("living");
  const router = useRouter();

  const [type, setType] = useState<EntryType>("expense");
  const [member, setMember] = useState<(typeof MEMBER_OPTIONS)[number]>("나");
  const [category, setCategory] = useState("식비/외식");
  const [subCategory, setSubCategory] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentType>("card");
  const [memo, setMemo] = useState("");
  const [quickInput, setQuickInput] = useState("");

  useEffect(() => {
    // 최초 렌더(서버/클라이언트 공통)는 로딩 UI를 렌더하고,
    // 마운트 이후에 실제 화면을 열어 hydration mismatch를 방지한다.
    const timer = window.setTimeout(() => {
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, storageReady]);

  const monthLabel = format(currentMonth, "M월", { locale: ko });
  const monthRangeLabel = `${format(currentMonth, "M.1", { locale: ko })} - ${format(endOfMonth(currentMonth), "M.d", { locale: ko })}`;

  const monthEntries = useMemo(() => {
    const ym = format(currentMonth, "yyyy-MM");
    return entries.filter((entry) => entry.date.startsWith(ym));
  }, [currentMonth, entries]);

  const selectedYear = format(currentMonth, "yyyy");

  const monthTotals = useMemo(() => {
    return monthEntries.reduce(
      (acc, entry) => {
        if (entry.type === "income") acc.income += entry.amount;
        if (entry.type === "expense" && entry.category.trim() !== "저축") {
          acc.expense += entry.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [monthEntries]);

  const monthPaymentTotals = useMemo(() => {
    return monthEntries.reduce(
      (acc, entry) => {
        if (entry.type === "income") {
          acc.income[entry.payment] += entry.amount;
          return acc;
        }
        if (entry.category.trim() !== "저축") {
          acc.expense[entry.payment] += entry.amount;
        }
        return acc;
      },
      {
        income: { cash: 0, card: 0, check_card: 0 },
        expense: { cash: 0, card: 0, check_card: 0 },
      },
    );
  }, [monthEntries]);

  const monthCashFlowTotals = useMemo(() => {
    return monthEntries.reduce(
      (acc, entry) => {
        if (entry.payment !== "cash") return acc;
        if (entry.type === "income") acc.incomeCash += entry.amount;
        if (entry.type === "expense") acc.expenseCash += entry.amount;
        return acc;
      },
      { incomeCash: 0, expenseCash: 0 },
    );
  }, [monthEntries]);

  const memberExpenseTotals = useMemo(() => {
    const totals = monthEntries
      .filter(
        (entry) =>
          entry.type === "expense" && entry.category.trim() !== "저축",
      )
      .reduce<Record<string, number>>((acc, entry) => {
        const key = entry.member || "나";
        acc[key] = (acc[key] || 0) + entry.amount;
        return acc;
      }, {});

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthEntries]);

  const cashBalance =
    monthCashFlowTotals.incomeCash - monthCashFlowTotals.expenseCash;

  const monthAssetTotal = useMemo(() => {
    return monthEntries
      .filter((entry) => entry.type === "expense")
      .filter((entry) => entry.category.trim() === "저축")
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [monthEntries]);

  const selectedDateEntries = useMemo(() => {
    return entries
      .filter(
        (entry) =>
          !(entry.type === "expense" && entry.category.trim() === "저축"),
      )
      .filter((entry) => entry.date === selectedDate)
      .sort((a, b) => b.amount - a.amount);
  }, [entries, selectedDate]);

  const selectedDateAssetEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.date === selectedDate)
      .filter((entry) => entry.type === "expense")
      .filter((entry) => entry.category.trim() === "저축")
      .sort((a, b) => b.amount - a.amount);
  }, [entries, selectedDate]);

  const daySummary = useMemo(() => {
    return monthEntries.reduce<
      Record<string, { income: number; expense: number }>
    >((acc, entry) => {
      const target = acc[entry.date] || { income: 0, expense: 0 };
      if (entry.type === "income") target.income += entry.amount;
      if (entry.type === "expense") target.expense += entry.amount;
      acc[entry.date] = target;
      return acc;
    }, {});
  }, [monthEntries]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthlyBoardColumns = useMemo(() => {
    const columnDefs = [
      {
        id: "living",
        title: "생활비",
        description: "식비, 의료, 약국, 구독/플랫폼",
        matches: (entry: AccountEntry) =>
          entry.type === "expense" &&
          [
            "식비/외식",
            "병원/의료",
            "약국",
            "문화/구독",
            "결제/플랫폼",
          ].includes(entry.category),
      },
      {
        id: "move",
        title: "이동/차량",
        description: "택시, 주차, 통행료, 교통카드",
        matches: (entry: AccountEntry) =>
          entry.type === "expense" &&
          ["교통/택시", "주차/교통", "통행료", "교통카드/충전"].includes(
            entry.category,
          ),
      },
      {
        id: "shopping",
        title: "쇼핑/여가",
        description: "쇼핑, 여행, 취향 소비",
        matches: (entry: AccountEntry) =>
          entry.type === "expense" &&
          ["쇼핑/패션", "쇼핑/기타", "여행/관광"].includes(entry.category),
      },
      {
        id: "special",
        title: "특별/기타",
        description: "선물, 이벤트, 기타 지출",
        matches: (entry: AccountEntry) =>
          entry.type === "expense" &&
          ["선물/기타"].includes(entry.category),
      },
      {
        id: "asset",
        title: "자산/저축",
        description: "예금, 적금, 투자",
        matches: (entry: AccountEntry) =>
          entry.type === "expense" && entry.category.trim() === "저축",
      },
      {
        id: "income",
        title: "수입",
        description: "입금, 월급, 환급",
        matches: (entry: AccountEntry) => entry.type === "income",
      },
    ];

    const columns: Array<{
      id: string;
      title: string;
      description: string;
      totalAmount: number;
      cards: Array<{
        id: string;
        date: string;
        member: string;
        category: string;
        subCategory: string;
        item: string;
        amount: number;
        paymentLabel: string;
        tone: "income" | "expense" | "asset";
      }>;
    }> = [];

    columnDefs.forEach((columnDef) => {
      const columnEntries = monthEntries
        .filter((entry) => columnDef.matches(entry))
        .sort((a, b) =>
          `${b.date}-${b.amount}`.localeCompare(`${a.date}-${a.amount}`),
        );

      columns.push({
        id: columnDef.id,
        title: columnDef.title,
        description: columnDef.description,
        totalAmount: columnEntries.reduce((sum, entry) => sum + entry.amount, 0),
        cards: columnEntries.map((entry) => ({
          id: entry.id,
          date: entry.date,
          member: entry.member || "나",
          category: entry.category,
          subCategory: entry.subCategory || "",
          item: entry.item,
          amount: entry.amount,
          paymentLabel: paymentLabel(entry.payment),
          tone:
            entry.type === "income"
              ? "income"
              : entry.category.trim() === "저축"
                ? "asset"
                : "expense",
        })),
      });
    });

    return columns;
  }, [monthEntries]);

  const monthlyBoardDetailEntries = useMemo(() => {
    const groups: Record<string, AccountEntry[]> = {
      living: [],
      move: [],
      shopping: [],
      special: [],
      asset: [],
      income: [],
    };

    monthEntries.forEach((entry) => {
      if (entry.type === "income") {
        groups.income.push(entry);
        return;
      }

      if (entry.category.trim() === "저축") {
        groups.asset.push(entry);
        return;
      }

      if (
        ["식비/외식", "병원/의료", "약국", "문화/구독", "결제/플랫폼"].includes(
          entry.category,
        )
      ) {
        groups.living.push(entry);
        return;
      }

      if (
        ["교통/택시", "주차/교통", "통행료", "교통카드/충전"].includes(
          entry.category,
        )
      ) {
        groups.move.push(entry);
        return;
      }

      if (["쇼핑/패션", "쇼핑/기타", "여행/관광"].includes(entry.category)) {
        groups.shopping.push(entry);
        return;
      }

      groups.special.push(entry);
    });

    return Object.fromEntries(
      Object.entries(groups).map(([key, value]) => [
        key,
        value
          .slice()
          .sort((a, b) => `${b.date}-${b.amount}`.localeCompare(`${a.date}-${a.amount}`)),
      ]),
    ) as Record<string, AccountEntry[]>;
  }, [monthEntries]);

  const effectiveBoardColumnId = useMemo(() => {
    if (selectedBoardColumnId in monthlyBoardDetailEntries) {
      return selectedBoardColumnId;
    }
    return monthlyBoardColumns[0]?.id || "living";
  }, [monthlyBoardColumns, monthlyBoardDetailEntries, selectedBoardColumnId]);

  const selectedBoardColumn = useMemo(() => {
    return (
      monthlyBoardColumns.find((column) => column.id === effectiveBoardColumnId) ||
      monthlyBoardColumns[0] ||
      null
    );
  }, [effectiveBoardColumnId, monthlyBoardColumns]);

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingEntryId(null);
    setQuickInput("");
  };

  const openFormModal = ({
    date,
    nextType,
  }: {
    date?: string;
    nextType?: EntryType;
  }) => {
    if (date) setSelectedDate(date);
    setSubCategory("");
    if (nextType) {
      setType(nextType);
      setCategory(nextType === "income" ? "월급" : "식비/외식");
      setSubCategory("");
    }
    setEditingEntryId(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (entry: AccountEntry) => {
    setEditingEntryId(entry.id);
    setSelectedDate(entry.date);
    setType(entry.type);
    setMember((entry.member || "나") as (typeof MEMBER_OPTIONS)[number]);
    setCategory(entry.category);
    setSubCategory(entry.subCategory || "");
    setItem(entry.item);
    setAmount(String(entry.amount));
    setPayment(entry.payment);
    setMemo(entry.memo);
    setIsFormModalOpen(true);
  };

  const onMonthMove = (diff: number) => {
    const next = startOfMonth(addMonths(currentMonth, diff));
    setCurrentMonth(next);
    setSelectedDate(toIsoDate(next));
  };

  const onSubmitEntry = () => {
    const parsedAmount = Number(amount);

    if (!category.trim()) {
      alert("카테고리를 입력해주세요.");
      return;
    }

    if (!item.trim()) {
      alert("항목(가맹점)을 입력해주세요.");
      return;
    }

    if (type === "expense" && category.trim() === "저축" && !subCategory.trim()) {
      alert("저축 세부카테고리를 입력해주세요.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      alert("금액은 0이 아닌 숫자로 입력해주세요.");
      return;
    }

    const payload = {
      date: selectedDate,
      member,
      type,
      category: category.trim(),
      subCategory: type === "expense" && category.trim() === "저축" ? subCategory.trim() : "",
      item: item.trim(),
      amount: Math.trunc(parsedAmount),
      cardCompany: CARD_COMPANY_DEFAULT,
      payment: type === "income" ? ("cash" as const) : payment,
      memo: memo.trim(),
    };

    if (editingEntryId) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntryId
            ? {
                ...entry,
                ...payload,
              }
            : entry,
        ),
      );
    } else {
      const newEntry: AccountEntry = {
        id: createEntryId(),
        ...payload,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }

    setItem("");
    setAmount("");
    setMemo("");
    setSubCategory("");
    closeFormModal();
  };

  const onDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const onLoadSeed = () => {
    setEntries(SEEDED_ENTRIES);
    setCurrentMonth(startOfMonth(parseIsoDate(BASE_DATE) ?? new Date()));
    setSelectedDate(BASE_DATE);
  };

  const applyQuickInput = () => {
    const text = quickInput.trim();
    if (!text) {
      alert("텍스트를 입력해주세요.");
      return;
    }

    const defaultType: EntryType = text.includes("수입") ? "income" : "expense";
    const defaultMember = inferMemberFromText(text);
    const defaultDate = parseQuickDate(text, selectedDate);
    const defaultPayment =
      defaultType === "income" ? "cash" : toPaymentValue(text) || "card";
    const defaultCategory =
      CATEGORY_OPTIONS.find((option) => text.includes(option.label))?.label ||
      (defaultType === "income" ? "월급" : "식비/외식");

    const rawLines = text
      .split(/\r?\n/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const segments = rawLines
      .flatMap((line) =>
        line
          // 항목 구분용 쉼표만 분리 (천단위 7,400 같은 숫자 콤마는 유지)
          .split(/,(?=\s*[^\d])/)
          .map((piece) => piece.trim())
          .filter(Boolean),
      )
      .filter(Boolean);

    const removable = [
      "수입",
      "지출",
      "현금",
      "카드",
      "체크카드",
      "오늘",
      ...MEMBER_OPTIONS,
      ...CATEGORY_OPTIONS.map((option) => option.label),
    ];

    const context = {
      member: defaultMember as (typeof MEMBER_OPTIONS)[number],
      type: defaultType as EntryType,
      date: defaultDate,
      payment: defaultPayment as PaymentType,
      category: defaultCategory,
    };

    const parseSegment = (rawSegment: string) => {
      const line = rawSegment.trim();
      if (!line) return null;

      // 문장(행) 내 컨텍스트 전환: 남편/나, 수입/지출, 날짜, 세부항목, 카테고리
      if (/(^|\s|,)(남편)(\s|,|$|지출|수입)/.test(line)) {
        context.member = "남편";
      } else if (/(^|\s|,)(나)(\s|,|$|지출|수입)/.test(line)) {
        context.member = "나";
      }

      if (line.includes("수입")) {
        context.type = "income";
      } else if (line.includes("지출")) {
        context.type = "expense";
      }

      const hasDateHint =
        /^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(line) ||
        /(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/.test(line) ||
        /(\d{1,2})[.\-/월\s]+(\d{1,2})/.test(line) ||
        line.includes("오늘");
      if (hasDateHint) {
        context.date = parseQuickDate(line, context.date);
      }

      if (context.type === "income") {
        context.payment = "cash";
      } else {
        context.payment = toPaymentValue(line) || context.payment;
      }

      const explicitCategory = CATEGORY_OPTIONS.find((option) =>
        line.includes(option.label),
      )?.label;
      if (explicitCategory) {
        context.category = explicitCategory;
      }

      // 날짜 라인(예: 2026-02-01)은 항목으로 보지 않음
      if (
        /^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(line) ||
        /^(남편|나)\s*(지출|수입)?$/.test(line) ||
        /^(지출|수입)$/.test(line)
      ) {
        return null;
      }

      const wonMatch = line.match(/(-?\d[\d,]*)\s*원/);
      let parsedAmount = wonMatch ? Number(wonMatch[1].replace(/,/g, "")) : 0;

      // "식당 30000"처럼 '원'이 없는 경우를 위한 보정
      if (!parsedAmount) {
        const numericTokens = Array.from(line.matchAll(/-?\d[\d,]*/g))
          .map((match) => match[0].replace(/,/g, ""))
          .filter((token) => token.length >= 3); // 01, 02 같은 날짜 토큰 제외
        const candidate = numericTokens[numericTokens.length - 1];
        if (candidate) parsedAmount = Number(candidate);
      }

      if (!Number.isFinite(parsedAmount) || parsedAmount === 0) return null;

      let parsedItem = line;
      removable.forEach((token) => {
        parsedItem = parsedItem.replaceAll(token, " ");
      });
      parsedItem = parsedItem.replace(
        /(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/g,
        " ",
      );
      parsedItem = parsedItem.replace(/(\d{1,2})[.\-/월\s]+(\d{1,2})/g, " ");
      parsedItem = parsedItem.replace(/-?\d[\d,]*\s*원?/g, " ");
      parsedItem = parsedItem.replace(/\s+/g, " ").trim();

      const segmentCategory =
        explicitCategory ||
        inferCategoryFromItemText(parsedItem) ||
        context.category;
      const segmentSubCategory =
        segmentCategory === "저축"
          ? inferAssetSubCategoryFromText(line) ||
            inferAssetSubCategoryFromText(parsedItem)
          : "";

      return {
        member: context.member,
        type: context.type,
        date: context.date,
        payment:
          context.type === "income" ? ("cash" as const) : context.payment,
        item: parsedItem || "미입력",
        amount: parsedAmount,
        category: segmentCategory,
        subCategory: segmentSubCategory,
      };
    };

    const parsedSegments = segments.map(parseSegment).filter(Boolean) as Array<{
      member: (typeof MEMBER_OPTIONS)[number];
      type: EntryType;
      date: string;
      payment: PaymentType;
      item: string;
      amount: number;
      category: string;
      subCategory: string;
    }>;

    setType(defaultType);
    setMember(defaultMember);
    setSelectedDate(defaultDate);
    setPayment(defaultPayment);

    if (parsedSegments.length >= 2) {
      const newEntries: AccountEntry[] = parsedSegments.map((segment) => ({
        id: createEntryId(),
        date: segment.date,
        member: segment.member,
        type: segment.type,
        category: segment.category,
        item: segment.item,
        amount: segment.amount,
        subCategory: segment.subCategory,
        cardCompany: CARD_COMPANY_DEFAULT,
        payment: segment.type === "income" ? "cash" : segment.payment,
        memo: "",
      }));
      setEntries((prev) => [...newEntries, ...prev]);
      setQuickInput("");
      alert(`${newEntries.length}건을 한 번에 추가했어요.`);
      // 다건 추가 후에도 팝업을 유지해 연속 입력 가능하게 한다.
      return;
    }

    const first = parsedSegments[0];
    if (first) {
      setType(first.type);
      setMember(first.member);
      setSelectedDate(first.date);
      setPayment(first.type === "income" ? "cash" : first.payment);
      setCategory(first.category);
      setSubCategory(first.subCategory || "");
      setAmount(String(first.amount));
      setItem(first.item);
      return;
    }

    alert(
      "입력 포맷을 인식하지 못했어요. 예: 남편 지출 식당 30000, 쇼핑 20000",
    );
    setCategory(defaultCategory);
    if (defaultCategory !== "저축") setSubCategory("");
  };

  if (!storageReady) {
    return (
      <StPage>
        <WorkspaceHeader
          title="가계부 캘린더"
          monthLabel={monthLabel}
          monthRangeLabel={monthRangeLabel}
          showActions={false}
          onMonthMove={onMonthMove}
        />
        <StContentWrap>
          <StLoadingCard>가계부 데이터를 불러오는 중...</StLoadingCard>
        </StContentWrap>
      </StPage>
    );
  }

  return (
    <AccountBookLockGate>
      <StPage>
        <WorkspaceHeader
          title={`${format(currentMonth, "yyyy년 M월", { locale: ko })} 가계부`}
          monthLabel={monthLabel}
          monthRangeLabel={monthRangeLabel}
          onMonthMove={onMonthMove}
          onLoadSeed={onLoadSeed}
        />
        <StContentWrap>
          <StViewModeSwitch aria-label="가계부 화면 전환">
            <StViewModeButton
              type="button"
              $active={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
            >
              캘린더
            </StViewModeButton>
            <StViewModeButton
              type="button"
              $active={viewMode === "board"}
              onClick={() => setViewMode("board")}
            >
              보드
            </StViewModeButton>
          </StViewModeSwitch>

          <StCalendarSplit>
            <StLeftSplitCard>
              <TopSummaryControls
                monthTotals={monthTotals}
                monthPaymentTotals={monthPaymentTotals}
                cashBalance={cashBalance}
                assetTotal={monthAssetTotal}
                memberExpenseTotals={memberExpenseTotals}
                onOpenIncomeYearly={() =>
                  router.push(
                    `/account-book/annual?kind=income&year=${selectedYear}`,
                  )
                }
                onOpenExpenseYearly={() =>
                  router.push(
                    `/account-book/annual?kind=expense&year=${selectedYear}`,
                  )
                }
                onOpenAssetYearly={() =>
                  router.push(
                    `/account-book/annual?kind=asset&year=${selectedYear}`,
                  )
                }
                formatAmount={formatAmount}
              />

              <StLeftBody>
                {viewMode === "board" ? (
                  <MonthlyBoardPanel
                    monthLabel={format(currentMonth, "yyyy년 M월", {
                      locale: ko,
                    })}
                    columns={monthlyBoardColumns}
                    selectedColumnId={effectiveBoardColumnId}
                    formatAmount={formatAmount}
                    onSelectColumn={setSelectedBoardColumnId}
                  />
                ) : (
                  <CalendarPanel
                    currentMonth={currentMonth}
                    calendarDays={calendarDays}
                    daySummary={daySummary}
                    selectedDate={selectedDate}
                    toIsoDate={toIsoDate}
                    onSelectDate={setSelectedDate}
                  />
                )}
              </StLeftBody>
            </StLeftSplitCard>

            <StRightSplitCard>
              {viewMode === "board" ? (
                <DetailEntriesPanel
                  title={
                    selectedBoardColumn
                      ? `${format(currentMonth, "M월", { locale: ko })} ${selectedBoardColumn.title} 상세`
                      : "보드 상세"
                  }
                  entries={monthlyBoardDetailEntries[effectiveBoardColumnId] || []}
                  onOpenAdd={() => openFormModal({ date: selectedDate })}
                  onEdit={openEditModal}
                  onDelete={onDeleteEntry}
                  formatAmount={formatAmount}
                  paymentLabel={paymentLabel}
                  showDateMeta
                />
              ) : (
                <DetailEntriesPanel
                  title={formatSelectedDateTitle(selectedDate)}
                  entries={selectedDateEntries}
                  assetEntries={selectedDateAssetEntries}
                  onOpenAdd={() => openFormModal({ date: selectedDate })}
                  onEdit={openEditModal}
                  onDelete={onDeleteEntry}
                  formatAmount={formatAmount}
                  paymentLabel={paymentLabel}
                />
              )}
            </StRightSplitCard>
          </StCalendarSplit>
        </StContentWrap>

        <EntryFormModal
          isOpen={isFormModalOpen}
          isEditing={Boolean(editingEntryId)}
          selectedDate={selectedDate}
          member={member}
          memberOptions={MEMBER_OPTIONS as unknown as string[]}
          type={type}
          category={category}
          subCategory={subCategory}
          item={item}
          amount={amount}
          payment={payment}
          memo={memo}
          quickInput={quickInput}
          categoryOptions={CATEGORY_OPTIONS}
          onClose={closeFormModal}
          onSetDate={setSelectedDate}
          onSetType={(nextType) => {
            setType(nextType);
            if (nextType === "income" && category === "식비/외식")
              setCategory("월급");
            if (nextType === "expense" && category === "월급")
              setCategory("식비/외식");
            if (nextType !== "expense") setSubCategory("");
            if (nextType === "income") setPayment("cash");
          }}
          onSetMember={(nextMember) =>
            setMember(nextMember as (typeof MEMBER_OPTIONS)[number])
          }
          onSetCategory={(nextCategory) => {
            setCategory(nextCategory);
            if (nextCategory !== "저축") setSubCategory("");
          }}
          onSetSubCategory={setSubCategory}
          onSetItem={setItem}
          onSetAmount={setAmount}
          onSetPayment={setPayment}
          onSetMemo={setMemo}
          onSetQuickInput={setQuickInput}
          onApplyQuickInput={applyQuickInput}
          onSubmit={onSubmitEntry}
        />
      </StPage>
    </AccountBookLockGate>
  );
}

const StPage = styled.main`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 200;
  min-height: 100vh;
  background: #f3f5f7;
  @media (max-width: 720px) {
    position: relative;
    min-height: auto;
  }
`;

const StContentWrap = styled.div`
  width: 100%;
  max-width: none;
  margin: 0;
  height: calc(100vh - 3.5rem - 72px);
  padding: 0.85rem;
  @media (max-width: 720px) {
    height: auto;
    padding: 0.55rem;
  }
`;

const StViewModeSwitch = styled.div`
  width: fit-content;
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  margin-bottom: 0.8rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #d8e2ec;
  box-shadow: 0 6px 18px rgba(31, 41, 55, 0.06);
`;

const StViewModeButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.95rem;
  font-size: 0.86rem;
  font-weight: 800;
  color: ${({ $active }) => ($active ? "#ffffff" : "#637083")};
  background: ${({ $active }) =>
    $active ? "linear-gradient(135deg, #6d87ef, #4f69d2)" : "transparent"};
  box-shadow: ${({ $active }) =>
    $active ? "0 8px 18px rgba(79, 105, 210, 0.24)" : "none"};
`;

const StLoadingCard = styled.section`
  background: #ffffff;
  border: 1px solid #dde3ea;
  border-radius: 12px;
  padding: 1.2rem;
  color: #6b7280;
  font-size: 0.95rem;
  min-height: 140px;
`;

const StCalendarSplit = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;

  @media (min-width: 721px) {
    grid-template-columns: 7fr 3fr;
    align-items: start;
    height: 100%;
    overflow: hidden;
  }
`;

const StLeftSplitCard = styled.section`
  background: #ffffff;
  border: 1px solid #dde3ea;
  border-radius: 12px;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const StLeftBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.2rem;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
`;

const StRightSplitCard = styled.section`
  background: #ffffff;
  border: 1px solid #dde3ea;
  border-radius: 12px;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
