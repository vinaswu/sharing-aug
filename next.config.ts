import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN / external IPs to reach the dev server. Next.js 16 blocks
  // requests from hosts other than `localhost` by default; this whitelist
  // lets a phone or other device on the same network load the page and the
  // _next/static chunks (403 Forbidden otherwise).
  allowedDevOrigins: [
    "192.168.0.205",
    "192.168.0.*",
    "10.0.0.*",
    "172.16.*.*",
    "localhost",
  ],
};

export default nextConfig;
