import type { Metadata } from "next";
import WorkoutAuthGate from "../workout/components/WorkoutAuthGate";

export const metadata: Metadata = {
  title: "황총무 인바디 기록",
  description: "원하는 인바디 지표만 골라 추이를 보는 개인 체성분 수첩",
};

export default function InBodyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <WorkoutAuthGate>{children}</WorkoutAuthGate>;
}
