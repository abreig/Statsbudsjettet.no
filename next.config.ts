import type { NextConfig } from "next";

// basePath settes via miljøvariabel for GitHub Pages deploy.
// Lokalt og på Codespaces er den tom (rot).
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Statisk eksport for GitHub Pages
  output: "export",

  // Base path (tom lokalt, "/statsbudsjettet" på GitHub Pages)
  ...(basePath ? { basePath } : {}),

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
