import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="우리 언제 만날까?"
        subtitle="빈 시간을 콕! 찍어주세요"
        emoji="🗓️"
        theme="blue"
      />
    ),
    {
      ...size,
    }
  );
}
