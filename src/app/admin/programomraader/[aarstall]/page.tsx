/**
 * Programområde-editor (/admin/programomraader/[aarstall]).
 * Viser alle 27 programområder med status for redaksjonelt innhold.
 */

import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";

interface Programomraade {
  omr_nr: number;
  navn: string;
  total: number;
}

export default async function ProgramomraaderSide({
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

  // Hent programområder fra JSON-dataene
  let omraader: Programomraade[] = [];
  try {
    const dataPath = path.join(process.cwd(), "data", String(aar), "gul_bok_full.json");
    const json = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const alleOmraader = [
      ...(json.utgifter?.omraader ?? []),
      ...(json.inntekter?.omraader ?? []),
    ];
    // Dedupliser per omr_nr
    const sett = new Map<number, Programomraade>();
    for (const o of alleOmraader) {
      if (!sett.has(o.omr_nr)) {
        sett.set(o.omr_nr, { omr_nr: o.omr_nr, navn: o.navn, total: o.total });
      }
    }
    omraader = Array.from(sett.values()).sort((a, b) => a.omr_nr - b.omr_nr);
  } catch {
    // Ingen JSON-data for dette året
  }

  // Hent eksisterende redaksjonelt innhold
  const innhold = await prisma.programomraadeInnhold.findMany({
    where: { budsjettaarId: budsjettaar.id },
    select: { omrNr: true, ingress: true, brodtekst: true },
  });
  const innholdMap = new Map(innhold.map((i: (typeof innhold)[number]) => [i.omrNr, i]));

  return (
    <>
      <div className="admin-header">
        <h1>Programområder — {aar}</h1>
        <p>
          Legg til redaksjonelt innhold for drill-down-sider.
          Områder uten innhold viser kun talldata.
        </p>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Programområde</th>
            <th>Total bevilgning</th>
            <th>Redaksjonsinnhold</th>
            <th>Handling</th>
          </tr>
        </thead>
        <tbody>
          {omraader.map((o) => {
            const harInnhold = innholdMap.has(o.omr_nr);
            const i = innholdMap.get(o.omr_nr);
            const harTekst = i && (i.ingress || i.brodtekst);

            return (
              <tr key={o.omr_nr}>
                <td>{o.omr_nr}</td>
                <td><strong>{o.navn}</strong></td>
                <td>
                  {(o.total / 1_000_000_000).toFixed(1).replace(".", ",")} mrd. kr
                </td>
                <td>
                  {harTekst ? (
                    <span className="status-badge status-godkjent">Har innhold</span>
                  ) : (
                    <span style={{ color: "#999", fontSize: "0.8125rem" }}>Kun talldata</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/admin/programomraader/${aar}/${o.omr_nr}`}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    {harInnhold ? "Rediger" : "Legg til innhold"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {omraader.length === 0 && (
        <div className="admin-tom-tilstand">
          <p><strong>Ingen programområder funnet</strong></p>
          <p>Kjør datapipelinen for å generere JSON-data for {aar}.</p>
        </div>
      )}
    </>
  );
}
