/**
 * Publiseringsflyt (/admin/publisering/[aarstall]).
 * Statusoversikt, godkjenning og tidsstyrt publisering.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PubliseringsPanel } from "./PubliseringsPanel";

export default async function PubliseringSide({
  params,
}: {
  params: Promise<{ aarstall: string }>;
}) {
  const sesjon = await requireSession(["administrator", "redaktor", "godkjenner"]);
  const { aarstall } = await params;
  const aar = parseInt(aarstall);

  const budsjettaar = await prisma.budsjettaar.findUnique({
    where: { aarstall: aar },
    include: {
      moduler: { orderBy: { rekkefoelge: "asc" } },
      temaer: { orderBy: { rekkefoelge: "asc" } },
      nokkeltall: true,
      programomraadeInnhold: true,
    },
  });

  if (!budsjettaar) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Publisering — {aar}</h1>
        <p>Statusoversikt og publiseringsflyt</p>
      </div>

      <PubliseringsPanel
        budsjettaar={{
          id: budsjettaar.id,
          aarstall: budsjettaar.aarstall,
          status: budsjettaar.status,
          publiseringTid: budsjettaar.publiseringTid?.toISOString() ?? null,
        }}
        innholdStatus={{
          moduler: budsjettaar.moduler.length,
          synligeModuler: budsjettaar.moduler.filter((m: (typeof budsjettaar.moduler)[number]) => m.synlig).length,
          temaer: budsjettaar.temaer.length,
          nokkeltall: budsjettaar.nokkeltall.length,
          programomraaderMedInnhold: budsjettaar.programomraadeInnhold.filter(
            (p: (typeof budsjettaar.programomraadeInnhold)[number]) => p.ingress || p.brodtekst
          ).length,
          programomraaderTotalt: budsjettaar.programomraadeInnhold.length,
        }}
        brukerRolle={sesjon.rolle}
      />
    </>
  );
}
