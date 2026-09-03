// 구글 애널리틱스(GA4) 설정. 측정 ID(G-로 시작)는 비밀이 아니라 애드센스 ID처럼 코드에 둔다.
// 비어 있으면 아무것도 붙지 않는다 (로컬 개발·아직 ID를 못 받은 경우).
export const GA_MEASUREMENT_ID = "";

type GtagFn = (...args: unknown[]) => void;

function gtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const fn = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof fn === "function" ? fn : null;
}

// 화면 전환(주소가 바뀔 때)마다 "페이지 봤음"을 한 번 보낸다. Next.js는 새로고침 없이 화면을 바꾸므로 직접 알려줘야 한다
export function trackPageView(url: string) {
  const fn = gtag();
  if (!fn || !GA_MEASUREMENT_ID) return;
  fn("event", "page_view", { page_path: url, page_location: window.location.href, page_title: document.title });
}
