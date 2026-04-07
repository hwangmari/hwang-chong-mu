import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="일일 기록"
      subtitle="한 줄 일기 + 체크리스트 그래프"
      emoji="📓"
      theme="amber"
    />,
    {
      ...size,
    },
  );
}
