"use client";

import { useMemo } from "react";
import { formaterBelop } from "@/components/shared/NumberFormat";
import styles from "./HeroWaterfall.module.css";

interface WaterfallDriver {
  navn: string;
  endring_absolut: number;
}

interface HeroWaterfallProps {
  saldert_total: number;
  gb_total: number;
  drivere: WaterfallDriver[];
  side: "utgift" | "inntekt";
  saldert_aar: number;
  gb_aar: number;
}

function formaterMrd(belop: number): string {
  const mrd = belop / 1e9;
  return mrd.toLocaleString("nb-NO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function HeroWaterfall({
  saldert_total,
  gb_total,
  drivere,
  side,
  saldert_aar,
  gb_aar,
}: HeroWaterfallProps) {
  // Sorter drivere etter absolutt endring (størst først)
  const sorterteDrivere = useMemo(
    () => [...drivere].sort((a, b) => Math.abs(b.endring_absolut) - Math.abs(a.endring_absolut)),
    [drivere]
  );

  // Beregn «andre» som differansen mellom totalen og de navngitte driverne
  const driverSum = sorterteDrivere.reduce((s, d) => s + d.endring_absolut, 0);
  const totalEndring = gb_total - saldert_total;
  const andreEndring = totalEndring - driverSum;

  // Sett opp alle steg for waterfallet
  const steg = useMemo(() => {
    const alle = [
      ...sorterteDrivere.map((d) => ({
        navn: d.navn,
        endring: d.endring_absolut,
      })),
      ...(Math.abs(andreEndring) > 0.5e9
        ? [{ navn: "Andre", endring: andreEndring }]
        : []),
    ];
    return alle;
  }, [sorterteDrivere, andreEndring]);

  // Finn maks absolutt verdi for skalering
  const maxEndring = Math.max(...steg.map((s) => Math.abs(s.endring)));
  if (maxEndring === 0) return null;

  const BAR_MAX_W = 120;

  return (
    <div
      className={styles.waterfall}
      role="img"
      aria-label={`Waterfall-diagram: endring ${side === "utgift" ? "utgifter" : "inntekter"} fra ${formaterBelop(saldert_total)} (saldert ${saldert_aar}) til ${formaterBelop(gb_total)} (forslag ${gb_aar})`}
    >
      {/* Startverdi */}
      <div className={styles.totallinje}>
        <span className={styles.totallabel}>
          Saldert {saldert_aar}
        </span>
        <span className={styles.totalverdi}>{formaterMrd(saldert_total)} mrd.</span>
      </div>

      {/* Endringssøyler */}
      <div className={styles.drivere}>
        {steg.map((s, i) => {
          const erPositiv = s.endring >= 0;
          const bredde = Math.max(8, (Math.abs(s.endring) / maxEndring) * BAR_MAX_W);
          return (
            <div key={i} className={styles.driver}>
              <span className={styles.driverNavn}>{s.navn}</span>
              <div className={styles.driverBarContainer}>
                {erPositiv ? (
                  <div
                    className={styles.driverBarPositiv}
                    style={{ width: `${bredde}px` }}
                    aria-hidden="true"
                  />
                ) : (
                  <div
                    className={styles.driverBarNegativ}
                    style={{ width: `${bredde}px` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className={styles.driverVerdi}>
                {erPositiv ? "+" : ""}
                {formaterMrd(s.endring)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sluttverdi */}
      <div className={styles.totallinje}>
        <span className={styles.totallabel}>
          Forslag {gb_aar}
        </span>
        <span className={styles.totalverdi}>{formaterMrd(gb_total)} mrd.</span>
      </div>
    </div>
  );
}
