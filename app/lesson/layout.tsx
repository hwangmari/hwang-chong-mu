import type { Metadata } from "next";
import WorkoutAuthGate from "@/app/workout/components/WorkoutAuthGate";
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

// 레슨 일지는 운동 기록과 같은 운동방에 쌓인다 — 저장하면 운동 기록 '활동'에 테니스 한 줄이 함께 들어간다.
// 그래서 입장도 운동방 입장 화면을 그대로 쓴다.
export default function LessonLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <WorkoutAuthGate>{children}</WorkoutAuthGate>;
}
