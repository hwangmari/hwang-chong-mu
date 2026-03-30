"use client";

import { supabase } from "@/lib/supabase";
import { DailyNotebookConfig, DailyNotebookEntry } from "./storage";

interface DailyNotebookRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface DailyEntryRow {
  entry_date: string;
  diary: string;
  checks: unknown;
}

function normalizeChecklist(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeNotebook(row: DailyNotebookRow): DailyNotebookConfig {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEntry(row: DailyEntryRow): DailyNotebookEntry {
  return {
    date: row.entry_date,
    diary: row.diary ?? "",
    checks: Array.isArray(row.checks) ? row.checks.map((item) => Boolean(item)) : [],
  };
}

export async function createDailyNotebook(
  title: string,
  accessCode: string,
  initialMonthKey: string,
  initialChecklist: string[],
) {
  const { data, error } = await supabase.rpc("daily_create_notebook", {
    p_title: title,
    p_access_code: accessCode,
    p_initial_month_key: initialMonthKey,
    p_initial_checklist: initialChecklist,
  });

  if (error) {
    throw error;
  }

  return String(data);
}

export async function fetchDailyNotebook(notebookId: string, accessCode: string) {
  const { data, error } = await supabase.rpc("daily_get_notebook", {
    p_notebook_id: notebookId,
    p_access_code: accessCode,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? (data[0] as DailyNotebookRow | undefined) : undefined;
  if (!row) {
    throw new Error("Notebook not found");
  }

  return normalizeNotebook(row);
}

export async function fetchDailyMonthlyChecklist(
  notebookId: string,
  monthKey: string,
  accessCode: string,
) {
  const { data, error } = await supabase.rpc("daily_get_monthly_checklist", {
    p_notebook_id: notebookId,
    p_month_key: monthKey,
    p_access_code: accessCode,
  });

  if (error) {
    throw error;
  }

  return normalizeChecklist(data);
}

export async function saveDailyMonthlyChecklist(
  notebookId: string,
  monthKey: string,
  checklist: string[],
  accessCode: string,
) {
  const { error } = await supabase.rpc("daily_upsert_monthly_checklist", {
    p_notebook_id: notebookId,
    p_month_key: monthKey,
    p_checklist: checklist,
    p_access_code: accessCode,
  });

  if (error) {
    throw error;
  }
}

export async function fetchDailyMonthEntries(
  notebookId: string,
  monthKey: string,
  accessCode: string,
) {
  const { data, error } = await supabase.rpc("daily_get_month_entries", {
    p_notebook_id: notebookId,
    p_month_key: monthKey,
    p_access_code: accessCode,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data)
    ? (data as DailyEntryRow[]).map(normalizeEntry)
    : [];
}

export async function saveDailyEntry(
  notebookId: string,
  entryDate: string,
  diary: string,
  checks: boolean[],
  accessCode: string,
) {
  const { error } = await supabase.rpc("daily_upsert_entry", {
    p_notebook_id: notebookId,
    p_entry_date: entryDate,
    p_diary: diary,
    p_checks: checks,
    p_access_code: accessCode,
  });

  if (error) {
    throw error;
  }
}

export async function changeDailyAccessCode(
  notebookId: string,
  currentAccessCode: string,
  nextAccessCode: string,
) {
  const { error } = await supabase.rpc("daily_change_access_code", {
    p_notebook_id: notebookId,
    p_old_access_code: currentAccessCode,
    p_new_access_code: nextAccessCode,
  });

  if (error) {
    throw error;
  }
}
