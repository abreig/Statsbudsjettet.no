"use client";

import type { BudgetYear } from "@/components/data/types/budget";
import { opplosDatareferanse } from "@/lib/datareferanse";
import { formaterBelop } from "@/components/shared/NumberFormat";
import styles from "./Nokkeltall.module.css";

interface NokkeltallTall {
  etikett: string;
  verdi?: string;
  datareferanse?: string;
  enhet?: string;
}

interface NokkeltallProps {
  konfigurasjon: Record<string, unknown>;
  budsjettdata?: BudgetYear | null;
}

export default function Nokkeltall({ konfigurasjon, budsjettdata }: NokkeltallProps) {
  const tittel = (konfigurasjon.tittel as string) ?? "Nøkkeltall";
  const layout = (konfigurasjon.layout as string) ?? "horisontal";
  const talliste = (konfigurasjon.tall as NokkeltallTall[]) ?? hentStandardNokkeltall();

  const layoutKlasse =
    layout === "vertikal"
      ? styles.layoutVertikal
      : layout === "rutenett"
        ? styles.layoutRutenett
        : styles.layoutHorisontal;

  return (
    <section className={styles.seksjon} id="nokkeltall">
      <h2 className={styles.tittel}>{tittel}</h2>
      <div className={layoutKlasse}>
        {talliste.map((tall) => {
          let visningsverdi = tall.verdi;

          if (!visningsverdi && tall.datareferanse && budsjettdata) {
            const verdi = opplosDatareferanse(tall.datareferanse, budsjettdata);
            if (verdi !== null) {
              visningsverdi = tall.datareferanse.includes("prosent")
                ? `${verdi.toFixed(1).replace(".", ",")} %`
                : formaterBelop(verdi);
            }
          }

          return (
            <div key={tall.etikett} className={styles.kort}>
              <div className={styles.verdi}>
                {visningsverdi ?? "—"}
              </div>
              <div className={styles.etikett}>{tall.etikett}</div>
              {tall.enhet && (
                <div className={styles.enhet}>{tall.enhet}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Standard nøkkeltall dersom CMS ikke angir egne */
function hentStandardNokkeltall(): NokkeltallTall[] {
  return [
    { etikett: "Utgifter uten olje og gass", datareferanse: "oljekorrigert.utgifter_total" },
    { etikett: "Inntekter uten olje og gass", datareferanse: "oljekorrigert.inntekter_total" },
    { etikett: "Oljekorrigert underskudd", datareferanse: "spu.fondsuttak" },
    { etikett: "Netto kontantstrøm petroleum", datareferanse: "spu.netto_kontantstrom" },
    { etikett: "Netto overføring til SPU", datareferanse: "spu.netto_overfoering_til_spu" },
  ];
}
