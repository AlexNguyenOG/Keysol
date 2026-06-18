import type { NextConfig } from "next";
import { getSecurityHeaders } from "./src/lib/security/headers";

const isDevelopment = process.env.NODE_ENV !== "production";
const securityHeaderEntries = Object.entries(getSecurityHeaders(isDevelopment)).map(
  ([key, value]) => ({ key, value }),
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
