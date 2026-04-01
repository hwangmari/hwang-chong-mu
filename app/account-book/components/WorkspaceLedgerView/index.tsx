"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  AccountEntry,
  EntryType,
  PaymentType,
  ResolvedAccountEntry,
  ViewMode,
} from "../../types";
import type {
  ExtractedImageEntryCandidate,
  WorkspaceLedgerViewProps,
} from "./types";
import EntryFormModal from "../EntryFormModal";
import WorkspaceHeader from "../WorkspaceHeader";
import NaturalInputSection from "./NaturalInputSection";
import ViewModeTabs from "./ViewModeTabs";
import WorkspacePanelsSection from "./WorkspacePanelsSection";
import {
  ALL_PARTICIPANTS_ID,
  CARD_COMPANY_OPTIONS,
  CARD_COMPANY_DEFAULT,
  CATEGORY_OPTIONS,
  INCOME_CATEGORY_LABEL,
  INCOME_CATEGORY_OPTIONS,
  MEMBER_FALLBACK,
  createEntryId,
  extractImageCandidatesFromText,
  formatAmount,
  formatPreviewDate,
  formatSelectedDateTitle,
  getAccountEntryDuplicateKey,
  getCategoryDetailOptions,
  getRepresentativeCategory,
  getRepresentativeExpenseCategory,
  inferCardCompanyFromText,
  inferCategoryFromItemText,
  inferSubCategoryFromText,
  isCardSettlementEntry,
  isFixedExpenseCategory,
  isSavingsCategory,
  normalizeExpenseCategorySelection,
  parseAmountValue,
  parseIsoDate,
  parseNaturalInputEntry,
  parseQuickDate,
  paymentLabel,
  toIsoDate,
  toPaymentValue,
} from "./utils";

const FIXED_EXPENSE_CATEGORIES = ["고정비"] as const;
const DEFAULT_ANNUAL_SAVING_GOAL = 1_200_000;
const FIXED_EXPENSE_STORAGE_PREFIX = "hwang-account-book-fixed-expense";

type FixedExpenseTemplate = {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  member: string;
  merchant: string;
  item: string;
  amount: number;
  payment: PaymentType;
  cardCompany: string;
  memo: string;
  subCategory: string;
  dayOfMonth: number;
  startDate: string;
};

function getListMemoStorageKey(workspaceId: string, monthKey: string) {
  return `hwang-account-book-list-memo-${workspaceId}-${monthKey}`;
}

function getFixedExpenseStorageKey(workspaceId: string) {
  return `${FIXED_EXPENSE_STORAGE_PREFIX}-${workspaceId}`;
}

function createFixedExpenseTemplateId() {
  return `fixed-${Math.random().toString(36).slice(2, 10)}`;
}

function extractFixedExpenseTemplateId(rawText?: string) {
  const match = rawText?.match(/#fixed-template:([a-z0-9-]+)/i);
  return match?.[1] || null;
}

function stripFixedExpenseMeta(rawText?: string) {
  return (rawText || "")
    .replace(/\s*#fixed-template:[a-z0-9-]+\s*/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function attachFixedExpenseMeta(rawText: string, templateId: string) {
  const baseText = stripFixedExpenseMeta(rawText);
  return [baseText, `#fixed-template:${templateId}`].filter(Boolean).join("\n");
}

function resolveEntryItemLabel(params: {
  type: EntryType;
  category: string;
  subCategory: string;
  merchant: string;
  item: string;
  memo: string;
}) {
  return (
    params.item.trim() ||
    params.merchant.trim() ||
    params.memo.trim() ||
    params.subCategory.trim() ||
    params.category.trim() ||
    (params.type === "income" ? "수입" : "지출")
  );
}

function readFixedExpenseTemplates(
  workspaceId: string,
): FixedExpenseTemplate[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      getFixedExpenseStorageKey(workspaceId),
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FixedExpenseTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFixedExpenseTemplates(
  workspaceId: string,
  templates: FixedExpenseTemplate[],
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getFixedExpenseStorageKey(workspaceId),
    JSON.stringify(templates),
  );
}

function buildFixedExpenseTemplate(
  entry: AccountEntry,
  templateId: string,
): FixedExpenseTemplate {
  const parsedDate = parseIsoDate(entry.date) || new Date();
  return {
    id: templateId,
    workspaceId: entry.workspaceId,
    createdByUserId: entry.createdByUserId,
    member: entry.member || "",
    merchant: entry.merchant || "",
    item: entry.item,
    amount: entry.amount,
    payment: entry.payment,
    cardCompany: entry.cardCompany,
    memo: entry.memo,
    subCategory: entry.subCategory || "",
    dayOfMonth: parsedDate.getDate(),
    startDate: entry.date,
  };
}

function buildFixedExpenseEntry(
  template: FixedExpenseTemplate,
  year: number,
  monthIndex: number,
): AccountEntry {
  const monthStart = new Date(year, monthIndex, 1);
  const maxDay = endOfMonth(monthStart).getDate();
  const date = new Date(
    year,
    monthIndex,
    Math.min(template.dayOfMonth, maxDay),
  );

  return {
    id: createEntryId(),
    date: toIsoDate(date),
    member: template.member,
    workspaceId: template.workspaceId,
    createdByUserId: template.createdByUserId,
    type: "expense",
    category: "고정비",
    subCategory: template.subCategory,
    merchant: template.merchant,
    item: template.item,
    amount: template.amount,
    cardCompany: template.payment === "cash" ? "" : template.cardCompany,
    payment: template.payment,
    memo: template.memo,
    rawText: attachFixedExpenseMeta("", template.id),
  };
}

function compareResolvedEntriesDesc(
  a: ResolvedAccountEntry,
  b: ResolvedAccountEntry,
) {
  return `${b.date}-${String(b.amount).padStart(12, "0")}-${b.id}`.localeCompare(
    `${a.date}-${String(a.amount).padStart(12, "0")}-${a.id}`,
  );
}

export default function WorkspaceLedgerView({
  workspace,
  users,
  currentUserId,
  entries,
  shareTargets,
  isEntryShared,
  onToggleShare,
  onSaveEntry,
  onDeleteEntry,
  onChangeAnnualSavingGoal,
  onBack,
  initialViewMode = "calendar",
}: WorkspaceLedgerViewProps) {
  const router = useRouter();
  const initialDate = toIsoDate(new Date());
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(parseIsoDate(initialDate) || new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<"natural" | "image">(
    "natural",
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedLedgerCardId, setSelectedLedgerCardId] = useState<
    string | null
  >(null);
  const [annualSavingGoal, setAnnualSavingGoal] = useState(
    DEFAULT_ANNUAL_SAVING_GOAL,
  );
  const [listMemo, setListMemo] = useState("");
  const [listMemoDraft, setListMemoDraft] = useState("");
  const [isListMemoEditing, setIsListMemoEditing] = useState(true);
  const [fixedExpenseTemplates, setFixedExpenseTemplates] = useState<
    FixedExpenseTemplate[]
  >([]);
  const fixedExpenseSyncRef = useRef<Set<string>>(new Set());

  const memberUsers = useMemo(
    () => users.filter((user) => workspace.memberIds.includes(user.id)),
    [users, workspace.memberIds],
  );
  const memberNames = memberUsers.map((user) => user.name);
  const defaultMember = memberNames[0] || MEMBER_FALLBACK;
  const [selectedParticipantId] = useState(
    workspace.type === "shared"
      ? ALL_PARTICIPANTS_ID
      : memberUsers[0]?.id || ALL_PARTICIPANTS_ID,
  );
  const [type, setType] = useState<EntryType>("expense");
  const [member, setMember] = useState(defaultMember);
  const [category, setCategory] = useState("생활비");
  const [subCategory, setSubCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentType>("card");
  const [cardCompany, setCardCompany] = useState(CARD_COMPANY_DEFAULT);
  const [memo, setMemo] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [naturalInput, setNaturalInput] = useState("");
  const [draftRawText, setDraftRawText] = useState("");
  const [ocrFileName, setOcrFileName] = useState("");
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [shareConfirmState, setShareConfirmState] = useState<{
    entryId: string;
    targetWorkspaceId: string;
    targetWorkspaceName: string;
  } | null>(null);
  const [extractedImageEntries, setExtractedImageEntries] = useState<
    ExtractedImageEntryCandidate[]
  >([]);

  const monthLabel = format(currentMonth, "M월", { locale: ko });
  const monthValue = format(currentMonth, "yyyy-MM");
  const currentMonthKey = format(currentMonth, "yyyy-MM");
  const monthRangeLabel = `${format(currentMonth, "M.1", { locale: ko })} - ${format(endOfMonth(currentMonth), "M.d", { locale: ko })}`;
  const selectedYear = format(currentMonth, "yyyy");
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();
  const monthlySavingGoal = Math.round(annualSavingGoal / 12);
  const isSharedWorkspace = workspace.type === "shared";
  const selectedParticipant = useMemo(
    () => memberUsers.find((user) => user.id === selectedParticipantId) || null,
    [memberUsers, selectedParticipantId],
  );
  const selectedParticipantLabel = isSharedWorkspace
    ? selectedParticipant?.name || ""
    : selectedParticipant?.name || workspace.name;
  const workspaceKindLabel =
    workspace.type === "personal" ? "개인 가계부" : "공용 가계부방";
  const normalizedWorkspaceName = workspace.name.replace(/\s+/g, " ").trim();
  const workspaceTitle =
    normalizedWorkspaceName.includes(workspaceKindLabel) ||
    workspaceKindLabel.startsWith(normalizedWorkspaceName)
      ? workspaceKindLabel
      : `${workspace.name} ${workspaceKindLabel}`;
  const workspaceSubtitle = isSharedWorkspace
    ? `멤버 ${memberUsers.map((user) => user.name).join(", ") || "미설정"}`
    : `멤버 ${selectedParticipantLabel || memberUsers[0]?.name || "미설정"}`;
  const workspaceInfoText =
    workspace.type === "personal"
      ? "공용방에서 내가 직접 쓴 내역은 이 화면에 자동 반영됩니다."
      : "공용방은 참가자별 내역을 함께 보고 비교하는 기준 화면입니다.";
  const calendarDetailTitle = isSharedWorkspace
    ? formatSelectedDateTitle(selectedDate)
    : `${formatSelectedDateTitle(selectedDate)} · ${selectedParticipantLabel}`;

  const entriesWithPermissions = useMemo(
    () =>
      entries.map((entry) => {
        if (
          workspace.type === "shared" &&
          entry.source === "direct" &&
          entry.createdByUserId !== currentUserId
        ) {
          return {
            ...entry,
            readonly: true,
          };
        }

        return entry;
      }),
    [currentUserId, entries, workspace.type],
  );

  const visibleEntries = useMemo(() => {
    if (!isSharedWorkspace || selectedParticipantId === ALL_PARTICIPANTS_ID) {
      return entriesWithPermissions;
    }

    const participantName = selectedParticipant?.name;
    return entriesWithPermissions.filter(
      (entry) =>
        entry.createdByUserId === selectedParticipantId ||
        (participantName ? entry.member === participantName : false),
    );
  }, [
    entriesWithPermissions,
    isSharedWorkspace,
    selectedParticipant,
    selectedParticipantId,
  ]);

  const monthEntries = useMemo(() => {
    const ym = format(currentMonth, "yyyy-MM");
    return visibleEntries.filter((entry) => entry.date.startsWith(ym));
  }, [currentMonth, visibleEntries]);
  const displayMonthEntries = useMemo(
    () => monthEntries.filter((entry) => !isCardSettlementEntry(entry)),
    [monthEntries],
  );

  const monthTotals = useMemo(() => {
    return monthEntries.reduce(
      (acc, entry) => {
        if (entry.type === "income") acc.income += entry.amount;
        if (
          entry.type === "expense" &&
          !isSavingsCategory(entry.category) &&
          !isCardSettlementEntry(entry)
        ) {
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
        if (
          entry.type === "expense" &&
          !isSavingsCategory(entry.category) &&
          !isCardSettlementEntry(entry)
        ) {
          acc[entry.payment] += entry.amount;
        }
        return acc;
      },
      { cash: 0, card: 0, check_card: 0 },
    );
  }, [monthEntries]);

  const cashBalance = useMemo(() => {
    return monthEntries.reduce((sum, entry) => {
      if (entry.payment !== "cash" || isCardSettlementEntry(entry)) {
        return sum;
      }

      if (entry.type === "income") {
        return sum + entry.amount;
      }

      return sum - entry.amount;
    }, 0);
  }, [monthEntries]);

  const memberExpenseTotals = useMemo(() => {
    const totals = monthEntries
      .filter(
        (entry) =>
          entry.type === "expense" &&
          !isSavingsCategory(entry.category) &&
          !isCardSettlementEntry(entry),
      )
      .reduce<Record<string, number>>((acc, entry) => {
        const key = entry.member || defaultMember;
        acc[key] = (acc[key] || 0) + entry.amount;
        return acc;
      }, {});

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [defaultMember, monthEntries]);

  const monthAssetTotal = useMemo(() => {
    return monthEntries
      .filter((entry) => entry.type === "expense")
      .filter((entry) => isSavingsCategory(entry.category))
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [monthEntries]);

  const monthCategorySummary = useMemo(() => {
    return Object.entries(
      monthEntries.reduce<Record<string, number>>((acc, entry) => {
        if (entry.type === "expense" && isCardSettlementEntry(entry)) {
          return acc;
        }
        const key =
          entry.type === "income"
            ? INCOME_CATEGORY_LABEL
            : isSavingsCategory(entry.category)
              ? "자산/저축"
              : getRepresentativeExpenseCategory(entry.category);
        acc[key] = (acc[key] || 0) + entry.amount;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [monthEntries]);

  const dashboardRows = useMemo(() => {
    let cumulativeSavings = 0;

    return Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      const monthKey = `${selectedYear}-${String(monthNumber).padStart(2, "0")}`;
      const rows = visibleEntries.filter((entry) =>
        entry.date.startsWith(monthKey),
      );
      const income = rows
        .filter((entry) => entry.type === "income")
        .reduce((sum, entry) => sum + entry.amount, 0);
      const regularSavings = rows
        .filter(
          (entry) => entry.type === "expense" && isSavingsCategory(entry.category),
        )
        .reduce((sum, entry) => sum + entry.amount, 0);
      const fixedExpense = rows
        .filter(
          (entry) =>
            entry.type === "expense" &&
            !isCardSettlementEntry(entry) &&
            FIXED_EXPENSE_CATEGORIES.includes(
              getRepresentativeExpenseCategory(
                entry.category,
              ) as (typeof FIXED_EXPENSE_CATEGORIES)[number],
            ),
        )
        .reduce((sum, entry) => sum + entry.amount, 0);
      const consumptionExpense = rows
        .filter(
          (entry) =>
            entry.type === "expense" &&
            !isCardSettlementEntry(entry) &&
            !isSavingsCategory(entry.category) &&
            !FIXED_EXPENSE_CATEGORIES.includes(
              getRepresentativeExpenseCategory(
                entry.category,
              ) as (typeof FIXED_EXPENSE_CATEGORIES)[number],
            ),
        )
        .reduce((sum, entry) => sum + entry.amount, 0);
      const totalExpense = fixedExpense + consumptionExpense + regularSavings;
      const netAmount = income - totalExpense;
      const actualSavings = netAmount + regularSavings;
      cumulativeSavings += actualSavings;

      return {
        monthNumber,
        monthLabel: `${monthNumber}월`,
        income,
        totalExpense,
        fixedExpense,
        consumptionExpense,
        regularSavings,
        netAmount,
        actualSavings,
        savingsRate: income > 0 ? (actualSavings / income) * 100 : null,
        cumulativeSavings,
        goalAmount: monthlySavingGoal * monthNumber,
        achievementRate:
          annualSavingGoal > 0
            ? (cumulativeSavings / annualSavingGoal) * 100
            : null,
      };
    });
  }, [annualSavingGoal, monthlySavingGoal, selectedYear, visibleEntries]);

  useEffect(() => {
    const nextGoal =
      Number.isFinite(Number(workspace.annualSavingGoal)) &&
      Number(workspace.annualSavingGoal) > 0
        ? Math.trunc(Number(workspace.annualSavingGoal))
        : DEFAULT_ANNUAL_SAVING_GOAL;
    setAnnualSavingGoal(nextGoal);
  }, [workspace.annualSavingGoal, workspace.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMemo = window.localStorage.getItem(
      getListMemoStorageKey(workspace.id, currentMonthKey),
    );
    const nextMemo = storedMemo || "";
    setListMemo(nextMemo);
    setListMemoDraft(nextMemo);
    setIsListMemoEditing(nextMemo.length === 0);
  }, [currentMonthKey, workspace.id]);

  useEffect(() => {
    setFixedExpenseTemplates(readFixedExpenseTemplates(workspace.id));
    fixedExpenseSyncRef.current.clear();
  }, [workspace.id]);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode, workspace.id]);

  useEffect(() => {
    setSelectedLedgerCardId(null);
  }, [workspace.id]);

  useEffect(() => {
    if (fixedExpenseTemplates.length === 0) return;

    const directWorkspaceEntries = entries.filter((entry) => !entry.readonly);
    const targetMonth = startOfMonth(currentMonth);
    let cancelled = false;

    const syncFixedExpenses = async () => {
      const pendingEntries: AccountEntry[] = [];

      for (const template of fixedExpenseTemplates) {
        const startMonth = startOfMonth(
          parseIsoDate(template.startDate) || targetMonth,
        );

        if (startMonth > targetMonth) {
          continue;
        }

        let cursor = startMonth;
        while (cursor <= targetMonth) {
          const monthKey = format(cursor, "yyyy-MM");
          const syncKey = `${template.id}-${monthKey}`;
          const alreadyExists = directWorkspaceEntries.some(
            (entry) =>
              isFixedExpenseCategory(entry.category) &&
              entry.date.startsWith(monthKey) &&
              extractFixedExpenseTemplateId(entry.rawText) === template.id,
          );

          if (!alreadyExists && !fixedExpenseSyncRef.current.has(syncKey)) {
            fixedExpenseSyncRef.current.add(syncKey);
            pendingEntries.push(
              buildFixedExpenseEntry(
                template,
                cursor.getFullYear(),
                cursor.getMonth(),
              ),
            );
          }

          cursor = startOfMonth(addMonths(cursor, 1));
        }
      }

      for (const entry of pendingEntries) {
        if (cancelled) return;
        await Promise.resolve(onSaveEntry(entry));
      }
    };

    void syncFixedExpenses();

    return () => {
      cancelled = true;
    };
  }, [currentMonth, entries, fixedExpenseTemplates, onSaveEntry]);

  const selectedDateEntries = useMemo(() => {
    return visibleEntries
      .filter(
        (entry) => !(entry.type === "expense" && isSavingsCategory(entry.category)),
      )
      .filter((entry) => !isCardSettlementEntry(entry))
      .filter((entry) => entry.date === selectedDate)
      .sort((a, b) => b.amount - a.amount);
  }, [selectedDate, visibleEntries]);

  const selectedDateAssetEntries = useMemo(() => {
    return visibleEntries
      .filter((entry) => entry.date === selectedDate)
      .filter((entry) => entry.type === "expense")
      .filter((entry) => isSavingsCategory(entry.category))
      .sort((a, b) => b.amount - a.amount);
  }, [selectedDate, visibleEntries]);

  const daySummary = useMemo(() => {
    return monthEntries.reduce<
      Record<string, { income: number; expense: number }>
    >((acc, entry) => {
      const target = acc[entry.date] || { income: 0, expense: 0 };
      if (entry.type === "income") target.income += entry.amount;
      if (entry.type === "expense" && !isCardSettlementEntry(entry)) {
        target.expense += entry.amount;
      }
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
        description: "식비, 의료, 약국, 생활 구독",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          !isCardSettlementEntry(entry) &&
          getRepresentativeExpenseCategory(entry.category) === "생활비",
      },
      {
        id: "fixed",
        title: "고정비",
        description: "공과금, 보험, 통신",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          !isCardSettlementEntry(entry) &&
          isFixedExpenseCategory(entry.category),
      },
      {
        id: "move",
        title: "이동/차량",
        description: "택시, 주차, 통행료, 교통카드",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          !isCardSettlementEntry(entry) &&
          getRepresentativeExpenseCategory(entry.category) === "이동/차량",
      },
      {
        id: "shopping",
        title: "쇼핑/여가",
        description: "쇼핑, 여행, 취향 소비",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          !isCardSettlementEntry(entry) &&
          getRepresentativeExpenseCategory(entry.category) === "쇼핑/여가",
      },
      {
        id: "special",
        title: "특별/기타",
        description: "선물, 이벤트, 기타 지출",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          !isCardSettlementEntry(entry) &&
          getRepresentativeExpenseCategory(entry.category) === "특별/기타",
      },
      {
        id: "asset",
        title: "자산/저축",
        description: "예금, 적금, 투자",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" && isSavingsCategory(entry.category),
      },
      {
        id: "income",
        title: "수입",
        description: "입금, 월급, 환급",
        matches: (entry: ResolvedAccountEntry) => entry.type === "income",
      },
    ];

    return columnDefs.map((columnDef) => {
      const columnEntries = monthEntries
        .filter((entry) => columnDef.matches(entry))
        .sort(compareResolvedEntriesDesc);
      return {
        id: columnDef.id,
        title: columnDef.title,
        description: columnDef.description,
        entries: columnEntries,
        totalAmount: columnEntries.reduce(
          (sum, entry) => sum + entry.amount,
          0,
        ),
        cards: columnEntries.map((entry) => ({ amount: entry.amount })),
      };
    });
  }, [monthEntries]);

  const boardSummaryCards = useMemo(
    () =>
      monthlyBoardColumns.map((column) => ({
        id: column.id,
        label: column.title,
        amount: column.totalAmount,
        count: column.cards.length,
        description: column.description,
      })),
    [monthlyBoardColumns],
  );

  const selectedLedgerColumn = useMemo(
    () =>
      monthlyBoardColumns.find(
        (column) => column.id === selectedLedgerCardId,
      ) || null,
    [monthlyBoardColumns, selectedLedgerCardId],
  );

  const sortedMonthEntries = useMemo(
    () => displayMonthEntries.slice().sort(compareResolvedEntriesDesc),
    [displayMonthEntries],
  );

  const ledgerDetailSourceEntries =
    selectedLedgerColumn?.entries || sortedMonthEntries;

  const ledgerDetailEntries = useMemo(
    () =>
      ledgerDetailSourceEntries.filter(
        (entry) => !(entry.type === "expense" && isSavingsCategory(entry.category)),
      ),
    [ledgerDetailSourceEntries],
  );

  const ledgerDetailAssetEntries = useMemo(
    () =>
      ledgerDetailSourceEntries.filter(
        (entry) => entry.type === "expense" && isSavingsCategory(entry.category),
      ),
    [ledgerDetailSourceEntries],
  );

  const ledgerDetailTitle = selectedLedgerColumn
    ? `${monthLabel} ${selectedLedgerColumn.title} 내역`
    : `${monthLabel} 전체 내역`;

  const naturalPreview = useMemo(
    () =>
      parseNaturalInputEntry(naturalInput, {
        fallbackDate: selectedDate,
        workspaceId: workspace.id,
        users,
        memberUsers,
        defaultMember,
      }),
    [
      defaultMember,
      memberUsers,
      naturalInput,
      selectedDate,
      users,
      workspace.id,
    ],
  );
  const editingEntry = useMemo(
    () =>
      entriesWithPermissions.find((entry) => entry.id === editingEntryId) ||
      null,
    [editingEntryId, entriesWithPermissions],
  );
  const existingEntryDuplicateKeys = useMemo(
    () =>
      new Set(
        entriesWithPermissions.map((entry) =>
          getAccountEntryDuplicateKey(entry),
        ),
      ),
    [entriesWithPermissions],
  );
  const categoryDetailOptions = useMemo(
    () => getCategoryDetailOptions(category),
    [category],
  );

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingEntryId(null);
    setQuickInput("");
    setDraftRawText("");
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
      setCategory(nextType === "income" ? INCOME_CATEGORY_LABEL : "생활비");
      setSubCategory("");
    }
    setEditingEntryId(null);
    setMerchant("");
    setItem("");
    setAmount("");
    setMemo("");
    setDraftRawText("");
    setMember(selectedParticipant?.name || defaultMember);
    setPayment(nextType === "income" ? "cash" : "card");
    setCardCompany(CARD_COMPANY_DEFAULT);
    setIsFormModalOpen(true);
  };

  const openEditModal = (entry: ResolvedAccountEntry) => {
    if (entry.readonly) return;
    setEditingEntryId(entry.id);
    setSelectedDate(entry.date);
    setType(entry.type);
    setMember(entry.member || defaultMember);
    setCategory(getRepresentativeCategory(entry.category, entry.type));
    setSubCategory(entry.subCategory || "");
    setMerchant(entry.merchant || "");
    setItem(entry.item);
    setAmount(String(entry.amount));
    setPayment(entry.payment);
    setCardCompany(entry.cardCompany || CARD_COMPANY_DEFAULT);
    setMemo(entry.memo);
    setDraftRawText(entry.rawText || "");
    setIsFormModalOpen(true);
  };

  const onMonthMove = (diff: number) => {
    const next = startOfMonth(addMonths(currentMonth, diff));
    setCurrentMonth(next);
    setSelectedDate(toIsoDate(next));
  };

  const onMonthSelect = (value: string) => {
    const [yearText, monthText] = value.split("-");
    const nextYear = Number(yearText);
    const nextMonthIndex = Number(monthText) - 1;
    if (!Number.isInteger(nextYear) || !Number.isInteger(nextMonthIndex)) {
      return;
    }

    const next = startOfMonth(new Date(nextYear, nextMonthIndex, 1));
    setCurrentMonth(next);
    setSelectedDate(toIsoDate(next));
  };

  const onDashboardMonthSelect = (monthNumber: number) => {
    const next = startOfMonth(new Date(currentYear, monthNumber - 1, 1));
    setCurrentMonth(next);
    setSelectedDate(toIsoDate(next));
  };

  const onAnnualGoalChange = async (nextGoal: number) => {
    const normalizedGoal = Math.max(0, Math.trunc(nextGoal));
    const previousGoal = annualSavingGoal;
    setAnnualSavingGoal(normalizedGoal);
    const saved = await Promise.resolve(
      onChangeAnnualSavingGoal(normalizedGoal),
    );
    if (!saved) {
      setAnnualSavingGoal(previousGoal);
      return false;
    }
    return true;
  };

  const annualDetailQuery = useMemo(() => {
    const params = new URLSearchParams({
      year: selectedYear,
      workspaceId: workspace.id,
      view: "board",
    });

    if (
      workspace.type === "shared" &&
      selectedParticipantId !== ALL_PARTICIPANTS_ID
    ) {
      params.set("memberId", selectedParticipantId);
    }

    return params;
  }, [selectedParticipantId, selectedYear, workspace.id, workspace.type]);

  const onMonthlyGoalChange = async (nextGoal: number) => {
    const normalizedGoal = Math.max(0, Math.trunc(nextGoal));
    return onAnnualGoalChange(normalizedGoal * 12);
  };

  const saveListMemo = () => {
    const nextMemo = listMemoDraft.trim();
    setListMemo(nextMemo);
    setListMemoDraft(nextMemo);
    setIsListMemoEditing(false);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getListMemoStorageKey(workspace.id, currentMonthKey),
      nextMemo,
    );
  };

  const startListMemoEdit = () => {
    setListMemoDraft(listMemo);
    setIsListMemoEditing(true);
  };

  const syncFixedExpenseTemplateState = (
    updater: (prev: FixedExpenseTemplate[]) => FixedExpenseTemplate[],
  ) => {
    setFixedExpenseTemplates((prev) => {
      const next = updater(prev);
      writeFixedExpenseTemplates(workspace.id, next);
      return next;
    });
  };

  const upsertFixedExpenseTemplate = (
    entry: AccountEntry,
    templateId: string,
  ) => {
    const existingTemplate = fixedExpenseTemplates.find(
      (template) => template.id === templateId,
    );
    const nextTemplate = {
      ...buildFixedExpenseTemplate(entry, templateId),
      startDate: existingTemplate?.startDate || entry.date,
    };
    syncFixedExpenseTemplateState((prev) => {
      const rest = prev.filter((template) => template.id !== templateId);
      return [nextTemplate, ...rest];
    });
  };

  const removeFixedExpenseTemplate = (templateId: string | null) => {
    if (!templateId) return;
    syncFixedExpenseTemplateState((prev) =>
      prev.filter((template) => template.id !== templateId),
    );
  };

  const onSubmitEntry = async () => {
    const parsedAmount = Number(amount);
    if (!category.trim()) {
      alert("카테고리를 입력해주세요.");
      return;
    }
    if (type === "expense" && payment !== "cash" && !cardCompany.trim()) {
      alert("카드 결제 내역은 카드사를 선택해주세요.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      alert("금액은 0이 아닌 숫자로 입력해주세요.");
      return;
    }

    const matchedUser =
      memberUsers.find((user) => user.name === member) ||
      memberUsers[0] ||
      users[0];
    const normalizedSelection =
      type === "expense"
        ? normalizeExpenseCategorySelection(category, subCategory)
        : { category: category.trim(), subCategory: "" };
    const normalizedCategory = normalizedSelection.category;
    const normalizedSubCategory =
      type === "expense" ? normalizedSelection.subCategory : "";
    const isFixedExpense =
      type === "expense" && normalizedCategory === "고정비";
    const existingFixedTemplateId = extractFixedExpenseTemplateId(
      editingEntry?.rawText,
    );
    const nextFixedTemplateId = isFixedExpense
      ? existingFixedTemplateId || createFixedExpenseTemplateId()
      : null;
    const rawTextBase = draftRawText.trim() || editingEntry?.rawText || "";
    const resolvedItem = resolveEntryItemLabel({
      type,
      category: normalizedCategory,
      subCategory: normalizedSubCategory,
      merchant,
      item,
      memo,
    });

    const payload: AccountEntry = {
      id: editingEntryId || createEntryId(),
      date: selectedDate,
      member,
      workspaceId: workspace.id,
      createdByUserId: matchedUser.id,
      type,
      category: normalizedCategory,
      subCategory: normalizedSubCategory,
      merchant: merchant.trim(),
      item: resolvedItem,
      amount: Math.trunc(parsedAmount),
      cardCompany:
        type === "expense" && payment !== "cash"
          ? cardCompany.trim() || CARD_COMPANY_DEFAULT
          : "",
      payment: type === "income" ? "cash" : payment,
      memo: memo.trim(),
      rawText:
        nextFixedTemplateId && type === "expense"
          ? attachFixedExpenseMeta(rawTextBase, nextFixedTemplateId)
          : stripFixedExpenseMeta(rawTextBase),
    };

    const saved = await Promise.resolve(onSaveEntry(payload));
    if (!saved) {
      return;
    }
    if (nextFixedTemplateId) {
      upsertFixedExpenseTemplate(payload, nextFixedTemplateId);
    } else if (existingFixedTemplateId) {
      removeFixedExpenseTemplate(existingFixedTemplateId);
    }
    closeFormModal();
  };

  const applyQuickInput = async () => {
    const text = quickInput.trim();
    if (!text) {
      alert("텍스트를 입력해주세요.");
      return;
    }

    const defaultType: EntryType = text.includes("수입") ? "income" : "expense";
    const defaultDate = parseQuickDate(text, selectedDate);
    const defaultPayment =
      defaultType === "income" ? "cash" : toPaymentValue(text) || "card";
    const defaultCategory =
      CATEGORY_OPTIONS.find((option) => text.includes(option.label))?.label ||
      (defaultType === "income" ? INCOME_CATEGORY_LABEL : "생활비");

    const segments = text
      .split(/\r?\n|,(?=\s*[^\d])/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const parsedEntries = segments
      .map((segment) => {
        const parsedAmount = parseAmountValue(segment);
        if (!parsedAmount) return null;
        const matchedMember =
          memberUsers.find((user) => segment.includes(user.name)) ||
          memberUsers[0];
        const nextCategory =
          CATEGORY_OPTIONS.find((option) => segment.includes(option.label))
            ?.label ||
          inferCategoryFromItemText(segment) ||
          defaultCategory;
        const nextPayment =
          segment.includes("수입") || defaultType === "income"
            ? "cash"
            : toPaymentValue(segment) || defaultPayment;
        const cleanedItem = segment
          .replace(/(-?\d[\d,]*)\s*원?/g, " ")
          .replace(/수입|지출/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        return {
          id: createEntryId(),
          date: parseQuickDate(segment, defaultDate),
          member: matchedMember?.name || defaultMember,
          workspaceId: workspace.id,
          createdByUserId:
            matchedMember?.id || memberUsers[0]?.id || users[0].id,
          type: segment.includes("수입") ? "income" : defaultType,
          category: nextCategory,
          subCategory: inferSubCategoryFromText(nextCategory, segment),
          merchant: "",
          item: cleanedItem || "미입력",
          amount: parsedAmount,
          cardCompany:
            nextPayment === "cash"
              ? ""
              : inferCardCompanyFromText(segment) || CARD_COMPANY_DEFAULT,
          payment: nextPayment,
          memo: "",
          rawText: segment,
        } satisfies AccountEntry;
      })
      .filter(Boolean) as AccountEntry[];

    if (parsedEntries.length === 0) {
      alert("입력 포맷을 인식하지 못했어요. 예: 식당 30000, 택시 12000");
      return;
    }

    for (const entry of parsedEntries) {
      const saved = await Promise.resolve(onSaveEntry(entry));
      if (!saved) {
        return;
      }
    }
    setQuickInput("");
    if (parsedEntries.length === 1) {
      const first = parsedEntries[0];
      setSelectedDate(first.date);
      setMember(first.member || defaultMember);
      setType(first.type);
      setCategory(getRepresentativeCategory(first.category, first.type));
      setSubCategory(first.subCategory || "");
      setMerchant(first.merchant || "");
      setAmount(String(first.amount));
      setItem(first.item);
      setPayment(first.payment);
      setCardCompany(first.cardCompany || CARD_COMPANY_DEFAULT);
      setDraftRawText(first.rawText || "");
      return;
    }
    alert(`${parsedEntries.length}건을 한 번에 추가했어요.`);
  };

  const clearExtractedImageEntries = () => {
    setOcrErrorMessage("");
    setOcrFileName("");
    setExtractedImageEntries([]);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
    clearExtractedImageEntries();
  };

  const openRegisterModal = (mode: "natural" | "image") => {
    setRegisterMode(mode);
    setIsRegisterModalOpen(true);
  };

  const openManualEntryModal = () => {
    closeRegisterModal();
    openFormModal({ date: selectedDate });
  };

  const saveExtractedImageEntries = async (
    candidates: ExtractedImageEntryCandidate[],
  ) => {
    if (candidates.length === 0) {
      alert("저장할 추출 후보가 없어요.");
      return;
    }

    const matchedUser =
      memberUsers.find(
        (user) => user.name === (selectedParticipant?.name || defaultMember),
      ) ||
      memberUsers[0] ||
      users[0];
    const nextEntries = candidates.map((candidate) => {
      const nextType: EntryType =
        candidate.type === "income" ? "income" : "expense";
      const supportText = [
        candidate.category,
        candidate.item,
        candidate.merchant,
        candidate.memo,
        candidate.rawText,
      ]
        .filter(Boolean)
        .join(" ");
      const normalizedCategory =
        CATEGORY_OPTIONS.find((option) => option.label === candidate.category)
          ?.label ||
        inferCategoryFromItemText(supportText) ||
        (nextType === "income" ? INCOME_CATEGORY_LABEL : "생활비");
      const nextPayment =
        nextType === "income" ? "cash" : candidate.payment || "card";
      const normalizedSelection =
        nextType === "expense"
          ? normalizeExpenseCategorySelection(
              normalizedCategory,
              candidate.subCategory,
            )
          : { category: normalizedCategory, subCategory: "" };

      return {
        id: createEntryId(),
        date: parseQuickDate(candidate.date || candidate.rawText, selectedDate),
        member: selectedParticipant?.name || defaultMember,
        workspaceId: workspace.id,
        createdByUserId: matchedUser.id,
        type: nextType,
        category: normalizedSelection.category,
        subCategory:
          normalizedSelection.subCategory ||
          inferSubCategoryFromText(normalizedSelection.category, supportText),
        merchant: candidate.merchant.trim(),
        item: (candidate.item || candidate.merchant || "미입력").trim(),
        amount: Math.max(0, Math.trunc(candidate.amount)),
        cardCompany:
          nextPayment === "cash"
            ? ""
            : inferCardCompanyFromText(supportText) || CARD_COMPANY_DEFAULT,
        payment: nextPayment,
        memo: candidate.memo.trim(),
        rawText: candidate.rawText.trim(),
      } satisfies AccountEntry;
    });

    const validEntries = nextEntries.filter((entry) => entry.amount > 0);
    if (validEntries.length === 0) {
      alert("금액이 인식된 후보가 없어서 저장할 수 없어요.");
      return;
    }

    for (const entry of validEntries) {
      const saved = await Promise.resolve(onSaveEntry(entry));
      if (!saved) {
        return;
      }
    }
    setSelectedDate(validEntries[0].date);
    setCurrentMonth(
      startOfMonth(parseIsoDate(validEntries[0].date) || new Date()),
    );
    closeRegisterModal();

    alert(`${validEntries.length}건을 가계부에 저장했어요.`);
  };

  const extractEntriesFromImage = async (file: File) => {
    setIsExtractingImage(true);
    setOcrErrorMessage("");
    setOcrFileName(file.name);
    setExtractedImageEntries([]);

    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("kor+eng");

      try {
        await worker.setParameters({
          preserve_interword_spaces: "1",
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });
        const {
          data: { text },
        } = await worker.recognize(file);

        const nextEntries = extractImageCandidatesFromText(text, {
          fallbackDate: selectedDate,
          workspaceId: workspace.id,
          users,
          memberUsers,
          defaultMember,
        });

        if (nextEntries.length === 0) {
          setExtractedImageEntries([]);
          setOcrErrorMessage(
            "이미지에서 읽을 수 있는 거래 문장을 찾지 못했어요. 더 선명한 캡처로 다시 시도해보세요.",
          );
          return;
        }

        setExtractedImageEntries(nextEntries);
      } finally {
        await worker.terminate();
      }
    } catch (error) {
      setExtractedImageEntries([]);
      setOcrErrorMessage(
        error instanceof Error ? error.message : "무료 OCR 처리에 실패했어요.",
      );
    } finally {
      setIsExtractingImage(false);
    }
  };

  const submitNaturalInput = async () => {
    const lines = naturalInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert("지출 문장을 입력해주세요.");
      return;
    }

    const parsedEntries: AccountEntry[] = [];

    for (const line of lines) {
      const entry = parseNaturalInputEntry(line, {
        fallbackDate: selectedDate,
        workspaceId: workspace.id,
        users,
        memberUsers,
        defaultMember,
      });

      if (!entry) {
        alert(
          `문장을 해석하지 못했어요: "${line}"\n예: 3월 17일 네이버쇼핑 마라샹궈 구매 119200원`,
        );
        return;
      }

      parsedEntries.push(entry);
    }

    for (const entry of parsedEntries) {
      const saved = await Promise.resolve(onSaveEntry(entry));
      if (!saved) {
        return;
      }
    }

    const firstEntry = parsedEntries[0];
    const nextMonth = startOfMonth(parseIsoDate(firstEntry.date) || new Date());
    setCurrentMonth(nextMonth);
    setSelectedDate(firstEntry.date);
    setNaturalInput("");
    closeRegisterModal();

    if (parsedEntries.length > 1) {
      alert(`${parsedEntries.length}건을 기록했어요.`);
    }
  };

  const entryActions = (entry: ResolvedAccountEntry) => {
    if (workspace.type === "personal") {
      if (entry.readonly || shareTargets.length === 0) {
        return [];
      }

      return shareTargets.map((target) => {
        const shared = isEntryShared(entry.id, target.id);

        if (shared) {
          return {
            label: `${target.name} 공유 해제`,
            active: true,
            onClick: () => onToggleShare(entry.id, target.id),
          };
        }

        return {
          label: `${target.name} 공유`,
          onClick: () =>
            setShareConfirmState({
              entryId: entry.id,
              targetWorkspaceId: target.id,
              targetWorkspaceName: target.name,
            }),
        };
      });
    }

    if (workspace.type === "shared" && entry.source === "shared_link") {
      return [
        {
          label: "공유 해제",
          onClick: () =>
            onToggleShare(
              entry.id,
              entry.linkedTargetWorkspaceId || workspace.id,
            ),
        },
      ];
    }

    return [];
  };

  const handleDeleteEntry = async (entryId: string) => {
    const targetEntry = entries.find((entry) => entry.id === entryId) || null;
    const fixedTemplateId = extractFixedExpenseTemplateId(targetEntry?.rawText);

    await Promise.resolve(onDeleteEntry(entryId));

    if (targetEntry && isFixedExpenseCategory(targetEntry.category) && fixedTemplateId) {
      removeFixedExpenseTemplate(fixedTemplateId);
    }
  };

  return (
    <StPage>
      <WorkspaceHeader
        title={workspaceTitle}
        subtitle={workspaceSubtitle}
        infoText={workspaceInfoText}
        monthLabel={monthLabel}
        monthRangeLabel={monthRangeLabel}
        monthValue={monthValue}
        onOpenNaturalRegister={() => openRegisterModal("natural")}
        onOpenImageRegister={() => openRegisterModal("image")}
        onOpenManual={openManualEntryModal}
        onBack={onBack}
        onMonthMove={onMonthMove}
        onMonthSelect={onMonthSelect}
      />
      <StContentWrap>
        {isRegisterModalOpen ? (
          <NaturalInputSection
            mode={registerMode}
            currentMonth={currentMonth}
            monthEntriesCount={displayMonthEntries.length}
            naturalInput={naturalInput}
            naturalPreview={naturalPreview}
            isExtractingImage={isExtractingImage}
            ocrErrorMessage={ocrErrorMessage}
            ocrFileName={ocrFileName}
            extractedImageEntries={extractedImageEntries}
            existingEntryDuplicateKeys={existingEntryDuplicateKeys}
            formatAmount={formatAmount}
            formatPreviewDate={formatPreviewDate}
            paymentLabel={paymentLabel}
            onCloseModal={closeRegisterModal}
            onChangeInput={setNaturalInput}
            onSelectImageFile={extractEntriesFromImage}
            onSaveImageEntries={saveExtractedImageEntries}
            onClearImageEntries={clearExtractedImageEntries}
            onSubmit={submitNaturalInput}
          />
        ) : null}

        <ViewModeTabs viewMode={viewMode} onChangeViewMode={setViewMode} />

        <WorkspacePanelsSection
          viewMode={viewMode}
          currentMonth={currentMonth}
          currentYear={currentYear}
          currentMonthIndex={currentMonthIndex}
          selectedDate={selectedDate}
          monthEntries={displayMonthEntries}
          monthTotals={monthTotals}
          monthPaymentTotals={monthPaymentTotals}
          cashBalance={cashBalance}
          monthAssetTotal={monthAssetTotal}
          listMemo={listMemoDraft}
          isListMemoEditing={isListMemoEditing}
          onChangeListMemo={setListMemoDraft}
          onSaveListMemo={saveListMemo}
          onEditListMemo={startListMemoEdit}
          memberExpenseTotals={memberExpenseTotals}
          monthCategorySummary={monthCategorySummary}
          onOpenIncomeYearly={() =>
            router.push(
              `/account-book/annual?kind=income&${annualDetailQuery.toString()}`,
            )
          }
          onOpenExpenseYearly={() =>
            router.push(
              `/account-book/annual?kind=expense&${annualDetailQuery.toString()}`,
            )
          }
          onOpenAssetYearly={() =>
            router.push(
              `/account-book/annual?kind=asset&${annualDetailQuery.toString()}`,
            )
          }
          formatAmount={formatAmount}
          boardSummaryCards={boardSummaryCards}
          selectedLedgerCardId={selectedLedgerCardId}
          onSelectLedgerCard={(cardId) =>
            setSelectedLedgerCardId((current) =>
              current === cardId ? null : cardId,
            )
          }
          ledgerDetailTitle={ledgerDetailTitle}
          ledgerDetailEntries={ledgerDetailEntries}
          ledgerDetailAssetEntries={ledgerDetailAssetEntries}
          annualSavingGoal={annualSavingGoal}
          monthlySavingGoal={monthlySavingGoal}
          onChangeMonthlySavingGoal={onMonthlyGoalChange}
          dashboardRows={dashboardRows}
          onSelectBoardMonth={onDashboardMonthSelect}
          onChangeAnnualSavingGoal={onAnnualGoalChange}
          calendarDays={calendarDays}
          daySummary={daySummary}
          toIsoDate={toIsoDate}
          onSelectDate={setSelectedDate}
          calendarDetailTitle={calendarDetailTitle}
          selectedDateEntries={selectedDateEntries}
          selectedDateAssetEntries={selectedDateAssetEntries}
          onOpenAdd={() => openFormModal({ date: selectedDate })}
          onOpenAddForDate={(date) => openFormModal({ date })}
          onEdit={openEditModal}
          onDelete={handleDeleteEntry}
          entryActions={entryActions}
          paymentLabel={paymentLabel}
        />
      </StContentWrap>

      {shareConfirmState ? (
        <StShareConfirmBackdrop onClick={() => setShareConfirmState(null)}>
          <StShareConfirmCard onClick={(event) => event.stopPropagation()}>
            <StShareConfirmEyebrow>Share</StShareConfirmEyebrow>
            <StShareConfirmTitle>공유하겠습니까?</StShareConfirmTitle>
            <StShareConfirmDescription>
              이 내역을 {shareConfirmState.targetWorkspaceName}에 공유하면
              공용방에서도 바로 확인할 수 있습니다.
            </StShareConfirmDescription>
            <StShareConfirmActions>
              <StShareGhostButton
                type="button"
                onClick={() => setShareConfirmState(null)}
              >
                취소
              </StShareGhostButton>
              <StSharePrimaryButton
                type="button"
                onClick={async () => {
                  const target = shareConfirmState;
                  setShareConfirmState(null);
                  await onToggleShare(target.entryId, target.targetWorkspaceId);
                }}
              >
                공유하기
              </StSharePrimaryButton>
            </StShareConfirmActions>
          </StShareConfirmCard>
        </StShareConfirmBackdrop>
      ) : null}

      <EntryFormModal
        isOpen={isFormModalOpen}
        isEditing={Boolean(editingEntryId)}
        selectedDate={selectedDate}
        member={member}
        memberOptions={memberNames.length > 0 ? memberNames : [MEMBER_FALLBACK]}
        type={type}
        category={category}
        subCategory={subCategory}
        merchant={merchant}
        item={item}
        amount={amount}
        payment={payment}
        cardCompany={cardCompany}
        memo={memo}
        quickInput={quickInput}
        categoryOptions={
          type === "income" ? INCOME_CATEGORY_OPTIONS : CATEGORY_OPTIONS
        }
        categoryDetailOptions={categoryDetailOptions}
        cardCompanyOptions={[...CARD_COMPANY_OPTIONS]}
        onClose={closeFormModal}
        onSetDate={setSelectedDate}
        onSetType={(nextType) => {
          setType(nextType);
          if (nextType === "income") setCategory(INCOME_CATEGORY_LABEL);
          if (nextType === "expense" && category === INCOME_CATEGORY_LABEL)
            setCategory("생활비");
          if (nextType !== "expense") setSubCategory("");
          if (nextType === "income") setPayment("cash");
          if (nextType === "income") setCardCompany(CARD_COMPANY_DEFAULT);
        }}
        onSetMember={setMember}
        onSetCategory={(nextCategory) => {
          setCategory(nextCategory);
          setSubCategory("");
        }}
        onSetSubCategory={setSubCategory}
        onSetMerchant={setMerchant}
        onSetItem={setItem}
        onSetAmount={setAmount}
        onSetPayment={setPayment}
        onSetCardCompany={setCardCompany}
        onSetMemo={setMemo}
        onSetQuickInput={setQuickInput}
        onApplyQuickInput={applyQuickInput}
        onSubmit={onSubmitEntry}
      />
    </StPage>
  );
}

const StPage = styled.main`
  overscroll-behavior: none;
  min-height: 100vh;
  background: #f3f6fb;
  display: flex;
  flex-direction: column;
`;

const StShareConfirmBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1.2rem;
  background: rgba(15, 23, 42, 0.34);
`;

const StShareConfirmCard = styled.section`
  width: min(100%, 25rem);
  border-radius: 24px;
  border: 1px solid #d7e1ee;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  padding: 1.25rem;
`;

const StShareConfirmEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e8ab8;
`;

const StShareConfirmTitle = styled.h3`
  margin-top: 0.35rem;
  font-size: 1.28rem;
  font-weight: 900;
  color: #1f2937;
`;

const StShareConfirmDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #5f6e82;
`;

const StShareConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
`;

const StShareGhostButton = styled.button`
  border: 1px solid #d7e1ee;
  background: #f8fafc;
  color: #5f6e82;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 800;
`;

const StSharePrimaryButton = styled.button`
  border: none;
  background: linear-gradient(135deg, #6d87ef, #5f73d9);
  color: #ffffff;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-weight: 900;
  box-shadow: 0 12px 28px rgba(95, 115, 217, 0.24);
`;

const StContentWrap = styled.div`
  padding: 1rem;
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 0.8rem;

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
  }
`;
