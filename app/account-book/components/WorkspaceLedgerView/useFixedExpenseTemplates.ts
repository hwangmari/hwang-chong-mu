"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import { AccountEntry, ResolvedAccountEntry } from "../../types";
import {
  FixedExpenseTemplate,
  buildFixedExpenseEntry,
  buildFixedExpenseTemplate,
  extractFixedExpenseTemplateId,
  readFixedExpenseTemplates,
  writeFixedExpenseTemplates,
} from "./fixedExpense";
import { isFixedExpenseCategory, parseIsoDate } from "./utils";

type Params = {
  workspaceId: string;
  entries: ResolvedAccountEntry[];
  currentMonth: Date;
  onSaveEntry: (entry: AccountEntry) => boolean | Promise<boolean>;
};

export function useFixedExpenseTemplates({
  workspaceId,
  entries,
  currentMonth,
  onSaveEntry,
}: Params) {
  const [templates, setTemplates] = useState<FixedExpenseTemplate[]>([]);
  const syncRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setTemplates(readFixedExpenseTemplates(workspaceId));
    syncRef.current.clear();
  }, [workspaceId]);

  useEffect(() => {
    if (templates.length === 0) return;

    const directWorkspaceEntries = entries.filter((entry) => !entry.readonly);
    const targetMonth = startOfMonth(currentMonth);
    let cancelled = false;

    const syncFixedExpenses = async () => {
      const pendingEntries: AccountEntry[] = [];

      for (const template of templates) {
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

          if (!alreadyExists && !syncRef.current.has(syncKey)) {
            syncRef.current.add(syncKey);
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
  }, [currentMonth, entries, templates, onSaveEntry]);

  const syncTemplateState = useCallback(
    (updater: (prev: FixedExpenseTemplate[]) => FixedExpenseTemplate[]) => {
      setTemplates((prev) => {
        const next = updater(prev);
        writeFixedExpenseTemplates(workspaceId, next);
        return next;
      });
    },
    [workspaceId],
  );

  const upsertTemplate = useCallback(
    (entry: AccountEntry, templateId: string) => {
      syncTemplateState((prev) => {
        const existing = prev.find((template) => template.id === templateId);
        const nextTemplate = {
          ...buildFixedExpenseTemplate(entry, templateId),
          startDate: existing?.startDate || entry.date,
        };
        const rest = prev.filter((template) => template.id !== templateId);
        return [nextTemplate, ...rest];
      });
    },
    [syncTemplateState],
  );

  const removeTemplate = useCallback(
    (templateId: string | null) => {
      if (!templateId) return;
      syncTemplateState((prev) =>
        prev.filter((template) => template.id !== templateId),
      );
    },
    [syncTemplateState],
  );

  return { templates, upsertTemplate, removeTemplate };
}
