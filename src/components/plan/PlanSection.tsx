"use client";

import { useState } from "react";
import type { CMSTema } from "@/lib/mock-cms";
import { formaterBelop } from "@/components/shared/NumberFormat";
import type { BudgetYear } from "@/components/data/types/budget";
import { opplosDatareferanse } from "@/lib/datareferanse";
import ModalOverlay from "@/components/shared/ModalOverlay";
import styles from "./PlanSection.module.css";

interface PlanSectionProps {
  temaer: CMSTema[];
  budsjettdata?: BudgetYear | null;
  onBudsjettNavigasjon?: (omrNr: number) => void;
}

export default function PlanSection({
  temaer,
  budsjettdata,
  onBudsjettNavigasjon,
}: PlanSectionProps) {
  const [aktivtTema, setAktivtTema] = useState<number | null>(null);

  const aktivtTemaData = temaer.find((t) => t.nr === aktivtTema) ?? null;

  const handleBudsjettKlikk = (omrNr: number) => {
    // Lukk modal først, så naviger til budsjett-drill-down
    setAktivtTema(null);
    // Gi tid til at modal lukkes før vi scroller/åpner drill-down
    requestAnimationFrame(() => {
      const budsjettSeksjon = document.getElementById("budsjett");
      if (budsjettSeksjon) {
        budsjettSeksjon.scrollIntoView({ behavior: "smooth" });
      }
      // Vent litt på scroll, deretter åpne drill-down
      setTimeout(() => {
        onBudsjettNavigasjon?.(omrNr);
      }, 400);
    });
  };

  return (
    <section className={styles.section} id="plan">
      <h2 className={styles.sectionTitle}>Regjeringens plan for Norge</h2>

      <div className={styles.temaGrid}>
        {temaer.map((tema) => (
          <article
            key={tema.nr}
            className={styles.temaKort}
            onClick={() => setAktivtTema(tema.nr)}
            role="button"
            tabIndex={0}
            aria-label={`${tema.tittel}. Klikk for å lese mer.`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setAktivtTema(tema.nr);
              }
            }}
          >
            <div
              className={styles.temaFargeLinje}
              style={{ backgroundColor: tema.farge }}
            />
            <h3 className={styles.temaTittel}>{tema.tittel}</h3>
            <p className={styles.temaIngress}>{tema.ingress}</p>
            <span
              className={styles.lesMer}
              style={{ color: tema.farge }}
              aria-hidden="true"
            >
              Les mer &rarr;
            </span>
          </article>
        ))}
      </div>

      {/* TemaDetalj i ModalOverlay */}
      <ModalOverlay
        open={aktivtTemaData !== null}
        onClose={() => setAktivtTema(null)}
        ariaLabel={aktivtTemaData?.tittel ?? "Temavisning"}
      >
        {aktivtTemaData && (
          <TemaDetalj
            tema={aktivtTemaData}
            budsjettdata={budsjettdata}
            onClose={() => setAktivtTema(null)}
            onBudsjettNavigasjon={handleBudsjettKlikk}
          />
        )}
      </ModalOverlay>
    </section>
  );
}

function TemaDetalj({
  tema,
  budsjettdata,
  onClose,
  onBudsjettNavigasjon,
}: {
  tema: CMSTema;
  budsjettdata?: BudgetYear | null;
  onClose: () => void;
  onBudsjettNavigasjon?: (omrNr: number) => void;
}) {
  return (
    <div className={styles.detalj}>
      <div className={styles.detaljHeader}>
        <div>
          <div
            className={styles.temaFargeLinje}
            style={{ backgroundColor: tema.farge, width: 48, marginBottom: "var(--space-2)" }}
          />
          <h3 className={styles.detaljTittel} style={{ color: tema.farge }}>
            {tema.tittel}
          </h3>
        </div>
        <button className={styles.detaljLukk} onClick={onClose} aria-label="Lukk">
          ✕
        </button>
      </div>

      <div className={styles.detaljInnhold}>
        <p>{tema.problembeskrivelse}</p>
      </div>

      {tema.prioriteringer.length > 0 && (
        <>
          <h4 style={{ marginBottom: "var(--space-2)", fontFamily: "var(--font-sans)", fontWeight: "var(--vekt-semibold)" }}>
            Prioriteringer
          </h4>
          <ul className={styles.prioriteringListe}>
            {tema.prioriteringer.map((pri) => (
              <li key={pri.tittel} className={styles.prioritering}>
                <div className={styles.prioriteringTittel}>{pri.tittel}</div>
                <div style={{ fontSize: "var(--tekst-sm)", color: "var(--tekst-sekundaer)" }}>
                  {pri.beskrivelse}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tema.sitat && (
        <blockquote
          className={styles.sitatBlokk}
          style={{ borderColor: tema.farge }}
        >
          <p className={styles.sitatTekst}>&laquo;{tema.sitat.tekst}&raquo;</p>
          <footer className={styles.sitatPerson}>
            — {tema.sitat.person}, {tema.sitat.tittel}
          </footer>
        </blockquote>
      )}

      {tema.budsjettlenker.length > 0 && (
        <div>
          <h4 style={{ marginBottom: "var(--space-2)", fontFamily: "var(--font-sans)", fontWeight: "var(--vekt-semibold)" }}>
            Relaterte budsjettområder
          </h4>
          <div className={styles.budsjettLenker}>
            {tema.budsjettlenker.map((lenke) => {
              let belop: string | null = null;
              if (budsjettdata && lenke.datareferanse) {
                const verdi = opplosDatareferanse(lenke.datareferanse, budsjettdata);
                if (verdi !== null) belop = formaterBelop(verdi);
              }

              return (
                <button
                  key={lenke.omrNr}
                  className={styles.budsjettLenke}
                  onClick={() => onBudsjettNavigasjon?.(lenke.omrNr)}
                >
                  {lenke.visningsnavn}
                  {belop && <span style={{ fontFamily: "var(--font-tall)" }}>{belop}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
