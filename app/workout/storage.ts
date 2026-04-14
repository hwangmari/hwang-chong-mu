import type { WorkoutSession } from "./types";

const SESSION_KEY = "hwang-workout-session";

// useSyncExternalStore는 getSnapshot 결과가 참조 동일해야 하므로
// 같은 raw 문자열이면 이전 파싱 결과를 재사용한다.
let cachedRaw: string | null = null;
let cachedSession: WorkoutSession | null = null;

export function readWorkoutSession(): WorkoutSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) return cachedSession;

  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as WorkoutSession;
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

export function writeWorkoutSession(session: WorkoutSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("workout-session-change"));
}

export function clearWorkoutSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("workout-session-change"));
}

export function subscribeWorkoutSession(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("workout-session-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("workout-session-change", handler);
  };
}
