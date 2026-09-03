import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="여행 경비 계산기"
      subtitle="여행·모임 경비, 각자 낸 대로 적으면 끝!"
      emoji="💸"
      theme="green"
    />,
    {
      ...size,
    },
  );
}
