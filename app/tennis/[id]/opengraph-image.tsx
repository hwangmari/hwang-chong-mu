import { serviceOgImage } from "@/lib/og";
import { fetchTennisEvent } from "@/services/tennis";

export const runtime = "edge";
export const alt = "황총무 테니스 대회 공유 이미지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 공유 이미지에 대회 이름을 넣는다. 못 읽으면 서비스 이름으로.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let title: string | undefined;
  try {
    title = (await fetchTennisEvent(id))?.title;
  } catch {
    title = undefined;
  }
  return serviceOgImage("tennis", title);
}
