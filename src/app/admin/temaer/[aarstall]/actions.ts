/**
 * Server Actions for tema-administrasjon.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/requireSession";
import { loggRevisjon } from "@/lib/revisjonslogg";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

interface TemaInput {
  tittel: string;
  ingress: string | null;
  farge: string | null;
  problembeskrivelse: unknown;
  prioriteringer: unknown;
  sitatTekst: string | null;
  sitatPerson: string | null;
  sitatTittel: string | null;
  budsjettlenker: unknown;
  rekkefoelge?: number;
}

export async function opprettTema(budsjettaarId: number, data: TemaInput) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const tema = await prisma.tema.create({
    data: {
      budsjettaarId,
      rekkefoelge: data.rekkefoelge ?? 0,
      tittel: data.tittel,
      ingress: data.ingress,
      farge: data.farge,
      problembeskrivelse: data.problembeskrivelse as JsonValue ?? undefined,
      prioriteringer: data.prioriteringer as JsonValue ?? undefined,
      sitatTekst: data.sitatTekst,
      sitatPerson: data.sitatPerson,
      sitatTittel: data.sitatTittel,
      budsjettlenker: data.budsjettlenker as JsonValue ?? undefined,
    },
  });

  await loggRevisjon({
    tabell: "temaer",
    radId: tema.id,
    handling: "opprett",
    snapshot: data as unknown as Record<string, unknown>,
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/temaer");
  return tema;
}

export async function oppdaterTema(
  id: number,
  data: Omit<TemaInput, "rekkefoelge">
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  const tema = await prisma.tema.update({
    where: { id },
    data: {
      tittel: data.tittel,
      ingress: data.ingress,
      farge: data.farge,
      problembeskrivelse: data.problembeskrivelse as JsonValue ?? undefined,
      prioriteringer: data.prioriteringer as JsonValue ?? undefined,
      sitatTekst: data.sitatTekst,
      sitatPerson: data.sitatPerson,
      sitatTittel: data.sitatTittel,
      budsjettlenker: data.budsjettlenker as JsonValue ?? undefined,
    },
  });

  await loggRevisjon({
    tabell: "temaer",
    radId: id,
    handling: "endre",
    snapshot: data as unknown as Record<string, unknown>,
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/temaer");
  return tema;
}

export async function slettTema(id: number) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.tema.delete({ where: { id } });

  await loggRevisjon({
    tabell: "temaer",
    radId: id,
    handling: "slett",
    snapshot: {},
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/temaer");
}

export async function oppdaterTemaRekkefoelge(
  oppdateringer: { id: number; rekkefoelge: number }[]
) {
  const sesjon = await requireSession(["administrator", "redaktor"]);

  await prisma.$transaction(
    oppdateringer.map((t) =>
      prisma.tema.update({
        where: { id: t.id },
        data: { rekkefoelge: t.rekkefoelge },
      })
    )
  );

  await loggRevisjon({
    tabell: "temaer",
    radId: 0,
    handling: "endre",
    snapshot: { oppdateringer },
    brukerId: sesjon.brukerId,
  });

  revalidatePath("/admin/temaer");
}
