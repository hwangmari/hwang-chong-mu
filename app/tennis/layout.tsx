import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "황총무 테니스 교류전",
  description: "테니스 교류전 대진표를 보고 경기 점수를 넣으면 승점 순위가 바로 나오는 서비스",
};

export default function TennisLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
