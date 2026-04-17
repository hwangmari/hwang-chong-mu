import {
  DEFAULT_VISIBLE,
  METRIC_KEYS,
  type InBodySession,
  type VisibleMap,
} from "./types";

const VISIBLE_KEY = "hcm:inbody:visible";
const SESSION_KEY = "hwang-inbody-session";

function isBrowser() {
  return typeof window !== "undefined";
}

// useSyncExternalStore의 getSnapshot 결과 동일성을 위해 캐시
let cachedRaw: string | null = null;
let cachedSession: InBodySession | null = null;

export function readInBodySession(): InBodySession | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) return cachedSession;

  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as InBodySession;
    if (!parsed?.roomId || !parsed?.password) {
      cachedSession = null;
      return null;
    }
    cachedSession = parsed;
    return parsed;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    cachedRaw = null;
    cachedSession = null;
    return null;
  }
}

export function writeInBodySession(session: InBodySession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("inbody-session-change"));
}

export function clearInBodySession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("inbody-session-change"));
}

export function subscribeInBodySession(onChange: () => void) {
  if (!isBrowser()) return () => undefined;
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("inbody-session-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("inbody-session-change", handler);
  };
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
