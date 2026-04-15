import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "블로그",
  description:
    "황총무의 실험실에서 만든 서비스들의 사용 가이드와 개발 일지 — 약속 잡기, 엔빵 계산기, 야근 계산기, 가계부 등 각 메뉴별 상세 가이드를 확인해보세요.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "블로그 | 황총무의 실험실",
    description:
      "황총무의 실험실 미니 서비스 사용 가이드와 개발 일지를 모아놓은 블로그.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
