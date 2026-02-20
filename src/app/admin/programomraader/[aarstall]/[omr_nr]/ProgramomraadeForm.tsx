/**
 * Klient-komponent for redigering av programområde-innhold.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { TipTapEditor } from "@/components/admin/TipTapEditor";
import { lagreProgramomraadeInnhold } from "./actions";

interface Innhold {
  id: number;
  ingress: string | null;
  brodtekst: unknown;
  grafer: unknown;
  nokkeltallIds: number[];
}

interface NokkeltallRef {
  id: number;
  etikett: string;
  verdi: string;
  enhet: string | null;
}

export function ProgramomraadeForm({
  budsjettaarId,
  aarstall,
  omrNr,
  innhold,
  tilgjengeligeNokkeltall,
}: {
  budsjettaarId: number;
  aarstall: number;
  omrNr: number;
  innhold: Innhold | null;
  tilgjengeligeNokkeltall: NokkeltallRef[];
}) {
  const [ingress, setIngress] = useState(innhold?.ingress ?? "");
  const [brodtekst, setBrodtekst] = useState<unknown>(innhold?.brodtekst ?? null);
  const [valgteNokkeltall, setValgteNokkeltall] = useState<number[]>(
    innhold?.nokkeltallIds ?? []
  );
  const [laster, setLaster] = useState(false);
  const [lagret, setLagret] = useState(false);

  const handleLagre = async () => {
    setLaster(true);
    try {
      await lagreProgramomraadeInnhold(budsjettaarId, omrNr, {
        ingress: ingress || null,
        brodtekst,
        nokkeltallIds: valgteNokkeltall,
      });
      setLagret(true);
      setTimeout(() => setLagret(false), 3000);
    } catch (e) {
      alert((e as Error).message);
    }
    setLaster(false);
  };

  const toggleNokkeltall = (id: number) => {
    setValgteNokkeltall((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <Link
        href={`/admin/programomraader/${aarstall}`}
        style={{ display: "inline-block", marginBottom: "1rem", fontSize: "0.875rem" }}
      >
        &larr; Tilbake til oversikt
      </Link>

      {lagret && (
        <div className="admin-melding admin-melding-suksess">Innhold lagret</div>
      )}

      <div className="admin-card">
        <div className="admin-form-group">
          <label htmlFor="ingress">Ingress</label>
          <textarea
            id="ingress"
            className="admin-textarea"
            value={ingress}
            onChange={(e) => setIngress(e.target.value)}
            placeholder="Kort redaksjonell intro som setter tallene i kontekst..."
          />
          <p className="help-text">
            Vises øverst på drill-down-siden, før talldata
          </p>
        </div>

        <div className="admin-form-group">
          <label>Brødtekst</label>
          <TipTapEditor
            value={brodtekst}
            onChange={setBrodtekst}
            placeholder="Utdypende tekst om programområdet..."
          />
        </div>

        {tilgjengeligeNokkeltall.length > 0 && (
          <div className="admin-form-group">
            <label>Fremhevede nøkkeltall</label>
            <p className="help-text" style={{ marginBottom: "0.5rem" }}>
              Velg nøkkeltall som skal vises på denne drill-down-siden
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {tilgjengeligeNokkeltall.map((n) => (
                <label
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    padding: "0.375rem",
                    borderRadius: "4px",
                    background: valgteNokkeltall.includes(n.id) ? "#e8f0fe" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={valgteNokkeltall.includes(n.id)}
                    onChange={() => toggleNokkeltall(n.id)}
                  />
                  <span>{n.etikett}: <strong>{n.verdi} {n.enhet ?? ""}</strong></span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleLagre}
            disabled={laster}
          >
            {laster ? "Lagrer..." : "Lagre innhold"}
          </button>
        </div>
      </div>
    </div>
  );
}
