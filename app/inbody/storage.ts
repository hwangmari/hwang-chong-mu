import {
  DEFAULT_VISIBLE,
  METRIC_KEYS,
  type VisibleMap,
} from "./types";

const VISIBLE_KEY = "hcm:inbody:visible";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadVisible(): VisibleMap {
  if (!isBrowser()) return { ...DEFAULT_VISIBLE };
  try {
    const raw = window.localStorage.getItem(VISIBLE_KEY);
    if (!raw) return { ...DEFAULT_VISIBLE };
    const parsed = JSON.parse(raw) as Partial<VisibleMap>;
    const merged = { ...DEFAULT_VISIBLE };
    METRIC_KEYS.forEach((k) => {
      if (typeof parsed?.[k] === "boolean") merged[k] = parsed[k] as boolean;
    });
    return merged;
  } catch {
    return { ...DEFAULT_VISIBLE };
  }
}

export function saveVisible(map: VisibleMap) {
  if (!isBrowser()) return;
  window.localStorage.setItem(VISIBLE_KEY, JSON.stringify(map));
}

export function createInBodyId() {
  return `inb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
