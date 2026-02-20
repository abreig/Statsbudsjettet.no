/**
 * Tema-editor (/admin/temaer/[aarstall]).
 * Redigering av Plan for Norge-temaer.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { TemaListe } from "./TemaListe";

export default async function TemaerSide({
  params,
}: {
  params: Promise<{ aarstall: string }>;
}) {
  await requireSession(["administrator", "redaktor"]);
  const { aarstall } = await params;
  const aar = parseInt(aarstall);

  const budsjettaar = await prisma.budsjettaar.findUnique({
    where: { aarstall: aar },
  });

  if (!budsjettaar) notFound();

  const temaer = await prisma.tema.findMany({
    where: { budsjettaarId: budsjettaar.id },
    orderBy: { rekkefoelge: "asc" },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Temaer — Plan for Norge {aar}</h1>
        <p>Rediger temaer for «Regjeringens plan for Norge»-seksjonen</p>
      </div>

      <TemaListe
        budsjettaarId={budsjettaar.id}
        aarstall={aar}
        temaer={temaer.map((t: (typeof temaer)[number]) => ({
          id: t.id,
          rekkefoelge: t.rekkefoelge,
          tittel: t.tittel,
          ingress: t.ingress,
          farge: t.farge,
          ikonUrl: t.ikonUrl,
          problembeskrivelse: t.problembeskrivelse,
          analysegraf: t.analysegraf,
          prioriteringer: t.prioriteringer as { tittel: string; beskrivelse: string }[] | null,
          sitatTekst: t.sitatTekst,
          sitatPerson: t.sitatPerson,
          sitatTittel: t.sitatTittel,
          sitatBildeUrl: t.sitatBildeUrl,
          budsjettlenker: t.budsjettlenker as { omrNr: number; visningsnavn: string; datareferanse: string }[] | null,
        }))}
      />
    </>
  );
}
