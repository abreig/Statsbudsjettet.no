/**
 * Modul-editor (/admin/moduler/[aarstall]).
 * Drag-and-drop-liste for å sortere og konfigurere landingssidemoduler.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ModulEditor } from "./ModulEditor";

export default async function ModulerSide({
  params,
}: {
  params: Promise<{ aarstall: string }>;
}) {
  const sesjon = await requireSession(["administrator", "redaktor"]);
  const { aarstall } = await params;
  const aar = parseInt(aarstall);

  const budsjettaar = await prisma.budsjettaar.findUnique({
    where: { aarstall: aar },
  });

  if (!budsjettaar) notFound();

  const moduler = await prisma.modul.findMany({
    where: { budsjettaarId: budsjettaar.id },
    orderBy: { rekkefoelge: "asc" },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Moduler — {aar}</h1>
        <p>Dra og slipp for å endre rekkefølge. Klikk for å redigere innhold.</p>
      </div>

      <ModulEditor
        budsjettaarId={budsjettaar.id}
        aarstall={aar}
        moduler={moduler.map((m: (typeof moduler)[number]) => ({
          id: m.id,
          type: m.type,
          rekkefoelge: m.rekkefoelge,
          synlig: m.synlig,
          konfigurasjon: m.konfigurasjon as Record<string, unknown>,
        }))}
        erRedaktor={sesjon.rolle === "administrator" || sesjon.rolle === "redaktor"}
      />
    </>
  );
}
