/**
 * Klient-komponent for mediebibliotek med filopplasting.
 */

"use client";

import { useState, useRef } from "react";
import { lastOppMedia, slettMedia, oppdaterAltTekst } from "./actions";

interface MediaItem {
  id: number;
  filnavn: string;
  lagringsbane: string;
  mimeType: string;
  stoerrelseBytes: number | null;
  altTekst: string | null;
  lastetOppAv: string | null;
  lastetOppTid: string;
  budsjettaar: number | null;
}

const TILLATTE_TYPER = ["image/jpeg", "image/png", "image/webp"];
const MAKS_STORRELSE = 5 * 1024 * 1024; // 5 MB

export function MediaBibliotek({
  media: initial,
  budsjettaar,
}: {
  media: MediaItem[];
  budsjettaar: { id: number; aarstall: number }[];
}) {
  const [media, setMedia] = useState(initial);
  const [filter, setFilter] = useState<number | "">("");
  const [laster, setLaster] = useState(false);
  const [melding, setMelding] = useState<{ type: "suksess" | "feil"; tekst: string } | null>(null);
  const [redigererAlt, setRedigererAlt] = useState<number | null>(null);
  const [altVerdi, setAltVerdi] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtrertMedia = filter
    ? media.filter((m) => m.budsjettaar === filter)
    : media;

  const handleFilEndring = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filer = e.target.files;
    if (!filer || filer.length === 0) return;

    for (const fil of Array.from(filer)) {
      if (!TILLATTE_TYPER.includes(fil.type)) {
        setMelding({ type: "feil", tekst: `Ugyldig filtype: ${fil.type}. Kun JPEG, PNG og WebP er tillatt.` });
        continue;
      }
      if (fil.size > MAKS_STORRELSE) {
        setMelding({ type: "feil", tekst: `Filen ${fil.name} er for stor (maks 5 MB)` });
        continue;
      }

      setLaster(true);
      try {
        const formData = new FormData();
        formData.append("fil", fil);
        if (filter) formData.append("budsjettaarId", String(filter));

        const nyMedia = await lastOppMedia(formData);
        setMedia((prev) => [nyMedia, ...prev]);
        setMelding({ type: "suksess", tekst: `${fil.name} lastet opp` });
      } catch (e) {
        setMelding({ type: "feil", tekst: (e as Error).message });
      }
      setLaster(false);
    }

    // Reset filvelger
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSlett = async (id: number) => {
    if (!confirm("Slette dette bildet?")) return;
    try {
      await slettMedia(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
      setMelding({ type: "suksess", tekst: "Bilde slettet" });
    } catch (e) {
      setMelding({ type: "feil", tekst: (e as Error).message });
    }
  };

  const handleLagreAlt = async (id: number) => {
    try {
      await oppdaterAltTekst(id, altVerdi);
      setMedia((prev) =>
        prev.map((m) => (m.id === id ? { ...m, altTekst: altVerdi } : m))
      );
      setRedigererAlt(null);
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

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <label
          htmlFor="file-upload"
          className="admin-btn admin-btn-primary"
          style={{ cursor: "pointer" }}
        >
          {laster ? "Laster opp..." : "+ Last opp bilder"}
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFilEndring}
          style={{ display: "none" }}
          disabled={laster}
        />

        <select
          className="admin-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value ? parseInt(e.target.value) : "")}
          style={{ width: "200px" }}
        >
          <option value="">Alle budsjettår</option>
          {budsjettaar.map((b) => (
            <option key={b.id} value={b.aarstall}>
              {b.aarstall}
            </option>
          ))}
        </select>

        <span style={{ color: "#888", fontSize: "0.8125rem" }}>
          {filtrertMedia.length} bilder
        </span>
      </div>

      {filtrertMedia.length === 0 ? (
        <div className="admin-tom-tilstand">
          <p><strong>Ingen bilder</strong></p>
          <p>Last opp bilder med knappen ovenfor.</p>
        </div>
      ) : (
        <div className="admin-grid admin-grid-4">
          {filtrertMedia.map((m) => (
            <div key={m.id} className="admin-card" style={{ padding: "0", overflow: "hidden" }}>
              <div
                style={{
                  height: "140px",
                  background: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.lagringsbane}
                  alt={m.altTekst ?? m.filnavn}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "0.75rem" }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.filnavn}
                </p>
                {redigererAlt === m.id ? (
                  <div style={{ marginTop: "0.375rem" }}>
                    <input
                      className="admin-input"
                      value={altVerdi}
                      onChange={(e) => setAltVerdi(e.target.value)}
                      placeholder="Alternativ tekst"
                      style={{ fontSize: "0.75rem" }}
                    />
                    <div className="admin-actions" style={{ marginTop: "0.25rem" }}>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleLagreAlt(m.id)}>
                        Lagre
                      </button>
                      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setRedigererAlt(null)}>
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: m.altTekst ? "#555" : "#ccc" }}>
                    {m.altTekst ?? "Ingen alt-tekst"}
                  </p>
                )}
                <div className="admin-actions" style={{ marginTop: "0.5rem" }}>
                  <button
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={() => {
                      setRedigererAlt(m.id);
                      setAltVerdi(m.altTekst ?? "");
                    }}
                  >
                    Alt-tekst
                  </button>
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => handleSlett(m.id)}
                  >
                    Slett
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
