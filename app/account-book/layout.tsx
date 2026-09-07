import type { Metadata } from "next";
import { byId } from "@/lib/services";

// 제목·설명은 lib/services.ts(서비스 단일 출처)에서 가져온다.
const service = byId("account-book");

export const metadata: Metadata = {
  title: service.seoTitle,
  description: service.seoDescription,
  manifest: "/account-book/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: service.seoTitle,
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
