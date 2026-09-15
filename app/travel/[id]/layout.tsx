import type { Metadata } from "next";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { byId } from "@/lib/services";
import { fetchTravelPlan } from "@/services/travel";
import { nightsLabel } from "../lib/plan";

// 여행 링크를 공유하면 목록(/travel)이 아니라 그 여행 이름으로 미리보기가 뜨도록 (2026-09-16).
// page.tsx 는 클라이언트 컴포넌트라 메타데이터를 못 내보내므로 서버 레이아웃이 맡는다.
const service = byId("travel");

// "2026. 10. 16 (금) – 10. 18 (일)" (같은 날이면 하루만)
function formatRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} – ${endDate}`;
  }
  const head = format(start, "yyyy. MM. dd (E)", { locale: ko });
  if (startDate === endDate) return head;
  return `${head} – ${format(end, "MM. dd (E)", { locale: ko })}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let title = service.seoTitle;
  let description = service.seoDescription;
  try {
    const plan = await fetchTravelPlan(id);
    if (plan?.title) {
      title = `${plan.title} · 황총무 여행 플랜`;
      const places = plan.days.reduce((sum, day) => sum + day.places.length, 0);
      description = `${formatRange(plan.startDate, plan.endDate)} · ${nightsLabel(plan.startDate, plan.endDate)} · ${places}곳 — 날짜별 동선과 이동 시간을 이 링크에서 같이 봐요.`;
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

export default function TravelPlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
