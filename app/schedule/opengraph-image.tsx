import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="업무 캘린더"
      subtitle="프로젝트 일정을 한눈에 관리"
      emoji="🗓️"
      theme="blue"
    />,
    {
      ...size,
    },
  );
}
