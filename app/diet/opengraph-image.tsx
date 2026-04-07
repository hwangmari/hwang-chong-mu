import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="체중 관리"
      subtitle="평생 숙제 다이어트, 기록으로 시작!"
      emoji="⚖️"
      theme="rose"
    />,
    {
      ...size,
    },
  );
}
