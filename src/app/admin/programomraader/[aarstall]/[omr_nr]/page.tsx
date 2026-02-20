/**
 * Redaksjonelt innhold for ett programområde.
 * Ingress, brødtekst, grafer og nøkkeltall.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProgramomraadeForm } from "./ProgramomraadeForm";

export default async function ProgramomraadeRediger({
  params,
}: {
  params: Promise<{ aarstall: string; omr_nr: string }>;
}) {
  await requireSession(["administrator", "redaktor"]);
  const { aarstall, omr_nr } = await params;
  const aar = parseInt(aarstall);
  const omrNr = parseInt(omr_nr);

  const budsjettaar = await prisma.budsjettaar.findUnique({
    where: { aarstall: aar },
  });

  if (!budsjettaar) notFound();

  // Hent eksisterende innhold (om det finnes)
  const innhold = await prisma.programomraadeInnhold.findUnique({
    where: {
      budsjettaarId_omrNr: {
        budsjettaarId: budsjettaar.id,
        omrNr,
      },
    },
  });

  // Hent tilgjengelige nøkkeltall for dette budsjettåret
  const nokkeltall = await prisma.nokkeltall.findMany({
    where: { budsjettaarId: budsjettaar.id },
    orderBy: { id: "asc" },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Programområde {omrNr} — {aar}</h1>
        <p>Redaksjonelt innhold for drill-down-siden</p>
      </div>

      <ProgramomraadeForm
        budsjettaarId={budsjettaar.id}
        aarstall={aar}
        omrNr={omrNr}
        innhold={
          innhold
            ? {
                id: innhold.id,
                ingress: innhold.ingress,
                brodtekst: innhold.brodtekst,
                grafer: innhold.grafer,
                nokkeltallIds: innhold.nokkeltallIds,
              }
            : null
        }
        tilgjengeligeNokkeltall={nokkeltall.map((n: (typeof nokkeltall)[number]) => ({
          id: n.id,
          etikett: n.etikett,
          verdi: n.verdi,
          enhet: n.enhet,
        }))}
      />
    </>
  );
}
