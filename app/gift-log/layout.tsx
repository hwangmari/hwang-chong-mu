import type { Metadata } from "next";
import { byId } from "@/lib/services";

// 제목·설명은 lib/services.ts(서비스 단일 출처)에서 가져온다.
const service = byId("gift-log");

export const metadata: Metadata = {
  title: service.seoTitle,
  description: service.seoDescription,
  // 링크 공유 미리보기 제목·설명도 서비스 것으로
  openGraph: { title: service.seoTitle, description: service.seoDescription },
  twitter: { title: service.seoTitle, description: service.seoDescription },
  // 로그인해야만 쓰는 장부라 검색에 올리지 않는다.
  robots: { index: false, follow: false },
};

// 로그인 여부는 page.tsx가 useAuth()로 판단한다 (통합 계정 세션).
export default function GiftLogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
