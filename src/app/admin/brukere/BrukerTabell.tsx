/**
 * Klient-komponent for brukerTabell med redigering.
 */

"use client";

import { useState } from "react";
import { oppdaterBruker } from "./actions";

interface Bruker {
  id: number;
  epost: string;
  navn: string;
  rolle: string;
  aktiv: boolean;
}

const ROLLER = [
  { value: "administrator", label: "Administrator" },
  { value: "redaktor", label: "Redaktør" },
  { value: "godkjenner", label: "Godkjenner" },
  { value: "leser", label: "Leser" },
];

export function BrukerTabell({ brukere }: { brukere: Bruker[] }) {
  const [redigerer, setRedigerer] = useState<number | null>(null);
  const [valgtRolle, setValgtRolle] = useState("");
  const [valgtAktiv, setValgtAktiv] = useState(true);
  const [melding, setMelding] = useState<string | null>(null);

  const startRediger = (bruker: Bruker) => {
    setRedigerer(bruker.id);
    setValgtRolle(bruker.rolle);
    setValgtAktiv(bruker.aktiv);
  };

  const lagre = async (id: number) => {
    try {
      await oppdaterBruker(id, valgtRolle, valgtAktiv);
      setRedigerer(null);
      setMelding("Bruker oppdatert");
      setTimeout(() => setMelding(null), 3000);
    } catch {
      setMelding("Feil ved oppdatering");
    }
  };

  return (
    <>
      {melding && (
        <div className="admin-melding admin-melding-suksess">{melding}</div>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Navn</th>
            <th>E-post</th>
            <th>Rolle</th>
            <th>Aktiv</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {brukere.map((bruker) => (
            <tr key={bruker.id}>
              <td>{bruker.navn}</td>
              <td>{bruker.epost}</td>
              <td>
                {redigerer === bruker.id ? (
                  <select
                    className="admin-select"
                    value={valgtRolle}
                    onChange={(e) => setValgtRolle(e.target.value)}
                    style={{ width: "auto" }}
                  >
                    {ROLLER.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="status-badge" style={{ background: "#e9ecef", color: "#333" }}>
                    {bruker.rolle}
                  </span>
                )}
              </td>
              <td>
                {redigerer === bruker.id ? (
                  <button
                    className={`synlighet-toggle ${valgtAktiv ? "aktiv" : ""}`}
                    onClick={() => setValgtAktiv(!valgtAktiv)}
                    type="button"
                    aria-label={valgtAktiv ? "Deaktiver bruker" : "Aktiver bruker"}
                  />
                ) : (
                  <span>{bruker.aktiv ? "Ja" : "Nei"}</span>
                )}
              </td>
              <td>
                <div className="admin-actions">
                  {redigerer === bruker.id ? (
                    <>
                      <button
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => lagre(bruker.id)}
                      >
                        Lagre
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setRedigerer(null)}
                      >
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <button
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      onClick={() => startRediger(bruker)}
                    >
                      Rediger
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
