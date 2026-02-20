/**
 * Budsjettår-oversikt (/admin/budsjettaar).
 * Viser alle budsjettår med status og handlinger.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { BudsjettaarListe } from "./BudsjettaarListe";

export default async function BudsjettaarSide() {
  const sesjon = await requireSession(["administrator", "redaktor", "godkjenner", "leser"]);

  const budsjettaar = await prisma.budsjettaar.findMany({
    orderBy: { aarstall: "desc" },
    include: {
      opprettetAv: { select: { navn: true } },
      _count: {
        select: {
          moduler: true,
          temaer: true,
          nokkeltall: true,
          programomraadeInnhold: true,
        },
      },
    },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Budsjettår</h1>
        <p>Opprett og administrer budsjettår</p>
      </div>

      <BudsjettaarListe
        budsjettaar={budsjettaar.map((b: (typeof budsjettaar)[number]) => ({
          id: b.id,
          aarstall: b.aarstall,
          status: b.status,
          opprettetAv: b.opprettetAv?.navn ?? null,
          opprettetTid: b.opprettetTid.toISOString(),
          sistEndret: b.sistEndret.toISOString(),
          antallModuler: b._count.moduler,
          antallTemaer: b._count.temaer,
          antallNokkeltall: b._count.nokkeltall,
          antallProgramomraader: b._count.programomraadeInnhold,
        }))}
        kanOpprette={sesjon.rolle === "administrator" || sesjon.rolle === "redaktor"}
      />
    </>
  );
}
