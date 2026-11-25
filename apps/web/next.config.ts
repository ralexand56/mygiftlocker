import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  transpilePackages: ["@mgl/core"],
  reactStrictMode: true,
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
