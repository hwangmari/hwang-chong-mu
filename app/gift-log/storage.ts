// 가계부 가져오기에서 "제외"한 후보를 이 브라우저에 기억한다 (DB 저장 없음).
// 키 네이밍은 inbody의 `hcm:inbody:visible` 방식을 따른다.
const EXCLUDED_KEY = "hcm:gift-log:import-excluded";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadExcludedSourceIds(): Set<string> {
  if (!isBrowser()) return new Set();
  try {
    const raw = window.localStorage.getItem(EXCLUDED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveExcludedSourceIds(ids: Set<string>) {
  if (!isBrowser()) return;
  window.localStorage.setItem(EXCLUDED_KEY, JSON.stringify([...ids]));
}
