/**
 * Felles Prisma-klientinstans.
 * Bruker singleton-mønster for å unngå for mange tilkoblinger i utvikling.
 */

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  // @ts-expect-error -- Prisma-genererte typer krever unødvendige felter i Subset<>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
