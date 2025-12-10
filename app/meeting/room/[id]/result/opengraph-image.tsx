import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="약속 날짜 확정!"
        subtitle="결과를 확인해 보세요"
        emoji="🎉"
        theme="orange"
      />
    ),
    {
      ...size,
    }
  );
}
