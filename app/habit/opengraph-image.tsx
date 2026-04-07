import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="습관 관리"
      subtitle="매일매일 쌓이는 성실함 🥕"
      emoji="🥕"
      theme="orange"
    />,
    {
      ...size,
    },
  );
}
