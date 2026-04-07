import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "황총무 가계부",
    short_name: "가계부",
    description: "문장등록과 월별 흐름으로 빠르게 쓰는 가계부",
    start_url: "/account-book",
    scope: "/account-book",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5f73d9",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
