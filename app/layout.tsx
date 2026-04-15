import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import Script from "next/script";
import { ModalProvider } from "@/components/common/ModalProvider";
import GlobalHeader from "@/components/common/GlobalHeader";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hwang-lab.kr"),
  title: {
    default: "황총무의 실험실",
    template: "%s | 황총무의 실험실",
  },
  description:
    "약속 잡기, 엔빵 계산기, 야근 계산기, 장소 투표, 가계부, 습관 관리 등 일상의 소소한 불편함을 해결해주는 미니 서비스 모음 — 황총무의 실험실.",
  keywords: [
    "황총무",
    "약속 잡기",
    "엔빵 계산기",
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
            {/* 공통 헤더 적용 */}
            <Suspense fallback={null}>
              <GlobalHeader />
            </Suspense>
            {children}
          </ModalProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
