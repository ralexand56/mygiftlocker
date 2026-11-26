import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Signed-in areas and private-token links: crawlers that find them anyway are told not to list them. */
const NOINDEX = ["/locker/:path*", "/join/:path*", "/connect/:path*", "/exchange/:id", "/exchange/:id/:path*", "/invite", "/sign-in", "/auth/:path*", "/reminders/:path*"];

const nextConfig: NextConfig = {
  transpilePackages: ["@mgl/core"],
  reactStrictMode: true,
  // One address for search engines: the bare domain goes to www.
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "mygiftlockers.com" }], destination: "https://www.mygiftlockers.com/:path*", permanent: true }];
  },
  async headers() {
    return NOINDEX.map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }));
  },
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
