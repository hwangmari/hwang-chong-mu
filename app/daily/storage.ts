export interface DailyNotebookConfig {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyNotebookEntry {
  date: string;
  diary: string;
  checks: boolean[];
}

const LEGACY_NOTEBOOKS_KEY = "daily-notebooks";
const LEGACY_ENTRIES_PREFIX = "daily-notebook-entries:";
const LEGACY_UNLOCK_PREFIX = "daily-unlocked:";
const ACCESS_CODE_PREFIX = "daily-access-code:";

function isBrowser() {
  return typeof window !== "undefined";
}

export function sanitizeChecklist(items: string[]) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : ["기본 항목"];
}

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getTodayDateKey() {
  return formatDate(new Date());
}

export function toDateLabel(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${month}.${day}`;
}

export function buildMonthDates(monthKey: string): string[] {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return [];
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    return formatDate(date);
  });
}

export function normalizeEntries(
  entries: DailyNotebookEntry[],
  checkCount: number,
): DailyNotebookEntry[] {
  return entries.map((entry) => ({
    date: entry.date,
    diary: entry.diary ?? "",
    checks: Array.from({ length: checkCount }, (_, index) =>
      Boolean(entry.checks?.[index]),
    ),
  }));
}

export function buildMonthEntries(
  monthKey: string,
  rawEntries: DailyNotebookEntry[],
  checkCount: number,
) {
  const entryMap = new Map<string, DailyNotebookEntry>();

  rawEntries.forEach((entry) => {
    if (entry.date.startsWith(`${monthKey}-`)) {
      entryMap.set(entry.date, entry);
    }
  });

  const monthlyEntries = buildMonthDates(monthKey).map((date) => {
    const entry = entryMap.get(date);
    return entry ?? { date, diary: "", checks: [] };
  });

  return normalizeEntries(monthlyEntries, checkCount);
}

function accessCodeKey(notebookId: string) {
  return `${ACCESS_CODE_PREFIX}${notebookId}`;
}

export function getStoredDailyAccessCode(notebookId: string) {
  if (!isBrowser()) return "";
  return window.sessionStorage.getItem(accessCodeKey(notebookId)) || "";
}

export function setStoredDailyAccessCode(notebookId: string, accessCode: string) {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(accessCodeKey(notebookId), accessCode);
}

export function clearStoredDailyAccessCode(notebookId: string) {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(accessCodeKey(notebookId));
}

export function clearLegacyDailyLocalData() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(LEGACY_NOTEBOOKS_KEY);
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(LEGACY_ENTRIES_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(LEGACY_UNLOCK_PREFIX)) {
      window.sessionStorage.removeItem(key);
    }
  }
}
