import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "황총무의 습관 방",
    short_name: "황총무",
    description: "매일매일 쌓이는 성실함의 농도",
    start_url: "/",
    display: "standalone", // 주소창 제거 (앱처럼 보임)
    background_color: "#ffffff",
    theme_color: "#22c55e",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
