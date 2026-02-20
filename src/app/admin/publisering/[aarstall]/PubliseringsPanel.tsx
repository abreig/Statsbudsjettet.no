/**
 * Klient-komponent for publiseringsflyt.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { oppdaterStatus } from "./actions";
import type { Rolle } from "@/lib/types/cms";

interface Props {
  budsjettaar: {
    id: number;
    aarstall: number;
    status: string;
    publiseringTid: string | null;
  };
  innholdStatus: {
    moduler: number;
    synligeModuler: number;
    temaer: number;
    nokkeltall: number;
    programomraaderMedInnhold: number;
    programomraaderTotalt: number;
  };
  brukerRolle: Rolle;
}

const STATUS_FLYT: Record<string, { neste: string; handling: string; kreverRolle: Rolle[] }[]> = {
  kladd: [
    { neste: "til_godkjenning", handling: "Send til godkjenning", kreverRolle: ["administrator", "redaktor"] },
  ],
  til_godkjenning: [
    { neste: "godkjent", handling: "Godkjenn", kreverRolle: ["administrator", "godkjenner"] },
    { neste: "kladd", handling: "Tilbakestill til kladd", kreverRolle: ["administrator", "godkjenner"] },
  ],
  godkjent: [
    { neste: "publisert", handling: "Publiser nå", kreverRolle: ["administrator", "godkjenner"] },
    { neste: "kladd", handling: "Tilbakestill til kladd", kreverRolle: ["administrator"] },
  ],
  publisert: [
    { neste: "kladd", handling: "Lås opp for redigering", kreverRolle: ["administrator"] },
  ],
};

export function PubliseringsPanel({ budsjettaar, innholdStatus, brukerRolle }: Props) {
  const [status, setStatus] = useState(budsjettaar.status);
  const [publiseringTid, setPubliseringTid] = useState(budsjettaar.publiseringTid ?? "");
  const [laster, setLaster] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  const tilgjengeligeHandlinger = (STATUS_FLYT[status] ?? []).filter((h) =>
    h.kreverRolle.includes(brukerRolle)
  );

  const handleStatusEndring = async (nyStatus: string) => {
    if (nyStatus === "publisert" && !confirm("Er du sikker på at du vil publisere? Innholdet blir tilgjengelig for allmennheten.")) return;

    setLaster(true);
    try {
      await oppdaterStatus(
        budsjettaar.id,
        nyStatus,
        nyStatus === "godkjent" && publiseringTid ? publiseringTid : undefined
      );
      setStatus(nyStatus);
      setMelding(`Status endret til ${nyStatus.replace("_", " ")}`);
    } catch (e) {
      setMelding((e as Error).message);
    }
    setLaster(false);
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      {melding && (
        <div className="admin-melding admin-melding-suksess">{melding}</div>
      )}

      {/* Statusoversikt */}
      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem" }}>Status</h2>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <div>
            <span className={`status-badge status-${status}`} style={{ fontSize: "1rem", padding: "0.375rem 1rem" }}>
              {status.replace("_", " ")}
            </span>
          </div>
          {budsjettaar.publiseringTid && (
            <div style={{ fontSize: "0.875rem", color: "#555" }}>
              Planlagt publisering: {new Date(budsjettaar.publiseringTid).toLocaleString("nb-NO")}
            </div>
          )}
        </div>
      </div>

      {/* Innholdsoversikt */}
      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem" }}>Innholdsoversikt</h2>
        <div className="admin-grid admin-grid-3">
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{innholdStatus.synligeModuler}/{innholdStatus.moduler}</div>
            <div style={{ fontSize: "0.8125rem", color: "#666" }}>Synlige moduler</div>
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{innholdStatus.temaer}</div>
            <div style={{ fontSize: "0.8125rem", color: "#666" }}>Temaer</div>
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{innholdStatus.nokkeltall}</div>
            <div style={{ fontSize: "0.8125rem", color: "#666" }}>Nøkkeltall</div>
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {innholdStatus.programomraaderMedInnhold}/{innholdStatus.programomraaderTotalt}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#666" }}>Programomr. med innhold</div>
          </div>
        </div>
      </div>

      {/* Forhåndsvisning */}
      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem" }}>Forhåndsvisning</h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#666" }}>
          Se hvordan innholdet vil se ut for besøkende
        </p>
        <Link
          href={`/api/draft-aktiver?aarstall=${budsjettaar.aarstall}`}
          className="admin-btn admin-btn-secondary"
        >
          Åpne forhåndsvisning
        </Link>
      </div>

      {/* Tidsstyrt publisering (kun for godkjent-status) */}
      {status === "godkjent" && (
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem" }}>Tidsstyrt publisering</h2>
          <div className="admin-form-group">
            <label htmlFor="publisering-tid">Publiseringstidspunkt</label>
            <input
              id="publisering-tid"
              type="datetime-local"
              className="admin-input"
              value={publiseringTid}
              onChange={(e) => setPubliseringTid(e.target.value)}
              style={{ width: "300px" }}
            />
            <p className="help-text">
              Innholdet publiseres automatisk når tidspunktet er nådd
            </p>
          </div>
        </div>
      )}

      {/* Handlingsknapper */}
      {tilgjengeligeHandlinger.length > 0 && (
        <div className="admin-card">
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem" }}>Handlinger</h2>
          <div className="admin-actions">
            {tilgjengeligeHandlinger.map((h) => (
              <button
                key={h.neste}
                className={`admin-btn ${
                  h.neste === "publisert"
                    ? "admin-btn-primary"
                    : h.neste === "kladd"
                      ? "admin-btn-secondary"
                      : "admin-btn-primary"
                }`}
                onClick={() => handleStatusEndring(h.neste)}
                disabled={laster}
              >
                {h.handling}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
