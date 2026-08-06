import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉토리의 package-lock.json 때문에 워크스페이스 루트를 잘못 추론해
  // 홈 전체를 스캔(메모리 폭증)하는 문제 방지 — 루트를 프로젝트 폴더로 고정
  turbopack: {
    root: __dirname,
  },
  transpilePackages: ["@hwangchongmu/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
