import { OgTemplate } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 800, height: 420 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgTemplate
      title="N빵 계산기"
      subtitle="복잡한 셈은 덜어내고, 깔끔하게 정산!"
      emoji="💸"
      theme="green"
    />,
    {
      ...size,
    },
  );
}
