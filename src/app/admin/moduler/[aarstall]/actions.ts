/**
 * Server Actions for modul-administrasjon.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";

export async function oppdaterModulRekkefoelge(
  oppdateringer: { id: number; rekkefoelge: number }[]
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.$transaction(
    oppdateringer.map((m) =>
      prisma.modul.update({
        where: { id: m.id },
        data: { rekkefoelge: m.rekkefoelge },
      })
    )
  );

  await loggRevisjon({
    tabell: "moduler",
    radId: 0,
    handling: "endre",
    snapshot: { oppdateringer },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/moduler");
}

export async function oppdaterModulSynlighet(id: number, synlig: boolean) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.modul.update({
    where: { id },
    data: { synlig },
  });

  await loggRevisjon({
    tabell: "moduler",
    radId: id,
    handling: "endre",
    snapshot: { synlig },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/moduler");
}

export async function oppdaterModulKonfigurasjon(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  konfigurasjon: Record<string, unknown>
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.modul.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { konfigurasjon: konfigurasjon as any },
  });

  await loggRevisjon({
    tabell: "moduler",
    radId: id,
    handling: "endre",
    snapshot: { konfigurasjon },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/moduler");
}

export async function opprettModul(
  budsjettaarId: number,
  type: string,
  rekkefoelge: number
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const modul = await prisma.modul.create({
    data: {
      budsjettaarId,
      type,
      rekkefoelge,
      synlig: true,
      konfigurasjon: {},
    },
  });

  await loggRevisjon({
    tabell: "moduler",
    radId: modul.id,
    handling: "opprett",
    snapshot: { type, rekkefoelge },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/moduler");
  return modul;
}
