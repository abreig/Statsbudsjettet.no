/**
 * Cron-jobb for tidsstyrt publisering.
 * Kalles hvert minutt fra CI/CD-infrastrukturen.
 * Krever hemmelig CRON_SECRET-token i Authorization-headeren.
 */

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  // Valider hemmelig token
  const authHeader = request.headers.get("Authorization");
  const forventetToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== forventetToken) {
    return new Response(JSON.stringify({ error: "Ugyldig token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Finn budsjettår som er godkjent og har passert publiseringstidspunkt
  const klarForPublisering = await prisma.budsjettaar.findMany({
    where: {
      status: "godkjent",
      publiseringTid: {
        lte: new Date(),
        not: null,
      },
    },
  });

  const publiserte = [];

  for (const aar of klarForPublisering) {
    await prisma.budsjettaar.update({
      where: { id: aar.id },
      data: { status: "publisert" },
    });

    await prisma.revisjon.create({
      data: {
        tabell: "budsjettaar",
        radId: aar.id,
        handling: "statusendring",
        snapshotJson: {
          fraStatus: "godkjent",
          tilStatus: "publisert",
          automatisk: true,
          publiseringTid: aar.publiseringTid?.toISOString(),
        },
        endretAvId: null, // System-handling
      },
    });

    publiserte.push(aar.aarstall);

    // Revalider relevante sider
    revalidatePath(`/${aar.aarstall}`);
    revalidatePath("/");
  }

  return new Response(
    JSON.stringify({
      ok: true,
      publiserte,
      tidspunkt: new Date().toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
