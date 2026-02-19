import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statisk eksport for CDN-distribusjon
  output: "standalone",

  // Unngå turbopack-forvirring med sanity/-undermappen
  turbopack: {
    root: __dirname,
  },

  // Sikre headere
  headers: async () => [
    {
      source: "/data/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/:path*.json",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
