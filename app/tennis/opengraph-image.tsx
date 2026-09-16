import { byId } from "@/lib/services";
import { OG_CONTENT_TYPE, OG_SIZE, serviceOgImage } from "@/lib/og";

// 링크를 공유했을 때 뜨는 미리보기 이미지. 그리는 방법은 lib/og.tsx 에 한 번만 적혀 있다.
// 2026-09-16: Edge 런타임은 Next 16에서 폐기 예고라 기본(nodejs)으로. 카카오 미리보기가 비어 보이던 문제 대응.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = byId("tennis").seoTitle;

export default async function Image() {
  return serviceOgImage("tennis");
}
