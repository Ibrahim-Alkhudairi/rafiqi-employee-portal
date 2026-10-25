import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mssql (tedious) is a Node-only driver; load it from node_modules at runtime
  // instead of bundling it.
  serverExternalPackages: ["mssql"],
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/", destination: "/ar", permanent: false },
      // Short invite links: /join/zain opens the Arabic page for Zain.
      { source: "/join/:company", destination: "/ar/join/:company", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
