import type { Metadata } from "next";
import { byId } from "@/lib/services";

// 제목·설명은 lib/services.ts(서비스 단일 출처)에서 가져온다.
const service = byId("meeting");

export const metadata: Metadata = {
  metadataBase: new URL("https://hwang-lab.kr"),
  title: service.seoTitle,
  description: service.seoDescription,
  openGraph: {
    title: service.seoTitle,
    description: "우리 언제 만날까? 여기서 투표해봐!",
  },
};

export default function MeetingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
