/**
 * Forhåndsvisning av budsjettårets landingsside (/preview/[aarstall]).
 * Henter innhold direkte fra Postgres (ikke statisk cache).
 */

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PreviewClient } from "./PreviewClient";

// Forhåndsvisning er alltid dynamisk
export const dynamic = "force-dynamic";

export default async function PreviewSide({
  params,
}: {
  params: Promise<{ aarstall: string }>;
}) {
  const { aarstall } = await params;
  const aar = parseInt(aarstall);

  const budsjettaar = await prisma.budsjettaar.findUnique({
    where: { aarstall: aar },
    include: {
      moduler: { orderBy: { rekkefoelge: "asc" } },
      temaer: { orderBy: { rekkefoelge: "asc" } },
      nokkeltall: true,
    },
  });

  if (!budsjettaar) notFound();

  return (
    <div>
      <div
        style={{
          background: "#fef3cd",
          padding: "0.5rem 1rem",
          borderBottom: "2px solid #ffc107",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.875rem",
        }}
      >
        <span>
          <strong>Forhåndsvisning</strong> — {budsjettaar.aarstall} ({budsjettaar.status})
        </span>
        <a href="/api/draft-deaktiver" style={{ color: "#856404" }}>
          Avslutt forhåndsvisning
        </a>
      </div>

      {/* Render moduler fra database */}
      {budsjettaar.moduler
        .filter((m: (typeof budsjettaar.moduler)[number]) => m.synlig)
        .map((modul: (typeof budsjettaar.moduler)[number]) => (
          <section key={modul.id} style={{ padding: "2rem", borderBottom: "1px solid #eee" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <PreviewModul
                type={modul.type}
                konfigurasjon={modul.konfigurasjon as Record<string, unknown>}
                temaer={budsjettaar.temaer}
                nokkeltall={budsjettaar.nokkeltall}
                aarstall={aar}
              />
            </div>
          </section>
        ))}

      {/* SSE-lytter for sanntidsoppdatering */}
      <PreviewClient />
    </div>
  );
}

function PreviewModul({
  type,
  konfigurasjon,
  temaer,
  nokkeltall,
  aarstall,
}: {
  type: string;
  konfigurasjon: Record<string, unknown>;
  temaer: { id: number; tittel: string; ingress: string | null; farge: string | null }[];
  nokkeltall: { id: number; etikett: string; verdi: string; enhet: string | null }[];
  aarstall: number;
}) {
  switch (type) {
    case "hero":
      return (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <h1 style={{ fontSize: "2.5rem", color: "var(--reg-marine, #181C62)" }}>
            {String(konfigurasjon.tittel ?? `Statsbudsjettet ${aarstall}`)}
          </h1>
          {Boolean(konfigurasjon.undertittel) && (
            <p style={{ fontSize: "1.25rem", color: "#555" }}>
              {String(konfigurasjon.undertittel)}
            </p>
          )}
          {nokkeltall.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem" }}>
              {nokkeltall.slice(0, 3).map((n) => (
                <div key={n.id}>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--reg-marine, #181C62)" }}>
                    {n.verdi} {n.enhet ?? ""}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#666" }}>{n.etikett}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "plan_for_norge":
      return (
        <div>
          <h2 style={{ fontSize: "1.75rem", color: "var(--reg-marine, #181C62)" }}>
            {String(konfigurasjon.overskrift ?? "Regjeringens plan for Norge")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {temaer.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "1.5rem",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${t.farge ?? "#ccc"}`,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{t.tittel}</h3>
                {t.ingress && (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#555" }}>{t.ingress}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "budsjettgrafer":
      return (
        <div>
          <h2 style={{ fontSize: "1.75rem", color: "var(--reg-marine, #181C62)" }}>
            {String(konfigurasjon.overskrift ?? "Budsjettet i tall")}
          </h2>
          {Boolean(konfigurasjon.forklaringstekst) && (
            <p style={{ color: "#555" }}>{String(konfigurasjon.forklaringstekst)}</p>
          )}
          <div style={{ padding: "3rem", background: "#f0f0f0", borderRadius: "8px", textAlign: "center", color: "#888" }}>
            [Budsjettgrafer rendres her med data fra JSON-pipelinen]
          </div>
        </div>
      );

    case "nokkeltall":
      return (
        <div>
          <h2 style={{ fontSize: "1.5rem", color: "var(--reg-marine, #181C62)" }}>
            {String(konfigurasjon.tittel ?? "Nøkkeltall")}
          </h2>
          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
            {nokkeltall.map((n) => (
              <div key={n.id} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                  {n.verdi} {n.enhet ?? ""}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>{n.etikett}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "egendefinert_tekst":
      return (
        <div style={{ background: String(konfigurasjon.bakgrunnsfarge ?? "transparent"), padding: "1.5rem", borderRadius: "8px" }}>
          {Boolean(konfigurasjon.tittel) && (
            <h2 style={{ fontSize: "1.5rem" }}>{String(konfigurasjon.tittel)}</h2>
          )}
          <p style={{ color: "#555" }}>[Egendefinert tekst-innhold]</p>
        </div>
      );

    default:
      return <p>Ukjent modultype: {type}</p>;
  }
}
