import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN / external IPs and tunnels to reach the dev server. Next.js 16
  // blocks requests from hosts other than `localhost` by default; this
  // whitelist lets a phone, another device on the LAN, or a cloudflared
  // tunnel load the page and the _next/static chunks (403 Forbidden otherwise).
  //
  // Note: cloudflared quick-tunnel hostnames change every run (e.g.
  // `beast-symbols-thousands-specifics.trycloudflare.com`). Wildcard them.
  allowedDevOrigins: [
    "192.168.0.205",
    "192.168.0.*",
    "10.0.0.*",
    "172.16.*.*",
    "localhost",
    "*.trycloudflare.com",
    ".trycloudflare.com",
  ],
};

export default nextConfig;
