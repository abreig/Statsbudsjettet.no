/**
 * Klient-komponent for nøkkeltall-editor med inline-redigering.
 */

"use client";

import { useState } from "react";
import {
  opprettNokkeltall,
  oppdaterNokkeltall,
  slettNokkeltall,
} from "./actions";

interface NokkeltallData {
  id: number;
  etikett: string;
  verdi: string;
  enhet: string | null;
  endringsindikator: string | null;
  datareferanse: string | null;
}

export function NokkeltallEditor({
  budsjettaarId,
  aarstall,
  nokkeltall: initial,
}: {
  budsjettaarId: number;
  aarstall: number;
  nokkeltall: NokkeltallData[];
}) {
  const [nokkeltall, setNokkeltall] = useState(initial);
  const [redigerer, setRedigerer] = useState<number | null>(null);
  const [skjema, setSkjema] = useState<Partial<NokkeltallData>>({});
  const [laster, setLaster] = useState(false);

  const startNytt = () => {
    setRedigerer(-1);
    setSkjema({
      etikett: "",
      verdi: "",
      enhet: "mrd. kr",
      endringsindikator: null,
      datareferanse: null,
    });
  };

  const startRediger = (n: NokkeltallData) => {
    setRedigerer(n.id);
    setSkjema(n);
  };

  const handleLagre = async () => {
    setLaster(true);
    try {
      if (redigerer === -1) {
        const nytt = await opprettNokkeltall(budsjettaarId, {
          etikett: skjema.etikett ?? "",
          verdi: skjema.verdi ?? "",
          enhet: skjema.enhet ?? null,
          endringsindikator: skjema.endringsindikator ?? null,
          datareferanse: skjema.datareferanse ?? null,
        });
        setNokkeltall((prev) => [
          ...prev,
          { ...skjema, id: nytt.id } as NokkeltallData,
        ]);
      } else if (redigerer !== null) {
        await oppdaterNokkeltall(redigerer, {
          etikett: skjema.etikett ?? "",
          verdi: skjema.verdi ?? "",
          enhet: skjema.enhet ?? null,
          endringsindikator: skjema.endringsindikator ?? null,
          datareferanse: skjema.datareferanse ?? null,
        });
        setNokkeltall((prev) =>
          prev.map((n) =>
            n.id === redigerer ? { ...n, ...skjema } as NokkeltallData : n
          )
        );
      }
      setRedigerer(null);
    } catch (e) {
      alert((e as Error).message);
    }
    setLaster(false);
  };

  const handleSlett = async (id: number) => {
    if (!confirm("Slette dette nøkkeltallet?")) return;
    await slettNokkeltall(id);
    setNokkeltall((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <button className="admin-btn admin-btn-primary" onClick={startNytt}>
          + Legg til nøkkeltall
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Etikett</th>
            <th>Verdi</th>
            <th>Enhet</th>
            <th>Endring</th>
            <th>Datareferanse</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {nokkeltall.map((n) => (
            <tr key={n.id}>
              <td>{n.etikett}</td>
              <td><strong>{n.verdi}</strong></td>
              <td>{n.enhet ?? "—"}</td>
              <td>{n.endringsindikator ?? "—"}</td>
              <td>
                {n.datareferanse ? (
                  <code style={{ fontSize: "0.75rem", background: "#f0f0f0", padding: "0.125rem 0.375rem", borderRadius: "3px" }}>
                    {n.datareferanse}
                  </code>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <div className="admin-actions">
                  <button
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={() => startRediger(n)}
                  >
                    Rediger
                  </button>
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => handleSlett(n.id)}
                  >
                    Slett
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {nokkeltall.length === 0 && (
        <div className="admin-tom-tilstand">
          <p><strong>Ingen nøkkeltall</strong></p>
          <p>Legg til nøkkeltall som kan brukes i moduler for {aarstall}.</p>
        </div>
      )}

      {/* Redigeringsmodal */}
      {redigerer !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "400px",
            height: "100vh",
            background: "#fff",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>
              {redigerer === -1 ? "Nytt nøkkeltall" : "Rediger nøkkeltall"}
            </h3>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setRedigerer(null)}>
              Lukk
            </button>
          </div>
          <div style={{ padding: "1.5rem", flex: 1, overflow: "auto" }}>
            <div className="admin-form-group">
              <label>Etikett</label>
              <input
                className="admin-input"
                value={skjema.etikett ?? ""}
                onChange={(e) => setSkjema((p) => ({ ...p, etikett: e.target.value }))}
                placeholder="F.eks. «Totale utgifter»"
              />
            </div>
            <div className="admin-form-group">
              <label>Verdi</label>
              <input
                className="admin-input"
                value={skjema.verdi ?? ""}
                onChange={(e) => setSkjema((p) => ({ ...p, verdi: e.target.value }))}
                placeholder="F.eks. «2 970,9»"
              />
            </div>
            <div className="admin-form-group">
              <label>Enhet</label>
              <select
                className="admin-select"
                value={skjema.enhet ?? ""}
                onChange={(e) => setSkjema((p) => ({ ...p, enhet: e.target.value || null }))}
              >
                <option value="">Ingen</option>
                <option value="mrd. kr">mrd. kr</option>
                <option value="mill. kr">mill. kr</option>
                <option value="kr">kr</option>
                <option value="%">%</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Endringsindikator</label>
              <select
                className="admin-select"
                value={skjema.endringsindikator ?? ""}
                onChange={(e) => setSkjema((p) => ({ ...p, endringsindikator: e.target.value || null }))}
              >
                <option value="">Ingen</option>
                <option value="opp">Opp</option>
                <option value="ned">Ned</option>
                <option value="noytral">Nøytral</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Datareferanse</label>
              <input
                className="admin-input"
                value={skjema.datareferanse ?? ""}
                onChange={(e) => setSkjema((p) => ({ ...p, datareferanse: e.target.value || null }))}
                placeholder="F.eks. «utgifter.total»"
              />
              <p className="help-text">
                Verdien hentes automatisk fra JSON-dataene ved byggetidspunktet
              </p>
            </div>
          </div>
          <div style={{ padding: "1.5rem", borderTop: "1px solid #eee" }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleLagre}
              disabled={laster}
              style={{ width: "100%" }}
            >
              {laster ? "Lagrer..." : "Lagre"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
