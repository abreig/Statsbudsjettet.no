/**
 * Server Actions for budsjettår-administrasjon.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";

/**
 * Opprett nytt budsjettår med valgfri kopiering fra et annet år.
 * Kopiering inkluderer moduler, temaer, nøkkeltall og programomraade_innhold
 * (med tomme innholdsfelt for sistnevnte).
 */
export async function opprettBudsjettaar(
  aarstall: number,
  kopierFraId?: number
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  // Sjekk om årstallet allerede finnes
  const eksisterende = await prisma.budsjettaar.findUnique({
    where: { aarstall },
  });
  if (eksisterende) {
    throw new Error(`Budsjettår ${aarstall} finnes allerede`);
  }

  const nyttAar = await prisma.budsjettaar.create({
    data: {
      aarstall,
      status: "kladd",
      opprettetAvId: sesjon.brukerId,
    },
  });

  // Kopier innhold fra et annet år
  if (kopierFraId) {
    const kilde = await prisma.budsjettaar.findUnique({
      where: { id: kopierFraId },
      include: {
        moduler: true,
        temaer: true,
        nokkeltall: true,
        programomraadeInnhold: true,
      },
    });

    if (kilde) {
      // Kopier moduler
      if (kilde.moduler.length > 0) {
        await prisma.modul.createMany({
          data: kilde.moduler.map((m: (typeof kilde.moduler)[number]) => ({
            budsjettaarId: nyttAar.id,
            type: m.type,
            rekkefoelge: m.rekkefoelge,
            synlig: m.synlig,
            konfigurasjon: m.konfigurasjon ?? {},
          })),
        });
      }

      // Kopier temaer
      if (kilde.temaer.length > 0) {
        await prisma.tema.createMany({
          data: kilde.temaer.map((t: (typeof kilde.temaer)[number]) => ({
            budsjettaarId: nyttAar.id,
            rekkefoelge: t.rekkefoelge,
            tittel: t.tittel,
            ingress: t.ingress,
            farge: t.farge,
            ikonUrl: t.ikonUrl,
            problembeskrivelse: t.problembeskrivelse ?? undefined,
            analysegraf: t.analysegraf ?? undefined,
            prioriteringer: t.prioriteringer ?? undefined,
            sitatTekst: t.sitatTekst,
            sitatPerson: t.sitatPerson,
            sitatTittel: t.sitatTittel,
            sitatBildeUrl: t.sitatBildeUrl,
            budsjettlenker: t.budsjettlenker ?? undefined,
          })),
        });
      }

      // Kopier nøkkeltall
      if (kilde.nokkeltall.length > 0) {
        await prisma.nokkeltall.createMany({
          data: kilde.nokkeltall.map((n: (typeof kilde.nokkeltall)[number]) => ({
            budsjettaarId: nyttAar.id,
            etikett: n.etikett,
            verdi: n.verdi,
            enhet: n.enhet,
            endringsindikator: n.endringsindikator,
            datareferanse: n.datareferanse,
          })),
        });
      }

      // Kopier programområde-innhold (med tomme innholdsfelt)
      if (kilde.programomraadeInnhold.length > 0) {
        await prisma.programomraadeInnhold.createMany({
          data: kilde.programomraadeInnhold.map((p: (typeof kilde.programomraadeInnhold)[number]) => ({
            budsjettaarId: nyttAar.id,
            omrNr: p.omrNr,
            ingress: null,
            brodtekst: undefined,
            grafer: undefined,
            nokkeltallIds: [],
          })),
        });
      }
    }
  }

  await loggRevisjon({
    tabell: "budsjettaar",
    radId: nyttAar.id,
    handling: "opprett",
    snapshot: { aarstall, kopierFraId },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/budsjettaar");
  revalidatePath("/admin");
  return nyttAar;
}

/**
 * Slett et budsjettår (kun i kladd-status).
 */
export async function slettBudsjettaar(id: number) {
  const sesjon = await requireSession(["administrator"]);

  const aar = await prisma.budsjettaar.findUnique({ where: { id } });
  if (!aar) throw new Error("Budsjettår ikke funnet");
  if (aar.status !== "kladd") {
    throw new Error("Kan kun slette budsjettår i kladd-status");
  }

  await prisma.budsjettaar.delete({ where: { id } });

  await loggRevisjon({
    tabell: "budsjettaar",
    radId: id,
    handling: "slett",
    snapshot: { aarstall: aar.aarstall },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/budsjettaar");
  revalidatePath("/admin");
}
