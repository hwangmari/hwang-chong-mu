"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  EntryType,
  PaymentType,
  ResolvedAccountEntry,
} from "../../types";
import {
  attachFixedExpenseMeta,
  createFixedExpenseTemplateId,
  extractFixedExpenseTemplateId,
  stripFixedExpenseMeta,
} from "./fixedExpense";
import { resolveEntryItemLabel } from "./helpers";
import {
  CATEGORY_OPTIONS,
  INCOME_CATEGORY_LABEL,
  INCOME_CATEGORY_OPTIONS,
  createEntryId,
  getCardCompanyOptions,
  getCategoryDetailOptions,
  getDefaultCardCompany,
  getRepresentativeCategory,
  inferCardCompanyFromText,
  inferCategoryFromItemText,
  inferSubCategoryFromText,
  normalizeExpenseCategorySelection,
  parseAmountValue,
  parseQuickDate,
  toPaymentValue,
} from "./utils";

type Params = {
  workspace: AccountBookWorkspace;
  users: AccountBookUser[];
  memberUsers: AccountBookUser[];
  defaultMember: string;
  selectedParticipant: AccountBookUser | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  entriesWithPermissions: ResolvedAccountEntry[];
  onSaveEntry: (entry: AccountEntry) => boolean | Promise<boolean>;
  upsertFixedExpenseTemplate: (entry: AccountEntry, templateId: string) => void;
  removeFixedExpenseTemplate: (templateId: string | null) => void;
};

export function useEntryForm({
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
}: Params) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [type, setType] = useState<EntryType>("expense");
  const [member, setMember] = useState(defaultMember);
  const [category, setCategory] = useState("생활비");
  const [subCategory, setSubCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentType>("card");
  const [cardCompany, setCardCompany] = useState(getDefaultCardCompany("card"));
  const [memo, setMemo] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [draftRawText, setDraftRawText] = useState("");

  const editingEntry = useMemo(
    () =>
      entriesWithPermissions.find((entry) => entry.id === editingEntryId) ||
      null,
    [editingEntryId, entriesWithPermissions],
  );
  const categoryDetailOptions = useMemo(
    () => getCategoryDetailOptions(category),
    [category],
  );
  const cardCompanyOptions = useMemo(
    () => getCardCompanyOptions(payment),
    [payment],
  );
  const categoryOptions = useMemo(
    () => (type === "income" ? INCOME_CATEGORY_OPTIONS : CATEGORY_OPTIONS),
    [type],
  );

  const handleTypeChange = useCallback(
    (nextType: EntryType) => {
      setType(nextType);
      if (nextType === "income") setCategory(INCOME_CATEGORY_LABEL);
      if (nextType === "expense" && category === INCOME_CATEGORY_LABEL)
        setCategory("생활비");
      if (nextType !== "expense") setSubCategory("");
      if (nextType === "income") {
        setPayment("cash");
        setCardCompany(getDefaultCardCompany("cash"));
      }
      if (nextType === "expense" && payment === "cash") {
        setPayment("card");
        setCardCompany(getDefaultCardCompany("card"));
      }
    },
    [category, payment],
  );

  const handleCategoryChange = useCallback((nextCategory: string) => {
    setCategory(nextCategory);
    setSubCategory("");
  }, []);

  const handlePaymentChange = useCallback(
    (nextPayment: PaymentType) => {
      setPayment(nextPayment);
      if (nextPayment === "cash") {
        setCardCompany(getDefaultCardCompany("cash"));
        return;
      }
      if (nextPayment === "check_card") {
        setCardCompany(getDefaultCardCompany("check_card"));
        return;
      }
      const nextOptions = getCardCompanyOptions(nextPayment);
      if (!nextOptions.includes(cardCompany)) {
        setCardCompany(getDefaultCardCompany(nextPayment));
      }
    },
    [cardCompany],
  );

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingEntryId(null);
    setQuickInput("");
    setDraftRawText("");
  }, []);

  const openFormModal = useCallback(
    ({ date, nextType }: { date?: string; nextType?: EntryType }) => {
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
      setCardCompany(
        getDefaultCardCompany(nextType === "income" ? "cash" : "card"),
      );
      setIsFormModalOpen(true);
    },
    [defaultMember, selectedParticipant, setSelectedDate],
  );

  const openEditModal = useCallback(
    (entry: ResolvedAccountEntry) => {
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
      setCardCompany(entry.cardCompany || getDefaultCardCompany(entry.payment));
      setMemo(entry.memo);
      setDraftRawText(entry.rawText || "");
      setIsFormModalOpen(true);
    },
    [defaultMember, setSelectedDate],
  );

  const onSubmitEntry = useCallback(async () => {
    const parsedAmount = Number(amount);
    if (!category.trim()) {
      alert("카테고리를 입력해주세요.");
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
    const resolvedPayment =
      type === "expense" && normalizedCategory === "카드대금" ? "cash" : payment;
    if (
      type === "expense" &&
      resolvedPayment !== "cash" &&
      !cardCompany.trim()
    ) {
      alert("카드 결제 내역은 카드사를 선택해주세요.");
      return;
    }
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
        type === "expense" && resolvedPayment !== "cash"
          ? cardCompany.trim() || getDefaultCardCompany(resolvedPayment)
          : "",
      payment: type === "income" ? "cash" : resolvedPayment,
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
  }, [
    amount,
    cardCompany,
    category,
    closeFormModal,
    draftRawText,
    editingEntry,
    editingEntryId,
    item,
    member,
    memberUsers,
    memo,
    merchant,
    onSaveEntry,
    payment,
    removeFixedExpenseTemplate,
    selectedDate,
    subCategory,
    type,
    upsertFixedExpenseTemplate,
    users,
    workspace.id,
  ]);

  const applyQuickInput = useCallback(async () => {
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
              : inferCardCompanyFromText(segment, nextPayment) ||
                getDefaultCardCompany(nextPayment),
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
      setCardCompany(first.cardCompany || getDefaultCardCompany(first.payment));
      setDraftRawText(first.rawText || "");
      return;
    }
    alert(`${parsedEntries.length}건을 한 번에 추가했어요.`);
  }, [
    defaultMember,
    memberUsers,
    onSaveEntry,
    quickInput,
    selectedDate,
    setSelectedDate,
    users,
    workspace.id,
  ]);

  return {
    isFormModalOpen,
    editingEntryId,
    editingEntry,
    type,
    member,
    category,
    subCategory,
    merchant,
    item,
    amount,
    payment,
    cardCompany,
    memo,
    quickInput,
    draftRawText,
    categoryDetailOptions,
    cardCompanyOptions,
    categoryOptions,
    setMember,
    setSubCategory,
    setMerchant,
    setItem,
    setAmount,
    setCardCompany,
    setMemo,
    setQuickInput,
    handleTypeChange,
    handleCategoryChange,
    handlePaymentChange,
    closeFormModal,
    openFormModal,
    openEditModal,
    onSubmitEntry,
    applyQuickInput,
  };
}
