import type { NextConfig } from "next";
import { imageHosts } from "./src/lib/image-policy";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: imageHosts().map(hostname => ({ protocol: "https" as const, hostname })) },
  async headers() {
    return [{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-store'},{key:'Service-Worker-Allowed',value:'/'}]}, {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    }];
  },
};
export default nextConfig;
