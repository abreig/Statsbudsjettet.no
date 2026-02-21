"use client";

import { useEffect, useRef, useCallback } from "react";
import type { NasjonalbudsjettetKonfigurasjon } from "./types";
import SeksjonsRenderer from "./SeksjonsRenderer";
import styles from "./NasjonalbudsjettetPanel.module.css";

interface NasjonalbudsjettetPanelProps {
  konfigurasjon: NasjonalbudsjettetKonfigurasjon;
  aar: number;
  onLukk: () => void;
}

const FOKUSBARE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function NasjonalbudsjettetPanel({
  konfigurasjon,
  aar,
  onLukk,
}: NasjonalbudsjettetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fokus-felle og Escape-lukking
  const handleTastatur = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onLukk();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const fokusbare = panel.querySelectorAll(FOKUSBARE);
      if (fokusbare.length === 0) return;

      const foerste = fokusbare[0] as HTMLElement;
      const siste = fokusbare[fokusbare.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === foerste) {
          e.preventDefault();
          siste.focus();
        }
      } else {
        if (document.activeElement === siste) {
          e.preventDefault();
          foerste.focus();
        }
      }
    },
    [onLukk]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleTastatur);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    // Oppdater URL
    const url = new URL(window.location.href);
    url.searchParams.set("panel", "nasjonalbudsjettet");
    window.history.replaceState({}, "", url.toString());

    return () => {
      document.removeEventListener("keydown", handleTastatur);
      document.body.style.overflow = "";

      // Fjern panel-parameter fra URL
      const u = new URL(window.location.href);
      u.searchParams.delete("panel");
      window.history.replaceState({}, "", u.toString());
    };
  }, [handleTastatur]);

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onLukk} aria-hidden="true" />

      {/* Panel */}
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nasjonalbudsjettet-panel-tittel"
        id="nasjonalbudsjettet-panel"
        tabIndex={-1}
      >
        {/* Sticky header */}
        <div className={styles.header}>
          <button
            className={styles.lukkKnapp}
            onClick={onLukk}
            aria-label="Lukk nasjonalbudsjettet-panelet"
          >
            <span aria-hidden="true">&larr;</span> Lukk
          </button>
          <h2
            id="nasjonalbudsjettet-panel-tittel"
            className={styles.panelTittel}
          >
            Nasjonalbudsjettet {aar}
          </h2>
        </div>

        {/* Scrollbart innhold */}
        <div className={styles.innhold}>
          <SeksjonsRenderer seksjoner={konfigurasjon.seksjoner} />

          {/* PDF-lenke nederst */}
          <div className={styles.bunntekst}>
            <a
              href={konfigurasjon.pdf_lenke}
              className={styles.pdfLenke}
              target="_blank"
              rel="noopener noreferrer"
            >
              Last ned hele Nasjonalbudsjettet (PDF)
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
