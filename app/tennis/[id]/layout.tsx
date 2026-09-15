import type { Metadata } from "next";
import { byId } from "@/lib/services";
import { fetchTennisEvent } from "@/services/tennis";

// 대회 링크를 공유하면 목록(/tennis)이 아니라 그 대회 이름으로 미리보기가 뜨도록 (2026-09-15).
// page.tsx 는 클라이언트 컴포넌트라 메타데이터를 못 내보내므로 서버 레이아웃이 맡는다.
const service = byId("tennis");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let title = service.seoTitle;
  let description = service.seoDescription;
  try {
    const event = await fetchTennisEvent(id);
    if (event?.title) {
      title = `${event.title} · 황총무 테니스 대회`;
      description = `${event.date} ${event.place} — 대진표와 점수, 순위를 이 링크에서 바로 봐요.`;
    }
  } catch {
    // 저장 공간을 못 읽으면 서비스 기본 제목으로
  }
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function TennisEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
