import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jlr.scene7.com",
      },
      {
        protocol: "https",
        hostname: "modules.jaguarlandrover.com",
      },
    ],
  },
};

export default nextConfig;
