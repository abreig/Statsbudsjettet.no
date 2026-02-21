/**
 * Felles Prisma-klientinstans.
 * Bruker singleton-mønster for å unngå for mange tilkoblinger i utvikling.
 *
 * Prisma 7 krever en eksplisitt adapter for databasetilkobling.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function lagPrismaKlient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? lagPrismaKlient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
