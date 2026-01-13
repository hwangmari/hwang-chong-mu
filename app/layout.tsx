import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import Script from "next/script";
import { ModalProvider } from "@/components/common/ModalProvider";
import GlobalHeader from "@/components/common/GlobalHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "황총무의 실험실",
  description: "복잡한 건 제가 할게요, 총총총... 🐾",
  // 👇 [수정] meta 태그는 여기서 관리하는 게 Next.js 정석입니다!
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
      <head>
        {/* 애드센스 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9383832812082051"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        {/* 👇  카카오 맵 SDK (autoload=false 필수) */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer&autoload=false`}
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ModalProvider>
            {/* 공통 헤더 적용 */}
            <GlobalHeader />
            {children}
          </ModalProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
