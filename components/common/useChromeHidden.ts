"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// 헤더·푸터(크롬)를 숨길지 결정한다.
// 1) /account-book/…, /schedule/… 처럼 작업 하위 경로면 숨김 (주소만으로 판단)
// 2) 허브 주소에 ?workspaceId= 가 붙어 전체 화면 고정 레이아웃이 열린 경우는 페이지가 <html data-chrome="hidden">을
//    켜 주고(useMarkChromeHidden), 여기서는 그 표시만 본다. 헤더·푸터가 주소의 물음표 값을 직접 읽으면
//    Suspense 경계가 필요해지고, 그러면 늦게 뜨는 화면에서 테마가 밝은 상태로 굳는 문제가 있었다.
export const CHROME_ATTR = "data-chrome";

export function useChromeHidden(): boolean {
  const pathname = usePathname();
  const byPath = pathname.startsWith("/account-book/") || pathname.startsWith("/schedule/");
  const [byMark, setByMark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setByMark(root.getAttribute(CHROME_ATTR) === "hidden");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: [CHROME_ATTR] });
    return () => mo.disconnect();
  }, []);

  return byPath || byMark;
}

// 전체 화면 고정 레이아웃을 여는 페이지가 호출: hidden=true인 동안 문서에 표시를 켠다
export function useMarkChromeHidden(hidden: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (hidden) root.setAttribute(CHROME_ATTR, "hidden");
    else root.removeAttribute(CHROME_ATTR);
    return () => root.removeAttribute(CHROME_ATTR);
  }, [hidden]);
}
