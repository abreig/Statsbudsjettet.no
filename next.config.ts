import type { NextConfig } from "next";

const basePath = "/statsbudsjettet";

const nextConfig: NextConfig = {
  // Statisk eksport for GitHub Pages
  output: "export",

  // Base path for GitHub Pages (repo-navn)
  basePath,

  // Gjør basePath tilgjengelig i klient-kode via process.env
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  // GitHub Pages bruker ikke Next.js image optimization
  images: {
    unoptimized: true,
  },

  // Unngå turbopack-forvirring med sanity/-undermappen
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
