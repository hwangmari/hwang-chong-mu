import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "황총무 가계부",
  description: "문장등록과 월별 흐름으로 빠르게 쓰는 가계부",
  manifest: "/account-book/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "황총무 가계부",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function AccountBookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
