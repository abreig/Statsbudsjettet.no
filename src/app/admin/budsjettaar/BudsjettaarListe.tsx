/**
 * Klient-komponent for budsjettår-oversikt med opprettelse og kopiering.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { opprettBudsjettaar, slettBudsjettaar } from "./actions";

interface BudsjettaarInfo {
  id: number;
  aarstall: number;
  status: string;
  opprettetAv: string | null;
  opprettetTid: string;
  sistEndret: string;
  antallModuler: number;
  antallTemaer: number;
  antallNokkeltall: number;
  antallProgramomraader: number;
}

export function BudsjettaarListe({
  budsjettaar,
  kanOpprette,
}: {
  budsjettaar: BudsjettaarInfo[];
  kanOpprette: boolean;
}) {
  const [visNyttSkjema, setVisNyttSkjema] = useState(false);
  const [nyttAarstall, setNyttAarstall] = useState(new Date().getFullYear() + 1);
  const [kopierFra, setKopierFra] = useState<number | "">("");
  const [laster, setLaster] = useState(false);
  const [melding, setMelding] = useState<{ type: "suksess" | "feil"; tekst: string } | null>(null);

  const handleOpprett = async () => {
    setLaster(true);
    try {
      await opprettBudsjettaar(nyttAarstall, kopierFra || undefined);
      setVisNyttSkjema(false);
      setMelding({ type: "suksess", tekst: `Budsjettår ${nyttAarstall} opprettet` });
    } catch (e) {
      setMelding({ type: "feil", tekst: (e as Error).message });
    }
    setLaster(false);
  };

  const handleSlett = async (id: number, aarstall: number) => {
    if (!confirm(`Slette budsjettår ${aarstall}? Denne handlingen kan ikke angres.`)) return;
    try {
      await slettBudsjettaar(id);
      setMelding({ type: "suksess", tekst: `Budsjettår ${aarstall} slettet` });
    } catch (e) {
      setMelding({ type: "feil", tekst: (e as Error).message });
    }
  };

  return (
    <>
      {melding && (
        <div className={`admin-melding admin-melding-${melding.type}`}>
          {melding.tekst}
        </div>
      )}

      {kanOpprette && (
        <div style={{ marginBottom: "1.5rem" }}>
          {!visNyttSkjema ? (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setVisNyttSkjema(true)}
            >
              + Opprett nytt budsjettår
            </button>
          ) : (
            <div className="admin-card">
              <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Nytt budsjettår</h3>
              <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label htmlFor="nytt-aarstall">Årstall</label>
                  <input
                    id="nytt-aarstall"
                    type="number"
                    className="admin-input"
                    value={nyttAarstall}
                    onChange={(e) => setNyttAarstall(parseInt(e.target.value))}
                    min={2019}
                    max={2099}
                    style={{ width: "120px" }}
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label htmlFor="kopier-fra">Kopier innhold fra</label>
                  <select
                    id="kopier-fra"
                    className="admin-select"
                    value={kopierFra}
                    onChange={(e) => setKopierFra(e.target.value ? parseInt(e.target.value) : "")}
                    style={{ width: "200px" }}
                  >
                    <option value="">Ingen kopiering</option>
                    {budsjettaar.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.aarstall}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-actions">
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleOpprett}
                    disabled={laster}
                  >
                    {laster ? "Oppretter..." : "Opprett"}
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setVisNyttSkjema(false)}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {budsjettaar.length === 0 ? (
        <div className="admin-tom-tilstand">
          <p><strong>Ingen budsjettår</strong></p>
          <p>Opprett et nytt budsjettår for å komme i gang.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Årstall</th>
              <th>Status</th>
              <th>Innhold</th>
              <th>Opprettet av</th>
              <th>Sist endret</th>
              <th>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {budsjettaar.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.aarstall}</strong>
                </td>
                <td>
                  <span className={`status-badge status-${b.status}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ fontSize: "0.8125rem", color: "#666" }}>
                  {b.antallModuler} moduler, {b.antallTemaer} temaer,{" "}
                  {b.antallNokkeltall} nøkkeltall, {b.antallProgramomraader} programomr.
                </td>
                <td>{b.opprettetAv ?? "—"}</td>
                <td>{new Date(b.sistEndret).toLocaleDateString("nb-NO")}</td>
                <td>
                  <div className="admin-actions">
                    <Link
                      href={`/admin/moduler/${b.aarstall}`}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Moduler
                    </Link>
                    <Link
                      href={`/admin/temaer/${b.aarstall}`}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Temaer
                    </Link>
                    <Link
                      href={`/admin/publisering/${b.aarstall}`}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Publisering
                    </Link>
                    {b.status === "kladd" && kanOpprette && (
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleSlett(b.id, b.aarstall)}
                      >
                        Slett
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
