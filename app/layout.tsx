import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";

// ★ [전역] 뷰포트 설정 (모든 페이지 공통 적용)
// 모바일에서 앱처럼 보이게 확대 방지
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

// ★ [전역] 메타데이터 (기본값: 황총무의 실험실)
export const metadata: Metadata = {
  metadataBase: new URL("https://hwang-lab.kr"),
  title: {
    template: "%s | 황총무의 실험실", // 하위 페이지에서 제목을 정하면 뒤에 이게 붙음
    default: "황총무의 실험실", // 하위 페이지에 제목이 없으면 이게 나옴
  },
  description: "복잡한 세상, 편하게 살기 위한 황총무의 귀여운 실험실 🧪",
  icons: {
    icon: "/favicon.ico", // 파비콘 설정 (있으면)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <meta
        name="google-adsense-account"
        content="ca-pub-9383832812082051"
      ></meta>{" "}
      {/* 👇 애드센스 스크립트 추가 */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9383832812082051"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <body>{children}</body>
    </html>
  );
}
