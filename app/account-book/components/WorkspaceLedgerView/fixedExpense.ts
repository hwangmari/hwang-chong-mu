import { endOfMonth } from "date-fns";
import { AccountEntry, PaymentType } from "../../types";
import { createEntryId, parseIsoDate, toIsoDate } from "./utils";

export const FIXED_EXPENSE_CATEGORIES = ["고정비"] as const;
export const DEFAULT_ANNUAL_SAVING_GOAL = 1_200_000;
export const FIXED_EXPENSE_STORAGE_PREFIX = "hwang-account-book-fixed-expense";
export const DEFAULT_HIDDEN_CALENDAR_AMOUNT_CARD_IDS = [
  "income",
  "cash_balance",
  "asset",
] as const;

export type FixedExpenseTemplate = {
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

export function getFixedExpenseStorageKey(workspaceId: string) {
  return `${FIXED_EXPENSE_STORAGE_PREFIX}-${workspaceId}`;
}

export function createFixedExpenseTemplateId() {
  return `fixed-${Math.random().toString(36).slice(2, 10)}`;
}

export function extractFixedExpenseTemplateId(rawText?: string) {
  const match = rawText?.match(/#fixed-template:([a-z0-9-]+)/i);
  return match?.[1] || null;
}

export function stripFixedExpenseMeta(rawText?: string) {
  return (rawText || "")
    .replace(/\s*#fixed-template:[a-z0-9-]+\s*/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function attachFixedExpenseMeta(rawText: string, templateId: string) {
  const baseText = stripFixedExpenseMeta(rawText);
  return [baseText, `#fixed-template:${templateId}`].filter(Boolean).join("\n");
}

export function readFixedExpenseTemplates(
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

export function writeFixedExpenseTemplates(
  workspaceId: string,
  templates: FixedExpenseTemplate[],
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getFixedExpenseStorageKey(workspaceId),
    JSON.stringify(templates),
  );
}

export function buildFixedExpenseTemplate(
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

export function buildFixedExpenseEntry(
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
