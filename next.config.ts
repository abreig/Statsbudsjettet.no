import type { NextConfig } from "next";

// basePath settes via miljøvariabel for GitHub Pages deploy.
// Lokalt og på Codespaces er den tom (rot).
const basePath = process.env.BASE_PATH ?? "";

// Statisk eksport kun når STATIC_EXPORT=true (for GitHub Pages).
// Standard: dynamisk modus for admin-panel, API-ruter og Draft Mode.
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  // Statisk eksport kun for GitHub Pages-deploy
  ...(isStaticExport ? { output: "export" } : {}),

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

  // Server-eksternalisering for Prisma i produksjon
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
