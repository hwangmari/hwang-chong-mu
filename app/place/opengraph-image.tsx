import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="회식 장소 투표"
      subtitle="맛집 검색하고 후보를 골라 투표 받기!"
      emoji="🍻"
      theme="amber"
    />,
    {
      ...size,
    },
  );
}
