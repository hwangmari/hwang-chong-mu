"use client";

import { useCallback, useMemo, useState } from "react";
import { startOfMonth } from "date-fns";
import {
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  EntryType,
} from "../../types";
import type { ExtractedImageEntryCandidate } from "./types";
import {
  CATEGORY_OPTIONS,
  INCOME_CATEGORY_LABEL,
  createEntryId,
  extractImageCandidatesFromText,
  getDefaultCardCompany,
  inferCardCompanyFromText,
  inferCategoryFromItemText,
  inferSubCategoryFromText,
  normalizeExpenseCategorySelection,
  parseIsoDate,
  parseNaturalInputEntry,
  parseQuickDate,
} from "./utils";

type Params = {
  workspace: AccountBookWorkspace;
  users: AccountBookUser[];
  memberUsers: AccountBookUser[];
  defaultMember: string;
  selectedParticipant: AccountBookUser | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedCalendarCardId: (id: string | null) => void;
  onSaveEntry: (entry: AccountEntry) => boolean | Promise<boolean>;
};

export function useRegisterModal({
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
}: Params) {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<"natural" | "image">(
    "natural",
  );
  const [naturalInput, setNaturalInput] = useState("");
  const [ocrFileName, setOcrFileName] = useState("");
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [extractedImageEntries, setExtractedImageEntries] = useState<
    ExtractedImageEntryCandidate[]
  >([]);

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

  const clearExtractedImageEntries = useCallback(() => {
    setOcrErrorMessage("");
    setOcrFileName("");
    setExtractedImageEntries([]);
  }, []);

  const closeRegisterModal = useCallback(() => {
    setIsRegisterModalOpen(false);
    clearExtractedImageEntries();
  }, [clearExtractedImageEntries]);

  const openRegisterModal = useCallback((mode: "natural" | "image") => {
    setRegisterMode(mode);
    setIsRegisterModalOpen(true);
  }, []);

  const openNaturalRegisterForDate = useCallback(
    (date: string) => {
      setSelectedCalendarCardId(null);
      setSelectedDate(date);
      setCurrentMonth(startOfMonth(parseIsoDate(date) || new Date()));
      openRegisterModal("natural");
    },
    [
      openRegisterModal,
      setCurrentMonth,
      setSelectedCalendarCardId,
      setSelectedDate,
    ],
  );

  const saveExtractedImageEntries = useCallback(
    async (candidates: ExtractedImageEntryCandidate[]) => {
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
          CATEGORY_OPTIONS.find(
            (option) => option.label === candidate.category,
          )?.label ||
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
              : inferCardCompanyFromText(supportText, nextPayment) ||
                getDefaultCardCompany(nextPayment),
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
    },
    [
      closeRegisterModal,
      defaultMember,
      memberUsers,
      onSaveEntry,
      selectedDate,
      selectedParticipant,
      setCurrentMonth,
      setSelectedDate,
      users,
      workspace.id,
    ],
  );

  const extractEntriesFromImage = useCallback(
    async (file: File) => {
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
    },
    [defaultMember, memberUsers, selectedDate, users, workspace.id],
  );

  const submitNaturalInput = useCallback(async () => {
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
  }, [
    closeRegisterModal,
    defaultMember,
    memberUsers,
    naturalInput,
    onSaveEntry,
    selectedDate,
    setCurrentMonth,
    setSelectedDate,
    users,
    workspace.id,
  ]);

  return {
    isRegisterModalOpen,
    registerMode,
    naturalInput,
    naturalPreview,
    extractedImageEntries,
    ocrFileName,
    ocrErrorMessage,
    isExtractingImage,
    setNaturalInput,
    openRegisterModal,
    closeRegisterModal,
    openNaturalRegisterForDate,
    extractEntriesFromImage,
    saveExtractedImageEntries,
    clearExtractedImageEntries,
    submitNaturalInput,
  };
}
