// 익명 투표용 폰 식별값.
//
// 이름을 받지 않고도 "한 폰 한 표"를 지키려고 브라우저마다 임의 문자열을 하나 만들어 둔다.
// 사람을 알아낼 수 있는 정보는 들어 있지 않고, 저장 공간에도 이 문자열만 올라간다.
// 브라우저 기록을 지우면 새로 만들어지므로 다시 한 표를 넣을 수 있다 — 동호회 투표에는 충분하다.
const KEY = "hwang-tennis-voter";

export function getVoterKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && saved.length >= 8) return saved;
    const made =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(KEY, made);
    return made;
  } catch {
    // 사생활 보호 모드 등으로 저장이 막히면 이번 방문에만 쓰는 값으로 둔다
    return "";
  }
}
