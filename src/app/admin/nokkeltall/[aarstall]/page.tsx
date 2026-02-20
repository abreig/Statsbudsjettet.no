/**
 * Nøkkeltall-editor (/admin/nokkeltall/[aarstall]).
 * Tabell med inline-redigering av nøkkeltall.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { NokkeltallEditor } from "./NokkeltallEditor";

export default async function NokkeltallSide({
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

  const nokkeltall = await prisma.nokkeltall.findMany({
    where: { budsjettaarId: budsjettaar.id },
    orderBy: { id: "asc" },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Nøkkeltall — {aar}</h1>
        <p>Definer nøkkeltall som kan brukes i hero, moduler og drill-down-sider</p>
      </div>

      <NokkeltallEditor
        budsjettaarId={budsjettaar.id}
        aarstall={aar}
        nokkeltall={nokkeltall.map((n: (typeof nokkeltall)[number]) => ({
          id: n.id,
          etikett: n.etikett,
          verdi: n.verdi,
          enhet: n.enhet,
          endringsindikator: n.endringsindikator,
          datareferanse: n.datareferanse,
        }))}
      />
    </>
  );
}
