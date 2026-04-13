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
import {
  PaymentType,
  ResolvedAccountEntry,
  ViewMode,
} from "../../types";
import type { WorkspaceLedgerViewProps } from "./types";
import EntryFormModal from "../EntryFormModal";
import WorkspaceHeader from "../WorkspaceHeader";
import NaturalInputSection from "./NaturalInputSection";
import ShareConfirmDialog from "./ShareConfirmDialog";
import ViewModeTabs from "./ViewModeTabs";
import WorkspacePanelsSection from "./WorkspacePanelsSection";
import { StContentWrap, StPage } from "./WorkspaceLedgerView.styles";
import {
  DEFAULT_ANNUAL_SAVING_GOAL,
  DEFAULT_HIDDEN_CALENDAR_AMOUNT_CARD_IDS,
  FIXED_EXPENSE_CATEGORIES,
  extractFixedExpenseTemplateId,
} from "./fixedExpense";
import { compareResolvedEntriesDesc } from "./helpers";
import { useEntryForm } from "./useEntryForm";
import { useFixedExpenseTemplates } from "./useFixedExpenseTemplates";
import { useListMemo } from "./useListMemo";
import { useRegisterModal } from "./useRegisterModal";
import {
  ALL_PARTICIPANTS_ID,
  INCOME_CATEGORY_LABEL,
  MEMBER_FALLBACK,
  formatAmount,
  formatPreviewDate,
  formatSelectedDateTitle,
  getAccountEntryDuplicateKey,
  getRepresentativeExpenseCategory,
  isCardSettlementEntry,
  isFixedExpenseCategory,
  isSavingsCategory,
  parseIsoDate,
  paymentLabel,
  toIsoDate,
} from "./utils";

export default function WorkspaceLedgerView({
  workspace,
  users,
  currentUserId,
  entries,
  shareTargets,
  isEntryShared,
  onToggleShare,
  monthlyMemos,
  onSaveMonthlyMemo,
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
  const [selectedCalendarCardId, setSelectedCalendarCardId] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedLedgerCardId, setSelectedLedgerCardId] = useState<
    string | null
  >(null);
  const [selectedExpenseMemberName, setSelectedExpenseMemberName] = useState<
    string | null
  >(null);
  const [selectedCardCompany, setSelectedCardCompany] = useState<string | null>(
    null,
  );
  const [isCalendarIncomeAmountHidden, setIsCalendarIncomeAmountHidden] =
    useState(false);
  const [hiddenCalendarAmountCardIds, setHiddenCalendarAmountCardIds] =
    useState<string[]>([...DEFAULT_HIDDEN_CALENDAR_AMOUNT_CARD_IDS]);
  const [annualSavingGoal, setAnnualSavingGoal] = useState(
    DEFAULT_ANNUAL_SAVING_GOAL,
  );

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
  const [shareConfirmState, setShareConfirmState] = useState<{
    entryId: string;
    targetWorkspaceId: string;
    targetWorkspaceName: string;
  } | null>(null);

  const monthLabel = format(currentMonth, "M월", { locale: ko });
  const monthValue = format(currentMonth, "yyyy-MM");
  const currentMonthKey = format(currentMonth, "yyyy-MM");
  const serverMonthlyMemo = useMemo(
    () =>
      monthlyMemos.find((monthlyMemo) => monthlyMemo.monthKey === currentMonthKey)
        ?.memo || "",
    [currentMonthKey, monthlyMemos],
  );
  const {
    listMemoDraft,
    isListMemoEditing,
    setListMemoDraft,
    saveListMemo,
    startListMemoEdit,
  } = useListMemo({
    workspaceId: workspace.id,
    currentMonthKey,
    serverMonthlyMemo,
    onSaveMonthlyMemo,
  });
  const {
    upsertTemplate: upsertFixedExpenseTemplate,
    removeTemplate: removeFixedExpenseTemplate,
  } = useFixedExpenseTemplates({
    workspaceId: workspace.id,
    entries,
    currentMonth,
    onSaveEntry,
  });
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
  const isCalendarSummaryDetailActive =
    selectedCalendarCardId === "income" || selectedCalendarCardId === "asset";
  const calendarDetailTitle = isSharedWorkspace
    ? selectedCalendarCardId === "asset"
      ? `${monthLabel} 자산 상세`
      : formatSelectedDateTitle(selectedDate)
    : selectedCalendarCardId === "asset"
      ? `${monthLabel} 자산 상세 · ${selectedParticipantLabel}`
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

  const entryForm = useEntryForm({
    workspace,
    users,
    memberUsers,
    defaultMember,
    selectedParticipant,
    selectedDate,
    setSelectedDate,
    entriesWithPermissions,
    onSaveEntry,
    upsertFixedExpenseTemplate,
    removeFixedExpenseTemplate,
  });
  const registerModal = useRegisterModal({
    workspace,
    users,
    memberUsers,
    defaultMember,
    selectedParticipant,
    selectedDate,
    setSelectedDate,
    setCurrentMonth,
    setSelectedCalendarCardId,
    onSaveEntry,
  });
  const openManualEntryModal = () => {
    registerModal.closeRegisterModal();
    entryForm.openFormModal({ date: selectedDate });
  };

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
      if (entry.payment !== "cash") {
        return sum;
      }

      if (entry.type === "income") {
        return sum + entry.amount;
      }

      return sum - entry.amount;
    }, 0);
  }, [monthEntries]);

  const monthSettlementTotal = useMemo(() => {
    return monthEntries.reduce((sum, entry) => {
      if (entry.type !== "expense" || !isCardSettlementEntry(entry)) {
        return sum;
      }
      return sum + entry.amount;
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
      // Savings metrics should follow actual savings-category entries so the
      // dashboard stays aligned with asset/yearly views and user expectations.
      const actualSavings = regularSavings;
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
    setViewMode(initialViewMode);
  }, [initialViewMode, workspace.id]);

  useEffect(() => {
    setSelectedLedgerCardId(null);
  }, [workspace.id]);

  useEffect(() => {
    setSelectedExpenseMemberName(null);
  }, [workspace.id]);

  useEffect(() => {
    if (
      selectedExpenseMemberName &&
      !memberExpenseTotals.some(([name]) => name === selectedExpenseMemberName)
    ) {
      setSelectedExpenseMemberName(null);
    }
  }, [memberExpenseTotals, selectedExpenseMemberName]);

  const selectedDateEntries = useMemo(() => {
    return visibleEntries
      .filter(
        (entry) => !(entry.type === "expense" && isSavingsCategory(entry.category)),
      )
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

  const selectedCalendarSummaryEntries = useMemo(() => {
    const sortedEntries = monthEntries.slice().sort(compareResolvedEntriesDesc);

    if (selectedCalendarCardId === "income") {
      return sortedEntries.filter((entry) => entry.type === "income");
    }

    if (selectedCalendarCardId === "expense") {
      return sortedEntries.filter(
        (entry) =>
          entry.type === "expense" &&
          !isSavingsCategory(entry.category) &&
          !isCardSettlementEntry(entry),
      );
    }

    if (selectedCalendarCardId === "cash_balance") {
      return sortedEntries.filter((entry) => entry.payment === "cash");
    }

    if (selectedCalendarCardId === "asset") {
      return sortedEntries.filter(
        (entry) => entry.type === "expense" && isSavingsCategory(entry.category),
      );
    }

    return [];
  }, [monthEntries, selectedCalendarCardId]);

  const selectedCalendarSummaryTitle = useMemo(() => {
    if (!selectedCalendarCardId) return calendarDetailTitle;
    if (selectedCalendarCardId !== "income" && selectedCalendarCardId !== "asset") {
      return calendarDetailTitle;
    }

    const suffix = isSharedWorkspace ? "" : ` · ${selectedParticipantLabel}`;

    if (selectedCalendarCardId === "income") {
      return `${monthLabel} 수입 내역${suffix}`;
    }
    return `${monthLabel} 자산 내역${suffix}`;
  }, [
    calendarDetailTitle,
    isSharedWorkspace,
    monthLabel,
    selectedCalendarCardId,
    selectedParticipantLabel,
  ]);

  const daySummary = useMemo(() => {
    return monthEntries.reduce<
      Record<string, { income: number; expense: number; settlement: number }>
    >((acc, entry) => {
      const target = acc[entry.date] || { income: 0, expense: 0, settlement: 0 };
      if (entry.type === "income") target.income += entry.amount;
      if (entry.type === "expense" && isCardSettlementEntry(entry)) {
        target.settlement += entry.amount;
      } else if (entry.type === "expense") {
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
        id: "exercise",
        title: "운동",
        description: "테니스, 헬스, 필라테스, 수영",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          !isCardSettlementEntry(entry) &&
          getRepresentativeExpenseCategory(entry.category) === "운동",
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

  const cardCompanySummary = useMemo(() => {
    const paymentGroupOrder: Record<PaymentType, number> = {
      card: 0,
      check_card: 1,
      cash: 2,
    };
    const grouped = monthEntries.reduce<
      Record<
        string,
        {
          id: string;
          label: string;
          paymentGroup: PaymentType;
          amount: number;
          count: number;
          cardCount: number;
          checkCardCount: number;
          cashCount: number;
        }
      >
    >((acc, entry) => {
      if (entry.type !== "expense") return acc;
      if (isSavingsCategory(entry.category)) return acc;
      if (isCardSettlementEntry(entry)) return acc;

      const paymentGroup = entry.payment;
      const label =
        paymentGroup === "cash"
          ? "현금"
          : entry.cardCompany.trim() ||
            (paymentGroup === "check_card" ? "기타 체크카드" : "기타 카드");
      const id = `${paymentGroup}:${label}`;

      if (!acc[id]) {
        acc[id] = {
          id,
          label,
          paymentGroup,
          amount: 0,
          count: 0,
          cardCount: 0,
          checkCardCount: 0,
          cashCount: 0,
        };
      }

      acc[id].amount += entry.amount;
      acc[id].count += 1;

      if (paymentGroup === "cash") {
        acc[id].cashCount += 1;
      } else if (paymentGroup === "check_card") {
        acc[id].checkCardCount += 1;
      } else {
        acc[id].cardCount += 1;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) =>
        paymentGroupOrder[a.paymentGroup] - paymentGroupOrder[b.paymentGroup] ||
        b.amount - a.amount ||
        a.label.localeCompare(b.label, "ko-KR"),
    );
  }, [monthEntries]);

  const selectedLedgerColumn = useMemo(
    () =>
      monthlyBoardColumns.find(
        (column) => column.id === selectedLedgerCardId,
      ) || null,
    [monthlyBoardColumns, selectedLedgerCardId],
  );

  const sortedMonthDetailEntries = useMemo(
    () => monthEntries.slice().sort(compareResolvedEntriesDesc),
    [monthEntries],
  );

  const selectedCardCompanyEntries = useMemo(
    () =>
      monthEntries
        .slice()
        .sort(compareResolvedEntriesDesc)
        .filter((entry) => {
          if (entry.type !== "expense") return false;
          if (isSavingsCategory(entry.category)) return false;
          if (isCardSettlementEntry(entry)) return false;

          const label =
            entry.payment === "cash"
              ? "현금"
              : entry.cardCompany.trim() ||
                (entry.payment === "check_card" ? "기타 체크카드" : "기타 카드");
          const id = `${entry.payment}:${label}`;

          return id === selectedCardCompany;
        }),
    [monthEntries, selectedCardCompany],
  );
  const selectedCardCompanySummary = useMemo(
    () => cardCompanySummary.find((entry) => entry.id === selectedCardCompany) || null,
    [cardCompanySummary, selectedCardCompany],
  );

  const ledgerDetailBaseEntries = selectedCardCompany
    ? selectedCardCompanyEntries
    : selectedLedgerColumn?.entries || sortedMonthDetailEntries;

  const ledgerDetailSourceEntries = useMemo(() => {
    if (!selectedExpenseMemberName) {
      return ledgerDetailBaseEntries;
    }

    return ledgerDetailBaseEntries.filter(
      (entry) => (entry.member || defaultMember) === selectedExpenseMemberName,
    );
  }, [defaultMember, ledgerDetailBaseEntries, selectedExpenseMemberName]);

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

  const ledgerDetailTitle = selectedCardCompany
    ? selectedCardCompanySummary?.paymentGroup === "cash"
      ? `${monthLabel} 현금 내역${selectedExpenseMemberName ? ` · ${selectedExpenseMemberName}` : ""}`
      : `${monthLabel} ${selectedCardCompanySummary?.label || ""} ${paymentLabel(selectedCardCompanySummary?.paymentGroup || "card")} 내역${selectedExpenseMemberName ? ` · ${selectedExpenseMemberName}` : ""}`
    : selectedLedgerColumn
      ? `${monthLabel} ${selectedLedgerColumn.title} 내역${selectedExpenseMemberName ? ` · ${selectedExpenseMemberName}` : ""}`
      : `${monthLabel} 전체 내역${selectedExpenseMemberName ? ` · ${selectedExpenseMemberName}` : ""}`;

  const existingEntryDuplicateKeys = useMemo(
    () =>
      new Set(
        entriesWithPermissions.map((entry) =>
          getAccountEntryDuplicateKey(entry),
        ),
      ),
    [entriesWithPermissions],
  );

  const onMonthMove = (diff: number) => {
    const next = startOfMonth(addMonths(currentMonth, diff));
    setCurrentMonth(next);
    setSelectedDate(toIsoDate(next));
    setSelectedCalendarCardId(null);
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
    setSelectedCalendarCardId(null);
  };

  const onDashboardMonthSelect = (monthNumber: number) => {
    const next = startOfMonth(new Date(currentYear, monthNumber - 1, 1));
    setCurrentMonth(next);
    setSelectedDate(toIsoDate(next));
    setSelectedCalendarCardId(null);
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
      if (entry.createdByUserId !== currentUserId) {
        return [];
      }

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
        onOpenNaturalRegister={() => registerModal.openRegisterModal("natural")}
        onOpenImageRegister={() => registerModal.openRegisterModal("image")}
        onOpenManual={openManualEntryModal}
        onBack={onBack}
        onMonthMove={onMonthMove}
        onMonthSelect={onMonthSelect}
      />
      <StContentWrap>
        {registerModal.isRegisterModalOpen ? (
          <NaturalInputSection
            mode={registerModal.registerMode}
            currentMonth={currentMonth}
            monthEntriesCount={displayMonthEntries.length}
            naturalInput={registerModal.naturalInput}
            naturalPreview={registerModal.naturalPreview}
            isExtractingImage={registerModal.isExtractingImage}
            ocrErrorMessage={registerModal.ocrErrorMessage}
            ocrFileName={registerModal.ocrFileName}
            extractedImageEntries={registerModal.extractedImageEntries}
            existingEntryDuplicateKeys={existingEntryDuplicateKeys}
            formatAmount={formatAmount}
            formatPreviewDate={formatPreviewDate}
            paymentLabel={paymentLabel}
            onCloseModal={registerModal.closeRegisterModal}
            onChangeInput={registerModal.setNaturalInput}
            onSelectImageFile={registerModal.extractEntriesFromImage}
            onSaveImageEntries={registerModal.saveExtractedImageEntries}
            onClearImageEntries={registerModal.clearExtractedImageEntries}
            onSubmit={registerModal.submitNaturalInput}
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
          monthSettlementTotal={monthSettlementTotal}
          monthAssetTotal={monthAssetTotal}
          selectedCalendarCardId={selectedCalendarCardId}
          listMemo={listMemoDraft}
          isListMemoEditing={isListMemoEditing}
          onChangeListMemo={setListMemoDraft}
          onSaveListMemo={saveListMemo}
          onEditListMemo={startListMemoEdit}
          memberExpenseTotals={memberExpenseTotals}
          selectedExpenseMemberName={selectedExpenseMemberName}
          onSelectExpenseMember={(memberName) => {
            setSelectedExpenseMemberName((current) =>
              current === memberName ? null : memberName,
            );
          }}
          monthCategorySummary={monthCategorySummary}
          cardCompanySummary={cardCompanySummary}
          selectedCardCompany={selectedCardCompany}
          onSelectCardCompany={(cardCompany) => {
            setSelectedCardCompany((current) =>
              current === cardCompany ? null : cardCompany,
            );
            setSelectedLedgerCardId(null);
          }}
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
          onSelectLedgerCard={(cardId) => {
            setSelectedCardCompany(null);
            setSelectedLedgerCardId((current) =>
              current === cardId ? null : cardId,
            );
          }}
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
          onSelectDate={(date) => {
            setSelectedCalendarCardId(null);
            setSelectedDate(date);
          }}
          calendarDetailTitle={selectedCalendarSummaryTitle}
          selectedDateEntries={
            isCalendarSummaryDetailActive
              ? selectedCalendarSummaryEntries
              : selectedDateEntries
          }
          selectedDateAssetEntries={selectedDateAssetEntries}
          onOpenAdd={() => entryForm.openFormModal({ date: selectedDate })}
          onOpenNaturalRegisterForDate={registerModal.openNaturalRegisterForDate}
          onSelectCalendarCard={(cardId) =>
            setSelectedCalendarCardId((current) =>
              current === cardId ? null : cardId,
            )
          }
          onEdit={(entry) => {
            setSelectedCalendarCardId(null);
            entryForm.openEditModal(entry);
          }}
          onDelete={handleDeleteEntry}
          entryActions={entryActions}
          paymentLabel={paymentLabel}
          isCalendarIncomeAmountHidden={isCalendarIncomeAmountHidden}
          onToggleCalendarIncomeAmountHidden={() =>
            setIsCalendarIncomeAmountHidden((current) => !current)
          }
          hiddenCalendarAmountCardIds={hiddenCalendarAmountCardIds}
          onToggleCalendarAmountCard={(cardId) =>
            setHiddenCalendarAmountCardIds((current) =>
              current.includes(cardId)
                ? current.filter((value) => value !== cardId)
                : [...current, cardId],
            )
          }
        />
      </StContentWrap>

      {shareConfirmState ? (
        <ShareConfirmDialog
          targetWorkspaceName={shareConfirmState.targetWorkspaceName}
          onCancel={() => setShareConfirmState(null)}
          onConfirm={async () => {
            const target = shareConfirmState;
            setShareConfirmState(null);
            await onToggleShare(target.entryId, target.targetWorkspaceId);
          }}
        />
      ) : null}

      <EntryFormModal
        isOpen={entryForm.isFormModalOpen}
        isEditing={Boolean(entryForm.editingEntryId)}
        selectedDate={selectedDate}
        member={entryForm.member}
        memberOptions={memberNames.length > 0 ? memberNames : [MEMBER_FALLBACK]}
        type={entryForm.type}
        category={entryForm.category}
        subCategory={entryForm.subCategory}
        merchant={entryForm.merchant}
        item={entryForm.item}
        amount={entryForm.amount}
        payment={entryForm.payment}
        cardCompany={entryForm.cardCompany}
        memo={entryForm.memo}
        quickInput={entryForm.quickInput}
        categoryOptions={entryForm.categoryOptions}
        categoryDetailOptions={entryForm.categoryDetailOptions}
        cardCompanyOptions={entryForm.cardCompanyOptions}
        onClose={entryForm.closeFormModal}
        onSetDate={setSelectedDate}
        onSetType={entryForm.handleTypeChange}
        onSetMember={entryForm.setMember}
        onSetCategory={entryForm.handleCategoryChange}
        onSetSubCategory={entryForm.setSubCategory}
        onSetMerchant={entryForm.setMerchant}
        onSetItem={entryForm.setItem}
        onSetAmount={entryForm.setAmount}
        onSetPayment={entryForm.handlePaymentChange}
        onSetCardCompany={entryForm.setCardCompany}
        onSetMemo={entryForm.setMemo}
        onSetQuickInput={entryForm.setQuickInput}
        onApplyQuickInput={entryForm.applyQuickInput}
        onSubmit={entryForm.onSubmitEntry}
      />
    </StPage>
  );
}
