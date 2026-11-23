import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mgl/core"],
  reactStrictMode: true,
};

export default nextConfig;
