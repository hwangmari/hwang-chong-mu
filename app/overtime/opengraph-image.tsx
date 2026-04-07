import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="야근 계산기"
      subtitle="보상휴가 기준을 빠르게 계산"
      emoji="🌙"
      theme="indigo"
    />,
    {
      ...size,
    },
  );
}
