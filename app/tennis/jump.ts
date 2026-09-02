// 코트 현황판의 "지금/다음/준비됨/대기" 줄을 누르면 아래 대진표의 그 경기 카드로 이동한다 (교류전·토너먼트 공통)
export function matchCardId(matchNo: number) {
  return `tennis-match-${matchNo}`;
}

export function jumpToMatch(matchNo: number) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(matchCardId(matchNo));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // 잠깐 반짝여서 어느 카드인지 알려준다
  el.setAttribute("data-flash", "1");
  window.setTimeout(() => el.removeAttribute("data-flash"), 1600);
}
