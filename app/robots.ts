import type { MetadataRoute } from "next";

const SITE_URL = "https://www.hwang-lab.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account-book/",
          "/daily/",
          "/habit/",
          "/diet/",
          "/schedule/",
          "/workout/run",
          "/workout/weight",
          "/meeting/room/",
          "/calc/",
          "/place/",
          "/game/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
