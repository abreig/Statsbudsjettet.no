"use client";

import { formaterBelop } from "@/components/shared/NumberFormat";
import CountUp from "@/components/shared/CountUp";
import type { BudgetYear } from "@/components/data/types/budget";
import { opplosDatareferanse } from "@/lib/datareferanse";
import styles from "./HeroSection.module.css";

interface HeroNokkeltall {
  etikett: string;
  verdi?: string;
  datareferanse?: string;
}

interface HeroSectionProps {
  aar: number;
  tittel: string;
  undertittel?: string;
  nokkeltall: HeroNokkeltall[];
  budsjettdata?: BudgetYear | null;
}

export default function HeroSection({
  aar,
  tittel,
  undertittel,
  nokkeltall,
  budsjettdata,
}: HeroSectionProps) {
  return (
    <section className={styles.hero} id="hero">
      {undertittel && <p className={styles.undertittel}>{undertittel}</p>}
      <h1 className={styles.tittel}>{tittel}</h1>

      <div className={styles.nokkeltall} role="list" aria-label="Nøkkeltall fra statsbudsjettet">
        {nokkeltall.map((tall) => {
          let numeriskVerdi: number | null = null;

          if (tall.datareferanse && budsjettdata) {
            numeriskVerdi = opplosDatareferanse(tall.datareferanse, budsjettdata);
          }

          return (
            <div key={tall.etikett} className={styles.nokkeltallItem} role="listitem">
              <div className={styles.nokkeltallVerdi}>
                {numeriskVerdi !== null ? (
                  tall.datareferanse?.includes("prosent") ? (
                    `${numeriskVerdi.toFixed(1).replace(".", ",")} %`
                  ) : (
                    <CountUp
                      sluttverdi={numeriskVerdi}
                      formaterer={formaterBelop}
                    />
                  )
                ) : (
                  tall.verdi ?? "—"
                )}
              </div>
              <div className={styles.nokkeltallEtikett}>{tall.etikett}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
