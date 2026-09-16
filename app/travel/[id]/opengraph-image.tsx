import { serviceOgImage } from "@/lib/og";
import { fetchTravelPlan } from "@/services/travel";

export const runtime = "edge";
export const alt = "황총무 여행 플랜 공유 이미지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 공유 이미지에 여행 이름을 넣는다. 못 읽으면 서비스 이름으로.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let title: string | undefined;
  try {
    title = (await fetchTravelPlan(id))?.title;
  } catch {
    title = undefined;
  }
  return serviceOgImage("travel", title);
}
