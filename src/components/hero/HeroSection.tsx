import { formaterBelop } from "@/components/shared/NumberFormat";
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
      <div className={styles.aarstall}>{aar}</div>
      <h1 className={styles.tittel}>{tittel}</h1>
      {undertittel && <p className={styles.undertittel}>{undertittel}</p>}

      <div className={styles.nokkeltall}>
        {nokkeltall.map((tall) => {
          let visningsverdi = tall.verdi;

          if (!visningsverdi && tall.datareferanse && budsjettdata) {
            const verdi = opplosDatareferanse(tall.datareferanse, budsjettdata);
            if (verdi !== null) {
              visningsverdi = formaterBelop(verdi);
            }
          }

          return (
            <div key={tall.etikett} className={styles.nokkeltallItem}>
              <div className={styles.nokkeltallVerdi}>
                {visningsverdi ?? "—"}
              </div>
              <div className={styles.nokkeltallEtikett}>{tall.etikett}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
