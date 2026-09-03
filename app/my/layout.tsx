import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 서비스 요약",
  robots: { index: false, follow: false },
};

export default function MyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
