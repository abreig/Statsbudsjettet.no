/**
 * Klient-komponent for tema-liste med opprettelse og redigering.
 */

"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TipTapEditor } from "@/components/admin/TipTapEditor";
import {
  opprettTema,
  oppdaterTema,
  slettTema,
  oppdaterTemaRekkefoelge,
} from "./actions";

interface TemaData {
  id: number;
  rekkefoelge: number;
  tittel: string;
  ingress: string | null;
  farge: string | null;
  ikonUrl: string | null;
  problembeskrivelse: unknown;
  analysegraf: unknown;
  prioriteringer: { tittel: string; beskrivelse: string }[] | null;
  sitatTekst: string | null;
  sitatPerson: string | null;
  sitatTittel: string | null;
  sitatBildeUrl: string | null;
  budsjettlenker: { omrNr: number; visningsnavn: string; datareferanse: string }[] | null;
}

function SortableTemaKort({
  tema,
  onRediger,
  onSlett,
}: {
  tema: TemaData;
  onRediger: (id: number) => void;
  onSlett: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tema.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`dnd-item ${isDragging ? "dragging" : ""}`}>
      <div className="dnd-handle" {...attributes} {...listeners} aria-label="Dra for å flytte">
        ⋮⋮
      </div>
      <span
        style={{
          width: "1.5rem",
          height: "1.5rem",
          borderRadius: "50%",
          background: tema.farge ?? "#ccc",
          flexShrink: 0,
        }}
      />
      <div className="dnd-content">
        <strong>{tema.tittel}</strong>
        {tema.ingress && (
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#666" }}>
            {tema.ingress.substring(0, 80)}{tema.ingress.length > 80 ? "..." : ""}
          </p>
        )}
      </div>
      <div className="admin-actions">
        <button
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={() => onRediger(tema.id)}
        >
          Rediger
        </button>
        <button
          className="admin-btn admin-btn-danger admin-btn-sm"
          onClick={() => onSlett(tema.id)}
        >
          Slett
        </button>
      </div>
    </div>
  );
}

export function TemaListe({
  budsjettaarId,
  aarstall,
  temaer: initialTemaer,
}: {
  budsjettaarId: number;
  aarstall: number;
  temaer: TemaData[];
}) {
  const [temaer, setTemaer] = useState(initialTemaer);
  const [redigerer, setRedigerer] = useState<number | null>(null);
  const [skjema, setSkjema] = useState<Partial<TemaData>>({});
  const [laster, setLaster] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const gammel = temaer.findIndex((t) => t.id === active.id);
    const ny = temaer.findIndex((t) => t.id === over.id);
    const nyRekkefølge = arrayMove(temaer, gammel, ny);
    setTemaer(nyRekkefølge);

    await oppdaterTemaRekkefoelge(
      nyRekkefølge.map((t, i) => ({ id: t.id, rekkefoelge: i }))
    );
  };

  const startRediger = (id: number) => {
    const tema = temaer.find((t) => t.id === id);
    if (tema) {
      setRedigerer(id);
      setSkjema(tema);
    }
  };

  const startNytt = () => {
    setRedigerer(-1);
    setSkjema({
      tittel: "",
      ingress: "",
      farge: "#2A7F7F",
      prioriteringer: [],
      budsjettlenker: [],
    });
  };

  const handleLagre = async () => {
    setLaster(true);
    try {
      if (redigerer === -1) {
        const nyttTema = await opprettTema(budsjettaarId, {
          tittel: skjema.tittel ?? "",
          ingress: skjema.ingress ?? null,
          farge: skjema.farge ?? null,
          problembeskrivelse: skjema.problembeskrivelse ?? null,
          prioriteringer: skjema.prioriteringer ?? null,
          sitatTekst: skjema.sitatTekst ?? null,
          sitatPerson: skjema.sitatPerson ?? null,
          sitatTittel: skjema.sitatTittel ?? null,
          budsjettlenker: skjema.budsjettlenker ?? null,
          rekkefoelge: temaer.length,
        });
        setTemaer((prev) => [...prev, { ...skjema, id: nyttTema.id, rekkefoelge: temaer.length } as TemaData]);
      } else if (redigerer !== null) {
        await oppdaterTema(redigerer, {
          tittel: skjema.tittel ?? "",
          ingress: skjema.ingress ?? null,
          farge: skjema.farge ?? null,
          problembeskrivelse: skjema.problembeskrivelse ?? null,
          prioriteringer: skjema.prioriteringer ?? null,
          sitatTekst: skjema.sitatTekst ?? null,
          sitatPerson: skjema.sitatPerson ?? null,
          sitatTittel: skjema.sitatTittel ?? null,
          budsjettlenker: skjema.budsjettlenker ?? null,
        });
        setTemaer((prev) =>
          prev.map((t) => (t.id === redigerer ? { ...t, ...skjema } : t))
        );
      }
      setRedigerer(null);
    } catch (e) {
      alert((e as Error).message);
    }
    setLaster(false);
  };

  const handleSlett = async (id: number) => {
    if (!confirm("Slette dette temaet?")) return;
    await slettTema(id);
    setTemaer((prev) => prev.filter((t) => t.id !== id));
  };

  const oppdaterSkjemaFelt = (felt: string, verdi: unknown) => {
    setSkjema((prev) => ({ ...prev, [felt]: verdi }));
  };

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <button className="admin-btn admin-btn-primary" onClick={startNytt}>
          + Legg til tema
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={temaer.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {temaer.map((tema) => (
            <SortableTemaKort
              key={tema.id}
              tema={tema}
              onRediger={startRediger}
              onSlett={handleSlett}
            />
          ))}
        </SortableContext>
      </DndContext>

      {temaer.length === 0 && (
        <div className="admin-tom-tilstand">
          <p><strong>Ingen temaer</strong></p>
          <p>Legg til temaer for Plan for Norge-seksjonen for {aarstall}.</p>
        </div>
      )}

      {/* Redigeringspanel */}
      {redigerer !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "560px",
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
              {redigerer === -1 ? "Nytt tema" : "Rediger tema"}
            </h3>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setRedigerer(null)}>
              Lukk
            </button>
          </div>
          <div style={{ padding: "1.5rem", flex: 1, overflow: "auto" }}>
            <div className="admin-form-group">
              <label>Tittel</label>
              <input
                className="admin-input"
                value={String(skjema.tittel ?? "")}
                onChange={(e) => oppdaterSkjemaFelt("tittel", e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Ingress</label>
              <textarea
                className="admin-textarea"
                value={String(skjema.ingress ?? "")}
                onChange={(e) => oppdaterSkjemaFelt("ingress", e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Farge</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="color"
                  value={String(skjema.farge ?? "#2A7F7F")}
                  onChange={(e) => oppdaterSkjemaFelt("farge", e.target.value)}
                />
                <input
                  className="admin-input"
                  value={String(skjema.farge ?? "")}
                  onChange={(e) => oppdaterSkjemaFelt("farge", e.target.value)}
                  style={{ width: "120px" }}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Problembeskrivelse</label>
              <TipTapEditor
                value={skjema.problembeskrivelse}
                onChange={(json) => oppdaterSkjemaFelt("problembeskrivelse", json)}
                placeholder="Beskriv problemet temaet adresserer..."
              />
            </div>

            {/* Prioriteringer */}
            <div className="admin-form-group">
              <label>Prioriteringer</label>
              {(skjema.prioriteringer ?? []).map((p, i) => (
                <div key={i} className="admin-card" style={{ marginBottom: "0.5rem" }}>
                  <input
                    className="admin-input"
                    value={p.tittel}
                    onChange={(e) => {
                      const ny = [...(skjema.prioriteringer ?? [])];
                      ny[i] = { ...ny[i], tittel: e.target.value };
                      oppdaterSkjemaFelt("prioriteringer", ny);
                    }}
                    placeholder="Tittel"
                    style={{ marginBottom: "0.5rem" }}
                  />
                  <textarea
                    className="admin-textarea"
                    value={p.beskrivelse}
                    onChange={(e) => {
                      const ny = [...(skjema.prioriteringer ?? [])];
                      ny[i] = { ...ny[i], beskrivelse: e.target.value };
                      oppdaterSkjemaFelt("prioriteringer", ny);
                    }}
                    placeholder="Beskrivelse"
                    style={{ minHeight: "60px" }}
                  />
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => {
                      const ny = (skjema.prioriteringer ?? []).filter((_, j) => j !== i);
                      oppdaterSkjemaFelt("prioriteringer", ny);
                    }}
                  >
                    Fjern
                  </button>
                </div>
              ))}
              <button
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => {
                  oppdaterSkjemaFelt("prioriteringer", [
                    ...(skjema.prioriteringer ?? []),
                    { tittel: "", beskrivelse: "" },
                  ]);
                }}
              >
                + Legg til prioritering
              </button>
            </div>

            {/* Sitat */}
            <div className="admin-form-group">
              <label>Sitat</label>
              <textarea
                className="admin-textarea"
                value={String(skjema.sitatTekst ?? "")}
                onChange={(e) => oppdaterSkjemaFelt("sitatTekst", e.target.value)}
                placeholder="Sitattekst"
                style={{ minHeight: "60px" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  className="admin-input"
                  value={String(skjema.sitatPerson ?? "")}
                  onChange={(e) => oppdaterSkjemaFelt("sitatPerson", e.target.value)}
                  placeholder="Person"
                />
                <input
                  className="admin-input"
                  value={String(skjema.sitatTittel ?? "")}
                  onChange={(e) => oppdaterSkjemaFelt("sitatTittel", e.target.value)}
                  placeholder="Tittel"
                />
              </div>
            </div>
          </div>
          <div style={{ padding: "1.5rem", borderTop: "1px solid #eee" }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleLagre}
              disabled={laster}
              style={{ width: "100%" }}
            >
              {laster ? "Lagrer..." : "Lagre tema"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
