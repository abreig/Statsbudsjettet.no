/**
 * Server Actions for programområde-innhold.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

interface ProgramomraadeInput {
  ingress: string | null;
  brodtekst: unknown;
  nokkeltallIds: number[];
}

export async function lagreProgramomraadeInnhold(
  budsjettaarId: number,
  omrNr: number,
  data: ProgramomraadeInput
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const innhold = await prisma.programomraadeInnhold.upsert({
    where: {
      budsjettaarId_omrNr: { budsjettaarId, omrNr },
    },
    create: {
      budsjettaarId,
      omrNr,
      ingress: data.ingress,
      brodtekst: data.brodtekst as JsonValue ?? undefined,
      nokkeltallIds: data.nokkeltallIds,
      sistEndretAvId: sesjon.brukerId,
    },
    update: {
      ingress: data.ingress,
      brodtekst: data.brodtekst as JsonValue ?? undefined,
      nokkeltallIds: data.nokkeltallIds,
      sistEndretAvId: sesjon.brukerId,
    },
  });

  await loggRevisjon({
    tabell: "programomraade_innhold",
    radId: innhold.id,
    handling: innhold.id ? "endre" : "opprett",
    snapshot: { omrNr, ...data } as unknown as Record<string, unknown>,
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/programomraader");
  return innhold;
}
