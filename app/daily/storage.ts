export interface DailyNotebookConfig {
  id: string;
  title: string;
  checklist: string[];
  createdAt: string;
  monthlyChecklists?: Record<string, string[]>;
  accessCode?: string;
  color?: string;
}

export interface DailyNotebookEntry {
  date: string;
  diary: string;
  checks: boolean[];
}

const NOTEBOOKS_KEY = "daily-notebooks";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeChecklist(items: string[]) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : ["기본 항목"];
}

function normalizeNotebook(notebook: DailyNotebookConfig): DailyNotebookConfig {
  return {
    ...notebook,
    checklist: sanitizeChecklist(notebook.checklist ?? []),
    monthlyChecklists: notebook.monthlyChecklists ?? {},
    accessCode: notebook.accessCode?.trim() || undefined,
    color: notebook.color || "#22c55e",
  };
}

function formatDate(date: Date) {
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

export function getDailyNotebooks(): DailyNotebookConfig[] {
  if (!isBrowser()) return [];
  const raw = safeParse<DailyNotebookConfig[]>(
    window.localStorage.getItem(NOTEBOOKS_KEY),
    []
  );
  return raw.map(normalizeNotebook);
}

export function saveDailyNotebook(notebook: DailyNotebookConfig) {
  if (!isBrowser()) return;
  const normalized = normalizeNotebook(notebook);
  const notebooks = getDailyNotebooks();
  const next = [normalized, ...notebooks.filter((item) => item.id !== normalized.id)];
  window.localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(next));
}

export function getDailyNotebookById(id: string): DailyNotebookConfig | null {
  const notebook = getDailyNotebooks().find((item) => item.id === id);
  return notebook ?? null;
}

function entriesKey(notebookId: string) {
  return `daily-notebook-entries:${notebookId}`;
}

function normalizeEntries(
  entries: DailyNotebookEntry[],
  checkCount: number
): DailyNotebookEntry[] {
  return entries.map((entry) => ({
    date: entry.date,
    diary: entry.diary ?? "",
    checks: Array.from({ length: checkCount }, (_, index) =>
      Boolean(entry.checks?.[index])
    ),
  }));
}

function sortByDate(entries: DailyNotebookEntry[]) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function getChecklistForMonth(
  notebook: DailyNotebookConfig,
  monthKey: string
): string[] {
  const monthly = notebook.monthlyChecklists?.[monthKey];
  return sanitizeChecklist(monthly ?? notebook.checklist);
}

export function saveChecklistForMonth(
  notebookId: string,
  monthKey: string,
  checklist: string[]
) {
  if (!isBrowser()) return;
  const notebooks = getDailyNotebooks();
  const target = notebooks.find((item) => item.id === notebookId);
  if (!target) return;

  const nextChecklist = sanitizeChecklist(checklist);
  const nextNotebook: DailyNotebookConfig = {
    ...target,
    monthlyChecklists: {
      ...(target.monthlyChecklists ?? {}),
      [monthKey]: nextChecklist,
    },
  };

  saveDailyNotebook(nextNotebook);
}

export function getDailyNotebookEntries(
  notebookId: string,
  monthKey: string,
  checkCount: number
): DailyNotebookEntry[] {
  if (!isBrowser()) return [];

  const allEntries = safeParse<DailyNotebookEntry[]>(
    window.localStorage.getItem(entriesKey(notebookId)),
    []
  );

  const datesInMonth = buildMonthDates(monthKey);
  const entryMap = new Map<string, DailyNotebookEntry>();

  allEntries.forEach((entry) => {
    if (entry.date.startsWith(`${monthKey}-`)) {
      entryMap.set(entry.date, entry);
    }
  });

  const monthlyEntries = datesInMonth.map((date) => {
    const entry = entryMap.get(date);
    return entry ?? { date, diary: "", checks: [] };
  });

  return normalizeEntries(monthlyEntries, checkCount);
}

export function saveDailyNotebookEntries(
  notebookId: string,
  monthKey: string,
  entries: DailyNotebookEntry[]
) {
  if (!isBrowser()) return;
  const raw = safeParse<DailyNotebookEntry[]>(
    window.localStorage.getItem(entriesKey(notebookId)),
    []
  );

  const otherMonths = raw.filter((entry) => !entry.date.startsWith(`${monthKey}-`));
  const next = sortByDate([...otherMonths, ...entries]);
  window.localStorage.setItem(entriesKey(notebookId), JSON.stringify(next));
}
