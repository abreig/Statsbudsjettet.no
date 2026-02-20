/**
 * Mediebibliotek (/admin/media).
 * Filopplasting og administrasjon av bilder.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { MediaBibliotek } from "./MediaBibliotek";

export default async function MediaSide() {
  await requireSession(["administrator", "redaktor"]);

  const media = await prisma.media.findMany({
    orderBy: { lastetOppTid: "desc" },
    include: {
      lastetOppAv: { select: { navn: true } },
      budsjettaar: { select: { aarstall: true } },
    },
  });

  const budsjettaar = await prisma.budsjettaar.findMany({
    orderBy: { aarstall: "desc" },
    select: { id: true, aarstall: true },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Mediebibliotek</h1>
        <p>Last opp og administrer bilder</p>
      </div>

      <MediaBibliotek
        media={media.map((m: (typeof media)[number]) => ({
          id: m.id,
          filnavn: m.filnavn,
          lagringsbane: m.lagringsbane,
          mimeType: m.mimeType,
          stoerrelseBytes: m.stoerrelseBytes,
          altTekst: m.altTekst,
          lastetOppAv: m.lastetOppAv?.navn ?? null,
          lastetOppTid: m.lastetOppTid.toISOString(),
          budsjettaar: m.budsjettaar?.aarstall ?? null,
        }))}
        budsjettaar={budsjettaar}
      />
    </>
  );
}
