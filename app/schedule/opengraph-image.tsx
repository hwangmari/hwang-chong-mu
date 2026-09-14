import { byId } from "@/lib/services";
import { OG_CONTENT_TYPE, OG_SIZE, serviceOgImage } from "@/lib/og";

// 링크를 공유했을 때 뜨는 미리보기 이미지. 그리는 방법은 lib/og.tsx 에 한 번만 적혀 있다.
export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = byId("schedule").seoTitle;

export default async function Image() {
  return serviceOgImage("schedule");
}
