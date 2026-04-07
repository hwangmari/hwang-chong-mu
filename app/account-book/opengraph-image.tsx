import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="황총무 가계부"
      subtitle="문장등록과 월별 흐름으로 빠르게 쓰는 가계부"
      emoji="🧾"
      theme="teal"
    />,
    {
      ...size,
    },
  );
}
