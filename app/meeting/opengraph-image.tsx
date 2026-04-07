import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="황총무의 약속 잡기"
      subtitle="복잡한 일정 조율, 링크 하나로 끝!"
      emoji="🗓️"
      theme="blue"
    />,
    {
      ...size,
    },
  );
}
