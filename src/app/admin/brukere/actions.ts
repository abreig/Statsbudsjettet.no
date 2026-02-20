/**
 * Server Actions for brukeradministrasjon.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";

export async function oppdaterBruker(
  id: number,
  rolle: string,
  aktiv: boolean
) {
  const sesjon = await requireSession(["administrator"]);

  const bruker = await prisma.bruker.update({
    where: { id },
    data: { rolle, aktiv },
  });

  await loggRevisjon({
    tabell: "brukere",
    radId: id,
    handling: "endre",
    snapshot: { rolle, aktiv },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/brukere");
  return bruker;
}
