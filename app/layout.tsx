import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import Script from "next/script";
import { ModalProvider } from "@/components/common/ModalProvider";
import GlobalHeader from "@/components/common/GlobalHeader";
import GlobalFooter from "@/components/common/GlobalFooter";
import AuthLinkBootstrap from "@/components/common/AuthLinkBootstrap";
import GoogleAnalytics from "@/components/common/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hwang-lab.kr"),
  title: {
    default: "황총무의 실험실",
    template: "%s | 황총무의 실험실",
  },
  description:
    "약속 잡기, 엔빵 계산기, 야근 계산기, 장소 투표, 가계부, 습관 관리 등 일상의 소소한 불편함을 해결해주는 미니 서비스 모음 — 황총무의 실험실.",
  // 파일 컨벤션(app/manifest.ts) 대신 metadata로 지정해야 하위 레이아웃(가계부 등)이
  // 각자 manifest를 오버라이드할 수 있다. (홈 화면 추가 시 구역별 start_url 적용)
  manifest: "/manifest.webmanifest",
  keywords: [
    "황총무",
    "약속 잡기",
    "엔빵 계산기",
    "여행 경비 계산기",
    "N빵 계산기",
    "야근 계산기",
    "장소 투표",
    "가계부",
    "습관 관리",
    "운동 기록",
    "다이어트 기록",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "황총무의 실험실",
    title: "황총무의 실험실",
    description: "복잡한 건 제가 할게요, 총총총... 🐾",
    url: "/",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "황총무의 실험실",
    description: "복잡한 건 제가 할게요, 총총총... 🐾",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "google-adsense-account": "ca-pub-9383832812082051",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      {/* 애드센스 스크립트 */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9383832812082051"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <body>
        <StyledComponentsRegistry>
          <ModalProvider>
            {/* 공통 헤더. Suspense로 감싸지 않는다 — 감싸면 늦게 뜨는 화면(야근·장소·테니스 등)에서
                헤더·푸터가 테마 전환 전 상태(밝음)로 굳는 문제가 있었다. 주소 값을 안 읽으므로 경계가 필요 없다. */}
            <GlobalHeader />
            <AuthLinkBootstrap />
            {/* 방문자 측정 (구글 애널리틱스). 주소를 읽어야 해서 Suspense로 감싼다 */}
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
            {children}
            <GlobalFooter />
          </ModalProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
