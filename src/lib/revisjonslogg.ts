/**
 * Hjelpefunksjoner for revisjonslogging.
 * Alle skriveoperasjoner til CMS-databasen skal logges her.
 */

import { prisma } from "./db";
import type { RevHandling } from "./types/cms";

interface RevLogParams {
  tabell: string;
  radId: number;
  handling: RevHandling;
  snapshot: Record<string, unknown>;
  brukerId: number | null;
}

/**
 * Opprett en ny revisjonslogg-oppføring.
 * Kalles automatisk fra Server Actions ved endring av innhold.
 */
export async function loggRevisjon({
  tabell,
  radId,
  handling,
  snapshot,
  brukerId,
}: RevLogParams) {
  return prisma.revisjon.create({
    data: {
      tabell,
      radId,
      handling,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshotJson: snapshot as any,
      endretAvId: brukerId,
    },
  });
}
