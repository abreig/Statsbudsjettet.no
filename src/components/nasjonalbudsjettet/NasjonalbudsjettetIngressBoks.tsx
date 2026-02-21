"use client";

import type { NasjonalbudsjettetKonfigurasjon } from "./types";
import styles from "./NasjonalbudsjettetIngressBoks.module.css";

interface NasjonalbudsjettetIngressBoksProps {
  konfigurasjon: NasjonalbudsjettetKonfigurasjon;
  onAapne: () => void;
  erAapen?: boolean;
}

export default function NasjonalbudsjettetIngressBoks({
  konfigurasjon,
  onAapne,
  erAapen = false,
}: NasjonalbudsjettetIngressBoksProps) {
  if (!konfigurasjon.vis_paa_landingsside) return null;

  return (
    <section
      className={styles.boks}
      id="nasjonalbudsjettet"
      aria-label="Nasjonalbudsjettet"
    >
      <div className={styles.header}>
        <h2 className={styles.tittel}>{konfigurasjon.tittel}</h2>
        <span className={styles.badge}>Meld. St. 1</span>
      </div>

      <p className={styles.ingress}>{konfigurasjon.ingress}</p>

      {/* Nøkkeltall-rad */}
      <div className={styles.nokkeltallRad}>
        {konfigurasjon.nokkeltall.map((tall) => (
          <div key={tall.etikett} className={styles.nokkeltallItem}>
            <div className={styles.nokkeltallVerdi}>{tall.verdi}</div>
            <div className={styles.nokkeltallEtikett}>{tall.etikett}</div>
            {tall.endring && (
              <div
                className={styles.nokkeltallEndring}
                data-retning={tall.retning ?? "noytral"}
                data-positivt={tall.positivt_er}
              >
                {tall.endring}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Handlinger */}
      <div className={styles.handlinger}>
        <button
          className={styles.lesMerKnapp}
          onClick={onAapne}
          aria-expanded={erAapen}
          aria-controls="nasjonalbudsjettet-panel"
        >
          Les mer om norsk økonomi
          <span aria-hidden="true"> &rarr;</span>
        </button>

        <a
          href={konfigurasjon.pdf_lenke}
          className={styles.pdfLenke}
          target="_blank"
          rel="noopener noreferrer"
        >
          Last ned Meld. St. 1 (PDF)
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
    </section>
  );
}
