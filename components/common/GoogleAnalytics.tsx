"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics";

// 구글 애널리틱스(GA4) 붙이기. 어느 페이지에 사람이 얼마나 오는지 재는 용도.
// 측정 ID가 비어 있으면 아무것도 넣지 않는다.
// 로컬 개발 서버(npm run dev)에서 누른 것은 세지 않는다 — 내가 확인하며 누른 클릭이 방문자 수에 섞이지 않게.
const ENABLED = Boolean(GA_MEASUREMENT_ID) && process.env.NODE_ENV === "production";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ENABLED || !pathname) return;
    const query = searchParams?.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  if (!ENABLED) return null;

  return (
    <>
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
