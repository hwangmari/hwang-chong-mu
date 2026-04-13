"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  changeDailyAccessCode,
  fetchDailyMonthEntries,
  fetchDailyMonthlyChecklist,
  fetchDailyNotebook,
  saveDailyEntry,
  saveDailyMonthlyChecklist,
} from "../repository";
import {
  DailyNotebookConfig,
  DailyNotebookEntry,
  buildMonthEntries,
  clearLegacyDailyLocalData,
  clearStoredDailyAccessCode,
  getMonthKey,
  getStoredDailyAccessCode,
  normalizeEntries,
  sanitizeChecklist,
  setStoredDailyAccessCode,
} from "../storage";
import { getErrorMessage } from "./helpers";

export function useDailyNotebook(notebookId: string | undefined) {
  const [notebook, setNotebook] = useState<DailyNotebookConfig | null>(null);
  const [entries, setEntries] = useState<DailyNotebookEntry[]>([]);
  const [monthChecklist, setMonthChecklist] = useState<string[]>([]);
  const [accessInput, setAccessInput] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [draftChecklistByMonth, setDraftChecklistByMonth] = useState<
    Record<string, string[]>
  >({});

  const monthKey = useMemo(() => getMonthKey(currentMonth), [currentMonth]);
  const draftChecklist = draftChecklistByMonth[monthKey] ?? monthChecklist;

  useEffect(() => {
    clearLegacyDailyLocalData();
    if (!notebookId) {
      setIsLoading(false);
      return;
    }
    setAccessCode(getStoredDailyAccessCode(notebookId));
  }, [notebookId]);

  useEffect(() => {
    let active = true;

    if (!notebookId) {
      setLoadError("기록장 ID가 올바르지 않아요.");
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    if (!accessCode) {
      setNotebook(null);
      setEntries([]);
      setMonthChecklist([]);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setLoadError("");

    void (async () => {
      try {
        const [nextNotebook, nextChecklistRaw, nextEntriesRaw] = await Promise.all([
          fetchDailyNotebook(notebookId, accessCode),
          fetchDailyMonthlyChecklist(notebookId, monthKey, accessCode),
          fetchDailyMonthEntries(notebookId, monthKey, accessCode),
        ]);

        if (!active) return;

        const nextChecklist = sanitizeChecklist(nextChecklistRaw);
        setNotebook(nextNotebook);
        setMonthChecklist(nextChecklist);
        setDraftChecklistByMonth((prev) => ({
          ...prev,
          [monthKey]: nextChecklist,
        }));
        setEntries(
          buildMonthEntries(monthKey, nextEntriesRaw, nextChecklist.length),
        );
        setStoredDailyAccessCode(notebookId, accessCode);
        setAccessError("");
        setLoadError("");
      } catch (error) {
        console.error("기록장 불러오기 실패:", error);
        if (!active) return;

        clearStoredDailyAccessCode(notebookId);
        setAccessCode("");
        setNotebook(null);
        setEntries([]);
        setMonthChecklist([]);
        setLoadError("기록장을 서버에서 불러오지 못했습니다.");
        setAccessError(
          getErrorMessage(
            error,
            "기록장 ID 또는 비밀번호를 다시 확인해주세요.",
          ),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accessCode, monthKey, notebookId]);

  const tryUnlock = useCallback(() => {
    const trimmedCode = accessInput.trim();
    if (!trimmedCode) {
      setAccessError("비밀번호를 입력해주세요.");
      return;
    }
    setAccessError("");
    setLoadError("");
    setAccessCode(trimmedCode);
  }, [accessInput]);

  const persistEntry = useCallback(
    async (entry: DailyNotebookEntry) => {
      if (!notebookId || !accessCode) return;
      try {
        await saveDailyEntry(
          notebookId,
          entry.date,
          entry.diary,
          entry.checks,
          accessCode,
        );
      } catch (error) {
        console.error("일일 기록 저장 실패:", error);
        throw error;
      }
    },
    [accessCode, notebookId],
  );

  const saveChecklist = useCallback(async () => {
    if (!notebookId || !accessCode) return;

    const nextChecklist = sanitizeChecklist(draftChecklist);
    if (nextChecklist.length === 0) {
      alert("체크리스트를 1개 이상 입력해주세요.");
      return;
    }

    try {
      await saveDailyMonthlyChecklist(
        notebookId,
        monthKey,
        nextChecklist,
        accessCode,
      );
      setMonthChecklist(nextChecklist);
      setDraftChecklistByMonth((prev) => ({
        ...prev,
        [monthKey]: nextChecklist,
      }));
      setEntries((prev) => normalizeEntries(prev, nextChecklist.length));
    } catch (error) {
      console.error("체크리스트 저장 실패:", error);
      alert("체크리스트를 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [accessCode, draftChecklist, monthKey, notebookId]);

  const addChecklistItem = useCallback(() => {
    setDraftChecklistByMonth((prev) => ({
      ...prev,
      [monthKey]: [...draftChecklist, ""],
    }));
  }, [draftChecklist, monthKey]);

  const updateChecklistItem = useCallback(
    (index: number, value: string) => {
      setDraftChecklistByMonth((prev) => ({
        ...prev,
        [monthKey]: draftChecklist.map((item, current) =>
          current === index ? value : item,
        ),
      }));
    },
    [draftChecklist, monthKey],
  );

  const removeChecklistItem = useCallback(
    (index: number) => {
      setDraftChecklistByMonth((prev) => ({
        ...prev,
        [monthKey]: draftChecklist.filter((_, current) => current !== index),
      }));
    },
    [draftChecklist, monthKey],
  );

  const updateDiary = useCallback((entryDate: string, diary: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.date === entryDate ? { ...entry, diary } : entry,
      ),
    );
  }, []);

  const saveDiary = useCallback(
    async (entryDate: string) => {
      const targetEntry = entries.find((entry) => entry.date === entryDate);
      if (!targetEntry) return;
      try {
        await persistEntry(targetEntry);
      } catch {
        alert("기록을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    },
    [entries, persistEntry],
  );

  const toggleCheck = useCallback(
    async (entryDate: string, checkIndex: number) => {
      const currentEntry = entries.find((entry) => entry.date === entryDate);
      if (!currentEntry) return;

      const nextEntry: DailyNotebookEntry = {
        ...currentEntry,
        checks: currentEntry.checks.map((check, index) =>
          index === checkIndex ? !check : check,
        ),
      };

      setEntries((prev) =>
        prev.map((entry) => (entry.date === entryDate ? nextEntry : entry)),
      );

      try {
        await persistEntry(nextEntry);
      } catch {
        setEntries((prev) =>
          prev.map((entry) => (entry.date === entryDate ? currentEntry : entry)),
        );
      }
    },
    [entries, persistEntry],
  );

  const changeAccessCode = useCallback(
    async (nextCode: string) => {
      if (!notebookId || !accessCode) return false;
      const code = nextCode.trim();
      if (code.length < 4) {
        return { ok: false as const, message: "새 비밀번호는 4자 이상 입력해주세요." };
      }
      try {
        await changeDailyAccessCode(notebookId, accessCode, code);
        setStoredDailyAccessCode(notebookId, code);
        setAccessCode(code);
        return { ok: true as const };
      } catch (error) {
        console.error("비밀번호 변경 실패:", error);
        return {
          ok: false as const,
          message: "비밀번호를 변경하지 못했어요. 다시 시도해주세요.",
        };
      }
    },
    [accessCode, notebookId],
  );

  const shiftMonth = useCallback((offset: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  }, []);

  const jumpToCurrentMonth = useCallback(() => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  return {
    notebook,
    entries,
    monthChecklist,
    accessInput,
    setAccessInput,
    accessCode,
    accessError,
    isLoading,
    loadError,
    currentMonth,
    monthKey,
    draftChecklist,
    tryUnlock,
    saveChecklist,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    updateDiary,
    saveDiary,
    toggleCheck,
    changeAccessCode,
    shiftMonth,
    jumpToCurrentMonth,
  };
}
