import type { Metadata } from "next";

// 체험 모드는 미리 보기용이라 검색에 올리지 않는다
export const metadata: Metadata = {
  title: "63OPEN 픽셀 코트 체험 · 황총무 테니스 대회",
  robots: { index: false, follow: false },
};

export default function PixelDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
