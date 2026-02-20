/**
 * Server Actions for publiseringsflyt.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";

export async function oppdaterStatus(
  budsjettaarId: number,
  nyStatus: string,
  publiseringTid?: string
) {
  const sesjon = await requireSession(["administrator", "redaktor", "godkjenner"]);

  // Valider statusovergang
  const gyldigeOverganger: Record<string, string[]> = {
    kladd: ["til_godkjenning"],
    til_godkjenning: ["godkjent", "kladd"],
    godkjent: ["publisert", "kladd"],
    publisert: ["kladd"],
  };

  const budsjettaar = await prisma.budsjettaar.findUnique({
    where: { id: budsjettaarId },
  });

  if (!budsjettaar) throw new Error("Budsjettår ikke funnet");

  const tillatt = gyldigeOverganger[budsjettaar.status];
  if (!tillatt?.includes(nyStatus)) {
    throw new Error(
      `Ugyldig statusovergang: ${budsjettaar.status} → ${nyStatus}`
    );
  }

  // Rollespesifikke regler
  if (nyStatus === "godkjent" && sesjon.rolle === "redaktor") {
    throw new Error("Kun godkjenner eller administrator kan godkjenne");
  }
  if (nyStatus === "publisert" && sesjon.rolle === "redaktor") {
    throw new Error("Kun godkjenner eller administrator kan publisere");
  }

  await prisma.budsjettaar.update({
    where: { id: budsjettaarId },
    data: {
      status: nyStatus,
      publiseringTid: publiseringTid ? new Date(publiseringTid) : undefined,
    },
  });

  await loggRevisjon({
    tabell: "budsjettaar",
    radId: budsjettaarId,
    handling: "statusendring",
    snapshot: {
      fraStatus: budsjettaar.status,
      tilStatus: nyStatus,
      publiseringTid,
    },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/publisering");
  revalidatePath("/admin/budsjettaar");
  revalidatePath("/admin");
}
