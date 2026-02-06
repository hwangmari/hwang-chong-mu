import type { Metadata } from "next";

/** ★ [덮어쓰기] 약속 잡기 서비스 전용 메타데이터 */
export const metadata: Metadata = {
  metadataBase: new URL("https://hwang-lab.kr"),
  title: "황총무의 약속 잡기",
  description: "친구들과 약속을 가장 스마트하게 잡는 방법 📅",
  openGraph: {
    title: "황총무의 약속 잡기",
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
