/**
 * Server Actions for nøkkeltall-administrasjon.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";

interface NokkeltallInput {
  etikett: string;
  verdi: string;
  enhet: string | null;
  endringsindikator: string | null;
  datareferanse: string | null;
}

export async function opprettNokkeltall(
  budsjettaarId: number,
  data: NokkeltallInput
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const nokkeltall = await prisma.nokkeltall.create({
    data: {
      budsjettaarId,
      ...data,
    },
  });

  await loggRevisjon({
    tabell: "nokkeltall",
    radId: nokkeltall.id,
    handling: "opprett",
    snapshot: data as unknown as Record<string, unknown>,
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/nokkeltall");
  return nokkeltall;
}

export async function oppdaterNokkeltall(id: number, data: NokkeltallInput) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const nokkeltall = await prisma.nokkeltall.update({
    where: { id },
    data,
  });

  await loggRevisjon({
    tabell: "nokkeltall",
    radId: id,
    handling: "endre",
    snapshot: data as unknown as Record<string, unknown>,
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/nokkeltall");
  return nokkeltall;
}

export async function slettNokkeltall(id: number) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.nokkeltall.delete({ where: { id } });

  await loggRevisjon({
    tabell: "nokkeltall",
    radId: id,
    handling: "slett",
    snapshot: {},
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/nokkeltall");
}
