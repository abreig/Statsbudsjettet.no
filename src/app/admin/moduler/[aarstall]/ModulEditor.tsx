/**
 * Klient-komponent for modul-editor med drag-and-drop.
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
import {
  oppdaterModulRekkefoelge,
  oppdaterModulSynlighet,
  oppdaterModulKonfigurasjon,
  opprettModul,
} from "./actions";

interface ModulData {
  id: number;
  type: string;
  rekkefoelge: number;
  synlig: boolean;
  konfigurasjon: Record<string, unknown>;
}

const MODUL_TYPER: Record<string, { label: string; ikon: string }> = {
  hero: { label: "Hero", ikon: "★" },
  plan_for_norge: { label: "Plan for Norge", ikon: "◆" },
  budsjettgrafer: { label: "Budsjettgrafer", ikon: "▮" },
  nokkeltall: { label: "Nøkkeltall", ikon: "#" },
  egendefinert_tekst: { label: "Egendefinert tekst", ikon: "¶" },
};

function SortableModul({
  modul,
  erRedaktor,
  onToggleSynlighet,
  onRediger,
}: {
  modul: ModulData;
  erRedaktor: boolean;
  onToggleSynlighet: (id: number, synlig: boolean) => void;
  onRediger: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: modul.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo = MODUL_TYPER[modul.type] ?? { label: modul.type, ikon: "?" };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dnd-item ${isDragging ? "dragging" : ""}`}
    >
      {erRedaktor && (
        <div className="dnd-handle" {...attributes} {...listeners} aria-label="Dra for å flytte">
          ⋮⋮
        </div>
      )}
      <span style={{ fontSize: "1.25rem", width: "2rem", textAlign: "center" }}>
        {typeInfo.ikon}
      </span>
      <div className="dnd-content">
        <strong>{typeInfo.label}</strong>
        {Boolean(modul.konfigurasjon?.tittel) && (
          <span style={{ color: "#888", marginLeft: "0.5rem", fontSize: "0.8125rem" }}>
            — {String(modul.konfigurasjon.tittel)}
          </span>
        )}
      </div>
      {erRedaktor && (
        <>
          <button
            className={`synlighet-toggle ${modul.synlig ? "aktiv" : ""}`}
            onClick={() => onToggleSynlighet(modul.id, !modul.synlig)}
            aria-label={modul.synlig ? "Skjul modul" : "Vis modul"}
          />
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => onRediger(modul.id)}
          >
            Rediger
          </button>
        </>
      )}
    </div>
  );
}

export function ModulEditor({
  budsjettaarId,
  aarstall,
  moduler: initialModuler,
  erRedaktor,
}: {
  budsjettaarId: number;
  aarstall: number;
  moduler: ModulData[];
  erRedaktor: boolean;
}) {
  const [moduler, setModuler] = useState(initialModuler);
  const [redigerer, setRedigerer] = useState<number | null>(null);
  const [konfig, setKonfig] = useState<Record<string, unknown>>({});
  const [visNyModul, setVisNyModul] = useState(false);
  const [nyType, setNyType] = useState("egendefinert_tekst");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const gammelIndex = moduler.findIndex((m) => m.id === active.id);
    const nyIndex = moduler.findIndex((m) => m.id === over.id);
    const nyRekkefølge = arrayMove(moduler, gammelIndex, nyIndex);
    setModuler(nyRekkefølge);

    // Lagre ny rekkefølge
    await oppdaterModulRekkefoelge(
      nyRekkefølge.map((m, i) => ({ id: m.id, rekkefoelge: i }))
    );
  };

  const handleToggleSynlighet = async (id: number, synlig: boolean) => {
    setModuler((prev) =>
      prev.map((m) => (m.id === id ? { ...m, synlig } : m))
    );
    await oppdaterModulSynlighet(id, synlig);
  };

  const handleStartRediger = (id: number) => {
    const modul = moduler.find((m) => m.id === id);
    if (modul) {
      setRedigerer(id);
      setKonfig(modul.konfigurasjon);
    }
  };

  const handleLagreKonfig = async () => {
    if (redigerer === null) return;
    await oppdaterModulKonfigurasjon(redigerer, konfig);
    setModuler((prev) =>
      prev.map((m) =>
        m.id === redigerer ? { ...m, konfigurasjon: konfig } : m
      )
    );
    setRedigerer(null);
  };

  const handleOpprettModul = async () => {
    const nyModul = await opprettModul(budsjettaarId, nyType, moduler.length);
    setModuler((prev) => [
      ...prev,
      {
        id: nyModul.id,
        type: nyModul.type,
        rekkefoelge: nyModul.rekkefoelge,
        synlig: nyModul.synlig,
        konfigurasjon: nyModul.konfigurasjon as Record<string, unknown>,
      },
    ]);
    setVisNyModul(false);
  };

  return (
    <>
      {erRedaktor && (
        <div style={{ marginBottom: "1rem" }}>
          {!visNyModul ? (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setVisNyModul(true)}
            >
              + Legg til modul
            </button>
          ) : (
            <div className="admin-card" style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
              <div className="admin-form-group" style={{ margin: 0, flex: 1 }}>
                <label htmlFor="ny-modul-type">Modultype</label>
                <select
                  id="ny-modul-type"
                  className="admin-select"
                  value={nyType}
                  onChange={(e) => setNyType(e.target.value)}
                >
                  {Object.entries(MODUL_TYPER).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.ikon} {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-actions">
                <button className="admin-btn admin-btn-primary" onClick={handleOpprettModul}>
                  Legg til
                </button>
                <button className="admin-btn admin-btn-secondary" onClick={() => setVisNyModul(false)}>
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={moduler.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          {moduler.map((modul) => (
            <SortableModul
              key={modul.id}
              modul={modul}
              erRedaktor={erRedaktor}
              onToggleSynlighet={handleToggleSynlighet}
              onRediger={handleStartRediger}
            />
          ))}
        </SortableContext>
      </DndContext>

      {moduler.length === 0 && (
        <div className="admin-tom-tilstand">
          <p><strong>Ingen moduler</strong></p>
          <p>Legg til moduler for å bygge landingssiden for {aarstall}.</p>
        </div>
      )}

      {/* Konfigurasjonsredaktør (sidepanel) */}
      {redigerer !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "480px",
            height: "100vh",
            background: "#fff",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Rediger modul</h3>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setRedigerer(null)}>
              Lukk
            </button>
          </div>
          <div style={{ padding: "1.5rem", flex: 1, overflow: "auto" }}>
            <KonfigEditor type={moduler.find((m) => m.id === redigerer)?.type ?? ""} konfig={konfig} onChange={setKonfig} />
          </div>
          <div style={{ padding: "1.5rem", borderTop: "1px solid #eee" }}>
            <button className="admin-btn admin-btn-primary" onClick={handleLagreKonfig} style={{ width: "100%" }}>
              Lagre endringer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Dynamisk konfigurasjonsskjema basert på modultype.
 */
function KonfigEditor({
  type,
  konfig,
  onChange,
}: {
  type: string;
  konfig: Record<string, unknown>;
  onChange: (k: Record<string, unknown>) => void;
}) {
  const oppdater = (felt: string, verdi: unknown) => {
    onChange({ ...konfig, [felt]: verdi });
  };

  switch (type) {
    case "hero":
      return (
        <>
          <div className="admin-form-group">
            <label>Tittel</label>
            <input
              className="admin-input"
              value={String(konfig.tittel ?? "")}
              onChange={(e) => oppdater("tittel", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Undertittel</label>
            <input
              className="admin-input"
              value={String(konfig.undertittel ?? "")}
              onChange={(e) => oppdater("undertittel", e.target.value)}
            />
          </div>
        </>
      );

    case "budsjettgrafer":
      return (
        <>
          <div className="admin-form-group">
            <label>Overskrift</label>
            <input
              className="admin-input"
              value={String(konfig.overskrift ?? "")}
              onChange={(e) => oppdater("overskrift", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Forklaringstekst</label>
            <textarea
              className="admin-textarea"
              value={String(konfig.forklaringstekst ?? "")}
              onChange={(e) => oppdater("forklaringstekst", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>SPU-forklaring</label>
            <textarea
              className="admin-textarea"
              value={String(konfig.spuForklaring ?? "")}
              onChange={(e) => oppdater("spuForklaring", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>
              <input
                type="checkbox"
                checked={Boolean(konfig.visEndringDefault)}
                onChange={(e) => oppdater("visEndringDefault", e.target.checked)}
              />{" "}
              Vis sammenligningsvisning som standard
            </label>
          </div>
        </>
      );

    case "nokkeltall":
      return (
        <>
          <div className="admin-form-group">
            <label>Tittel</label>
            <input
              className="admin-input"
              value={String(konfig.tittel ?? "")}
              onChange={(e) => oppdater("tittel", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Layout</label>
            <select
              className="admin-select"
              value={String(konfig.layout ?? "rad")}
              onChange={(e) => oppdater("layout", e.target.value)}
            >
              <option value="rad">Rad</option>
              <option value="liste">Liste</option>
              <option value="rutenett">Rutenett</option>
            </select>
          </div>
        </>
      );

    case "egendefinert_tekst":
      return (
        <>
          <div className="admin-form-group">
            <label>Tittel</label>
            <input
              className="admin-input"
              value={String(konfig.tittel ?? "")}
              onChange={(e) => oppdater("tittel", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Bakgrunnsfarge</label>
            <input
              type="color"
              value={String(konfig.bakgrunnsfarge ?? "#ffffff")}
              onChange={(e) => oppdater("bakgrunnsfarge", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Bredde</label>
            <select
              className="admin-select"
              value={String(konfig.bredde ?? "bred")}
              onChange={(e) => oppdater("bredde", e.target.value)}
            >
              <option value="smal">Smal</option>
              <option value="bred">Bred</option>
              <option value="fullbredde">Fullbredde</option>
            </select>
          </div>
        </>
      );

    case "plan_for_norge":
      return (
        <div className="admin-form-group">
          <label>Overskrift</label>
          <input
            className="admin-input"
            value={String(konfig.overskrift ?? "")}
            onChange={(e) => oppdater("overskrift", e.target.value)}
          />
          <p className="help-text">
            Temaer redigeres under Temaer-fanen.
          </p>
        </div>
      );

    default:
      return <p>Ukjent modultype: {type}</p>;
  }
}
