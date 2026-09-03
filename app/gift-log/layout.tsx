import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "황총무 경조사비 장부",
  description: "축의금·부조금을 사람별로 기록하고, 얼마 해야 할지 바로 찾아보는 장부",
  robots: { index: false, follow: false },
};

// 로그인 여부는 page.tsx가 useAuth()로 판단한다 (통합 계정 세션).
export default function GiftLogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
