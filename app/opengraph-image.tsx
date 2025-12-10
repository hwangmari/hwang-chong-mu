// app/opengraph-image.tsx
import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="황총무의 실험실"
        subtitle="복잡한 건 제가 할게요, 총총총... 🐾"
        emoji="🐰" // 토끼 이모지 사용!
        theme="lab" // ✅ 새로 만든 lab 테마 적용
      />
    ),
    {
      ...size,
    }
  );
}
