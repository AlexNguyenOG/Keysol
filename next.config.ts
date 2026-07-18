import type { NextConfig } from "next";
import { getSecurityHeaders } from "./src/lib/security/headers";

const isDevelopment = process.env.NODE_ENV !== "production";
const securityHeaderEntries = Object.entries(getSecurityHeaders(isDevelopment)).map(
  ([key, value]) => ({ key, value }),
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.keychron.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "ducky.global" },
      { protocol: "https", hostname: "assets2.razerzone.com" },
      { protocol: "https", hostname: "assets3.razerzone.com" },
      { protocol: "https", hostname: "medias-p1.phoenix.razer.com" },
      { protocol: "https", hostname: "wooting.io" },
      { protocol: "https", hostname: "www.wooting.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaderEntries,
      },
    ];
  },
};

export default nextConfig;
