import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="황총무 게임방"
      subtitle="심심할 땐 랜덤 게임 한 판!"
      emoji="🎮"
      theme="purple"
    />,
    {
      ...size,
    },
  );
}
