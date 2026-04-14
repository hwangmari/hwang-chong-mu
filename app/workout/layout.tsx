import type { Metadata } from "next";
import WorkoutShell from "./components/WorkoutShell";

export const metadata: Metadata = {
  title: "황총무 운동 기록",
  description: "러닝과 웨이트 기록을 모아 성장 그래프로 보여주는 운동 수첩",
};

export default function WorkoutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <WorkoutShell>{children}</WorkoutShell>;
}
