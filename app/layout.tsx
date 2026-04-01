import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import Script from "next/script";
import { ModalProvider } from "@/components/common/ModalProvider";
import GlobalHeader from "@/components/common/GlobalHeader";

export const metadata: Metadata = {
  title: "황총무의 실험실",
  description: "복잡한 건 제가 할게요, 총총총... 🐾",
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
