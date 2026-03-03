import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
