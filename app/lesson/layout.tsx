import type { Metadata } from "next";
import { byId } from "@/lib/services";

// 제목·설명은 lib/services.ts(서비스 단일 출처)에서 가져온다.
const service = byId("lesson");

export const metadata: Metadata = {
  title: service.seoTitle,
  description: service.seoDescription,
  openGraph: { title: service.seoTitle, description: service.seoDescription },
  twitter: { title: service.seoTitle, description: service.seoDescription },
  // 개인 레슨 메모라 검색에 올리지 않는다.
  robots: { index: false, follow: false },
};

// 레슨 일지는 황총무 통합 계정에 쌓인다 — 로그인 확인은 화면(page.tsx)이 경조사비 장부처럼 직접 한다.
// 운동방은 필요 없다. 계정에 운동방이 이어져 있으면 저장할 때 운동 기록 '활동'에 테니스 한 줄이 함께 들어간다.
export default function LessonLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
