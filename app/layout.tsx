import type { Metadata, Viewport } from "next"; // Viewport 타입 추가
import "./globals.css";

// 기존 메타데이터 (유지)
export const metadata: Metadata = {
  title: "황총무의 약속 잡기",
  description: "우리들의 약속을 스마트하게",
};

// ★ [NEW] 뷰포트 설정 추가 (여기가 핵심입니다!)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 사용자가 손가락으로 확대하지 못하게 막음
  // (선택사항) 다크모드 대응 등 색상 테마
  // themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
