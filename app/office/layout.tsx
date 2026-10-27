import type { Metadata } from "next";

const title = "황총무 오피스 | 걸어 다니며 고르는 황총무의 실험실";
const description =
  "픽셀·동숲 느낌 사무실을 걸어 다니며 약속 잡기, 가계부, 야근 계산기, 운동 기록 같은 황총무의 실험실 도구를 가구 하나씩 열어 보세요.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description },
  twitter: { title, description },
};

export default function OfficeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
