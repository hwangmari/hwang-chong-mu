import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="Developer Portfolio"
      subtitle="황총무의 개발 포트폴리오"
      emoji="👩‍💻"
      theme="slate"
    />,
    {
      ...size,
    },
  );
}
