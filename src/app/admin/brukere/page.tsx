/**
 * Brukeradministrasjon (/admin/brukere).
 * Kun tilgjengelig for administratorer.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { BrukerTabell } from "./BrukerTabell";

export default async function BrukereSide() {
  await requireSession(["administrator"]);

  const brukere = await prisma.bruker.findMany({
    orderBy: { navn: "asc" },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Brukere</h1>
        <p>Administrer brukere og roller</p>
      </div>

      <BrukerTabell brukere={brukere} />
    </>
  );
}
