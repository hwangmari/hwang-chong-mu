"use client";

import { useCallback, useEffect, useState } from "react";
import { getListMemoStorageKey } from "./helpers";

type Params = {
  workspaceId: string;
  currentMonthKey: string;
  serverMonthlyMemo: string;
  onSaveMonthlyMemo: (
    monthKey: string,
    memo: string,
  ) => boolean | Promise<boolean>;
};

export function useListMemo({
  workspaceId,
  currentMonthKey,
  serverMonthlyMemo,
  onSaveMonthlyMemo,
}: Params) {
  const [listMemo, setListMemo] = useState("");
  const [listMemoDraft, setListMemoDraft] = useState("");
  const [isListMemoEditing, setIsListMemoEditing] = useState(true);

  useEffect(() => {
    const storedMemo =
      typeof window === "undefined"
        ? ""
        : window.localStorage.getItem(
            getListMemoStorageKey(workspaceId, currentMonthKey),
          ) || "";
    const nextMemo = serverMonthlyMemo || storedMemo || "";
    setListMemo(nextMemo);
    setListMemoDraft(nextMemo);
    setIsListMemoEditing(nextMemo.length === 0);
  }, [currentMonthKey, serverMonthlyMemo, workspaceId]);

  const saveListMemo = useCallback(async () => {
    const nextMemo = listMemoDraft.trim();
    const saved = await Promise.resolve(
      onSaveMonthlyMemo(currentMonthKey, nextMemo),
    );
    if (!saved) {
      return;
    }
    setListMemo(nextMemo);
    setListMemoDraft(nextMemo);
    setIsListMemoEditing(false);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getListMemoStorageKey(workspaceId, currentMonthKey),
      nextMemo,
    );
  }, [currentMonthKey, listMemoDraft, onSaveMonthlyMemo, workspaceId]);

  const startListMemoEdit = useCallback(() => {
    setListMemoDraft(listMemo);
    setIsListMemoEditing(true);
  }, [listMemo]);

  return {
    listMemoDraft,
    isListMemoEditing,
    setListMemoDraft,
    saveListMemo,
    startListMemoEdit,
  };
}
