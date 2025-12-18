import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 이미지 도메인 허용 설정
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // 모든 도메인 허용 (개발 편의상)
        // 실제 배포 땐: hostname: "your-project.supabase.co" 처럼 특정하는 게 좋습니다.
      },
    ],
  },
  // 👇 이 부분이 핵심입니다!
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
