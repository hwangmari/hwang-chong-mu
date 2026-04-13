export const TREND_COLUMN_WIDTH = 220;
export const TREND_ROW_HEIGHT = 56;
export const THEME_COLOR = "#22c55e";

export function getScore(checks: boolean[]) {
  if (checks.length === 0) return 0;
  const doneCount = checks.filter(Boolean).length;
  return Math.round((doneCount / checks.length) * 100);
}

export function normalizeChecklistInput(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
