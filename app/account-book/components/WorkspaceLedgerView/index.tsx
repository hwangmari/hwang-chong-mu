"use client";

import { useMemo, useState } from "react";
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
import WorkspaceInfoBar from "./WorkspaceInfoBar";
import WorkspacePanelsSection from "./WorkspacePanelsSection";
import {
  ALL_PARTICIPANTS_ID,
  CARD_COMPANY_DEFAULT,
  CATEGORY_OPTIONS,
  MEMBER_FALLBACK,
  createEntryId,
  extractImageCandidatesFromText,
  formatAmount,
  formatPreviewDate,
  formatSelectedDateTitle,
  getAccountEntryDuplicateKey,
  inferAssetSubCategoryFromText,
  inferCategoryFromItemText,
  parseAmountValue,
  parseIsoDate,
  parseNaturalInputEntry,
  parseQuickDate,
  paymentLabel,
  toIsoDate,
  toPaymentValue,
} from "./utils";

export { createWorkspaceSeedEntries } from "./utils";

export default function WorkspaceLedgerView({
  workspace,
  users,
  entries,
  shareTargets,
  isEntryShared,
  onToggleShare,
  onSaveEntry,
  onDeleteEntry,
  onLoadSeed,
  onBack,
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
  const [viewMode, setViewMode] = useState<ViewMode>("ledger");
  const [selectedBoardColumnId, setSelectedBoardColumnId] = useState("living");

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
  const [category, setCategory] = useState("식비/외식");
  const [subCategory, setSubCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentType>("card");
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
  const monthRangeLabel = `${format(currentMonth, "M.1", { locale: ko })} - ${format(endOfMonth(currentMonth), "M.d", { locale: ko })}`;
  const selectedYear = format(currentMonth, "yyyy");
  const isSharedWorkspace = workspace.type === "shared";
  const selectedParticipant = useMemo(
    () => memberUsers.find((user) => user.id === selectedParticipantId) || null,
    [memberUsers, selectedParticipantId],
  );
  const selectedParticipantLabel =
    isSharedWorkspace
      ? selectedParticipant?.name || ""
      : selectedParticipant?.name || workspace.name;
  const workspaceTitle = isSharedWorkspace
    ? `${workspace.name} · ${format(currentMonth, "yyyy년 M월", { locale: ko })}`
    : `${workspace.name} · ${selectedParticipantLabel} · ${format(currentMonth, "yyyy년 M월", { locale: ko })}`;
  const ledgerDetailTitle = isSharedWorkspace
    ? `${format(currentMonth, "M월", { locale: ko })} 전체 내역`
    : `${format(currentMonth, "M월", { locale: ko })} 전체 내역 · ${selectedParticipantLabel}`;
  const boardMonthLabel = isSharedWorkspace
    ? `${workspace.name} · ${format(currentMonth, "yyyy년 M월", { locale: ko })}`
    : `${format(currentMonth, "yyyy년 M월", { locale: ko })} · ${selectedParticipantLabel}`;
  const calendarDetailTitle = isSharedWorkspace
    ? formatSelectedDateTitle(selectedDate)
    : `${formatSelectedDateTitle(selectedDate)} · ${selectedParticipantLabel}`;

  const visibleEntries = useMemo(() => {
    if (
      !isSharedWorkspace ||
      selectedParticipantId === ALL_PARTICIPANTS_ID
    ) {
      return entries;
    }

    const participantName = selectedParticipant?.name;
    return entries.filter(
      (entry) =>
        entry.createdByUserId === selectedParticipantId ||
        (participantName ? entry.member === participantName : false),
    );
  }, [entries, isSharedWorkspace, selectedParticipant, selectedParticipantId]);

  const monthEntries = useMemo(() => {
    const ym = format(currentMonth, "yyyy-MM");
    return visibleEntries.filter((entry) => entry.date.startsWith(ym));
  }, [currentMonth, visibleEntries]);

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
        (entry) => entry.type === "expense" && entry.category.trim() !== "저축",
      )
      .reduce<Record<string, number>>((acc, entry) => {
        const key = entry.member || defaultMember;
        acc[key] = (acc[key] || 0) + entry.amount;
        return acc;
      }, {});

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [defaultMember, monthEntries]);

  const cashBalance =
    monthCashFlowTotals.incomeCash - monthCashFlowTotals.expenseCash;

  const monthAssetTotal = useMemo(() => {
    return monthEntries
      .filter((entry) => entry.type === "expense")
      .filter((entry) => entry.category.trim() === "저축")
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [monthEntries]);

  const monthCategorySummary = useMemo(() => {
    return Object.entries(
      monthEntries.reduce<Record<string, number>>((acc, entry) => {
        const key =
          entry.type === "income"
            ? "수입"
            : entry.category.trim() === "저축"
              ? "자산/저축"
              : entry.category;
        acc[key] = (acc[key] || 0) + entry.amount;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [monthEntries]);

  const selectedDateEntries = useMemo(() => {
    return visibleEntries
      .filter(
        (entry) =>
          !(entry.type === "expense" && entry.category.trim() === "저축"),
      )
      .filter((entry) => entry.date === selectedDate)
      .sort((a, b) => b.amount - a.amount);
  }, [selectedDate, visibleEntries]);

  const selectedDateAssetEntries = useMemo(() => {
    return visibleEntries
      .filter((entry) => entry.date === selectedDate)
      .filter((entry) => entry.type === "expense")
      .filter((entry) => entry.category.trim() === "저축")
      .sort((a, b) => b.amount - a.amount);
  }, [selectedDate, visibleEntries]);

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
        matches: (entry: ResolvedAccountEntry) =>
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
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          ["교통/택시", "주차/교통", "통행료", "교통카드/충전"].includes(
            entry.category,
          ),
      },
      {
        id: "shopping",
        title: "쇼핑/여가",
        description: "쇼핑, 여행, 취향 소비",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" &&
          ["쇼핑/패션", "쇼핑/기타", "여행/관광"].includes(entry.category),
      },
      {
        id: "special",
        title: "특별/기타",
        description: "선물, 이벤트, 기타 지출",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" && ["선물/기타"].includes(entry.category),
      },
      {
        id: "asset",
        title: "자산/저축",
        description: "예금, 적금, 투자",
        matches: (entry: ResolvedAccountEntry) =>
          entry.type === "expense" && entry.category.trim() === "저축",
      },
      {
        id: "income",
        title: "수입",
        description: "입금, 월급, 환급",
        matches: (entry: ResolvedAccountEntry) => entry.type === "income",
      },
    ];

    return columnDefs.map((columnDef) => {
      const columnEntries = monthEntries.filter((entry) =>
        columnDef.matches(entry),
      );
      return {
        id: columnDef.id,
        title: columnDef.title,
        description: columnDef.description,
        totalAmount: columnEntries.reduce(
          (sum, entry) => sum + entry.amount,
          0,
        ),
        cards: columnEntries.map((entry) => ({ amount: entry.amount })),
      };
    });
  }, [monthEntries]);

  const monthlyBoardDetailEntries = useMemo(() => {
    const groups: Record<string, ResolvedAccountEntry[]> = {
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

    return groups;
  }, [monthEntries]);

  const effectiveBoardColumnId = useMemo(() => {
    if (selectedBoardColumnId in monthlyBoardDetailEntries) {
      return selectedBoardColumnId;
    }
    return monthlyBoardColumns[0]?.id || "living";
  }, [monthlyBoardColumns, monthlyBoardDetailEntries, selectedBoardColumnId]);

  const selectedBoardColumn = useMemo(() => {
    return (
      monthlyBoardColumns.find(
        (column) => column.id === effectiveBoardColumnId,
      ) ||
      monthlyBoardColumns[0] ||
      null
    );
  }, [effectiveBoardColumnId, monthlyBoardColumns]);
  const boardDetailTitle = selectedBoardColumn
    ? isSharedWorkspace
      ? `${format(currentMonth, "M월", { locale: ko })} ${selectedBoardColumn.title} 상세`
      : `${format(currentMonth, "M월", { locale: ko })} ${selectedParticipantLabel} ${selectedBoardColumn.title} 상세`
    : "보드 상세";

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
    () => entries.find((entry) => entry.id === editingEntryId) || null,
    [editingEntryId, entries],
  );
  const existingEntryDuplicateKeys = useMemo(
    () => new Set(entries.map((entry) => getAccountEntryDuplicateKey(entry))),
    [entries],
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
      setCategory(nextType === "income" ? "월급" : "식비/외식");
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
    setIsFormModalOpen(true);
  };

  const openEditModal = (entry: ResolvedAccountEntry) => {
    if (entry.readonly) return;
    setEditingEntryId(entry.id);
    setSelectedDate(entry.date);
    setType(entry.type);
    setMember(entry.member || defaultMember);
    setCategory(entry.category);
    setSubCategory(entry.subCategory || "");
    setMerchant(entry.merchant || "");
    setItem(entry.item);
    setAmount(String(entry.amount));
    setPayment(entry.payment);
    setMemo(entry.memo);
    setDraftRawText(entry.rawText || "");
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
    if (
      type === "expense" &&
      category.trim() === "저축" &&
      !subCategory.trim()
    ) {
      alert("저축 세부카테고리를 입력해주세요.");
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

    const payload: AccountEntry = {
      id: editingEntryId || createEntryId(),
      date: selectedDate,
      member,
      workspaceId: workspace.id,
      createdByUserId: matchedUser.id,
      type,
      category: category.trim(),
      subCategory:
        type === "expense" && category.trim() === "저축"
          ? subCategory.trim()
          : "",
      merchant: merchant.trim(),
      item: item.trim(),
      amount: Math.trunc(parsedAmount),
      cardCompany: CARD_COMPANY_DEFAULT,
      payment: type === "income" ? "cash" : payment,
      memo: memo.trim(),
      rawText: draftRawText.trim() || editingEntry?.rawText || "",
    };

    onSaveEntry(payload);
    closeFormModal();
  };

  const applyQuickInput = () => {
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
      (defaultType === "income" ? "월급" : "식비/외식");

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
          subCategory:
            nextCategory === "저축"
              ? inferAssetSubCategoryFromText(segment)
              : "",
          merchant: "",
          item: cleanedItem || "미입력",
          amount: parsedAmount,
          cardCompany: CARD_COMPANY_DEFAULT,
          payment:
            segment.includes("수입") || defaultType === "income"
              ? "cash"
              : toPaymentValue(segment) || defaultPayment,
          memo: "",
          rawText: segment,
        } satisfies AccountEntry;
      })
      .filter(Boolean) as AccountEntry[];

    if (parsedEntries.length === 0) {
      alert("입력 포맷을 인식하지 못했어요. 예: 식당 30000, 택시 12000");
      return;
    }

    parsedEntries.forEach((entry) => onSaveEntry(entry));
    setQuickInput("");
    if (parsedEntries.length === 1) {
      const first = parsedEntries[0];
      setSelectedDate(first.date);
      setMember(first.member || defaultMember);
      setType(first.type);
      setCategory(first.category);
      setSubCategory(first.subCategory || "");
      setMerchant(first.merchant || "");
      setAmount(String(first.amount));
      setItem(first.item);
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

  const saveExtractedImageEntries = (
    candidates: ExtractedImageEntryCandidate[],
  ) => {
    if (candidates.length === 0) {
      alert("저장할 추출 후보가 없어요.");
      return;
    }

    const matchedUser =
      memberUsers.find((user) => user.name === (selectedParticipant?.name || defaultMember)) ||
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
        CATEGORY_OPTIONS.find((option) => option.label === candidate.category)?.label ||
        inferCategoryFromItemText(supportText) ||
        (nextType === "income" ? "월급" : "식비/외식");

      return {
        id: createEntryId(),
        date: parseQuickDate(candidate.date || candidate.rawText, selectedDate),
        member: selectedParticipant?.name || defaultMember,
        workspaceId: workspace.id,
        createdByUserId: matchedUser.id,
        type: nextType,
        category: normalizedCategory,
        subCategory:
          normalizedCategory === "저축"
            ? candidate.subCategory || inferAssetSubCategoryFromText(supportText)
            : "",
        merchant: candidate.merchant.trim(),
        item: (candidate.item || candidate.merchant || "미입력").trim(),
        amount: Math.max(0, Math.trunc(candidate.amount)),
        cardCompany: CARD_COMPANY_DEFAULT,
        payment:
          nextType === "income" ? "cash" : candidate.payment || "card",
        memo: candidate.memo.trim(),
        rawText: candidate.rawText.trim(),
      } satisfies AccountEntry;
    });

    const validEntries = nextEntries.filter((entry) => entry.amount > 0);
    if (validEntries.length === 0) {
      alert("금액이 인식된 후보가 없어서 저장할 수 없어요.");
      return;
    }

    validEntries.forEach((entry) => onSaveEntry(entry));
    setSelectedDate(validEntries[0].date);
    setCurrentMonth(startOfMonth(parseIsoDate(validEntries[0].date) || new Date()));
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
        error instanceof Error
          ? error.message
          : "무료 OCR 처리에 실패했어요.",
      );
    } finally {
      setIsExtractingImage(false);
    }
  };

  const submitNaturalInput = () => {
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

    parsedEntries.forEach((entry) => onSaveEntry(entry));

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

  return (
    <StPage>
      <WorkspaceHeader
        title={workspaceTitle}
        monthLabel={monthLabel}
        monthRangeLabel={monthRangeLabel}
        onBack={onBack}
        onMonthMove={onMonthMove}
        onLoadSeed={onLoadSeed}
      />
      <StContentWrap>
        <WorkspaceInfoBar
          workspaceType={workspace.type}
          memberNames={memberUsers.map((user) => user.name)}
          onOpenNaturalRegister={() => openRegisterModal("natural")}
          onOpenImageRegister={() => openRegisterModal("image")}
          onOpenManual={openManualEntryModal}
        />

        {isRegisterModalOpen ? (
          <NaturalInputSection
            mode={registerMode}
            currentMonth={currentMonth}
            monthEntriesCount={monthEntries.length}
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
          selectedDate={selectedDate}
          monthEntries={monthEntries}
          monthTotals={monthTotals}
          monthPaymentTotals={monthPaymentTotals}
          cashBalance={cashBalance}
          monthAssetTotal={monthAssetTotal}
          memberExpenseTotals={memberExpenseTotals}
          monthCategorySummary={monthCategorySummary}
          onOpenIncomeYearly={() =>
            router.push(
              `/account-book/annual?kind=income&year=${selectedYear}&workspaceId=${workspace.id}${workspace.type === "shared" && selectedParticipantId !== ALL_PARTICIPANTS_ID ? `&memberId=${selectedParticipantId}` : ""}`,
            )
          }
          onOpenExpenseYearly={() =>
            router.push(
              `/account-book/annual?kind=expense&year=${selectedYear}&workspaceId=${workspace.id}${workspace.type === "shared" && selectedParticipantId !== ALL_PARTICIPANTS_ID ? `&memberId=${selectedParticipantId}` : ""}`,
            )
          }
          onOpenAssetYearly={() =>
            router.push(
              `/account-book/annual?kind=asset&year=${selectedYear}&workspaceId=${workspace.id}${workspace.type === "shared" && selectedParticipantId !== ALL_PARTICIPANTS_ID ? `&memberId=${selectedParticipantId}` : ""}`,
            )
          }
          formatAmount={formatAmount}
          boardMonthLabel={boardMonthLabel}
          monthlyBoardColumns={monthlyBoardColumns}
          effectiveBoardColumnId={effectiveBoardColumnId}
          onSelectBoardColumn={setSelectedBoardColumnId}
          calendarDays={calendarDays}
          daySummary={daySummary}
          toIsoDate={toIsoDate}
          onSelectDate={setSelectedDate}
          ledgerDetailTitle={ledgerDetailTitle}
          boardDetailTitle={boardDetailTitle}
          calendarDetailTitle={calendarDetailTitle}
          selectedDateEntries={selectedDateEntries}
          selectedDateAssetEntries={selectedDateAssetEntries}
          monthlyBoardDetailEntries={monthlyBoardDetailEntries}
          onOpenAdd={() => openFormModal({ date: selectedDate })}
          onEdit={openEditModal}
          onDelete={onDeleteEntry}
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
        onSetMember={setMember}
        onSetCategory={(nextCategory) => {
          setCategory(nextCategory);
          if (nextCategory !== "저축") setSubCategory("");
        }}
        onSetSubCategory={setSubCategory}
        onSetMerchant={setMerchant}
        onSetItem={setItem}
        onSetAmount={setAmount}
        onSetPayment={setPayment}
        onSetMemo={setMemo}
        onSetQuickInput={setQuickInput}
        onApplyQuickInput={applyQuickInput}
        onSubmit={onSubmitEntry}
      />
    </StPage>
  );
}

const StPage = styled.main`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  overflow: hidden;
  overscroll-behavior: none;
  min-height: 100vh;
  background: #f3f6fb;
  display: flex;
  flex-direction: column;

  @media (max-width: 1080px) {
    overflow: auto;
  }
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
  flex: 1;
  min-height: 0;
  padding: 1rem;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: 0.8rem;
  overflow: hidden;

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
    overflow: visible;
  }
`;
