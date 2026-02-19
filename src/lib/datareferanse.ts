/**
 * Datareferansemekanisme.
 * Oppløser strengreferanser som «utgifter.total» eller
 * «utgifter.omraader[omr_nr=4].total» til konkrete verdier
 * i budsjettdata-treet.
 */

import type { BudgetYear } from "@/components/data/types/budget";

/**
 * Oppløser en datareferanse mot budsjettdata.
 *
 * Eksempler:
 *   "utgifter.total"                                    → 2970900000000
 *   "utgifter.omraader[omr_nr=4].total"                 → totalbeløp for Forsvar
 *   "spu.overfoering_fra_fond"                           → 413600000000
 *   "endringer.utgifter.omraader[omr_nr=10].endring_prosent" → prosentvis endring
 */
export function opplosDatareferanse(
  referanse: string,
  data: BudgetYear
): number | null {
  try {
    const deler = parserReferanse(referanse);
    let gjeldende: unknown = data;

    for (const del of deler) {
      if (gjeldende === null || gjeldende === undefined) return null;

      if (del.type === "felt") {
        gjeldende = (gjeldende as Record<string, unknown>)[del.navn];
      } else if (del.type === "filter") {
        // Traverser array med filter, f.eks. omraader[omr_nr=4]
        if (!Array.isArray(gjeldende)) return null;
        gjeldende = gjeldende.find(
          (item) => (item as Record<string, unknown>)[del.felt] === del.verdi
        );
      }
    }

    if (typeof gjeldende === "number") return gjeldende;
    return null;
  } catch {
    return null;
  }
}

interface FeltDel {
  type: "felt";
  navn: string;
}

interface FilterDel {
  type: "filter";
  felt: string;
  verdi: number | string;
}

type ReferanseDel = FeltDel | FilterDel;

/**
 * Parser en referansestreng til en liste med navigasjonssteg.
 * "utgifter.omraader[omr_nr=4].total" →
 *   [{ type: "felt", navn: "utgifter" },
 *    { type: "felt", navn: "omraader" },
 *    { type: "filter", felt: "omr_nr", verdi: 4 },
 *    { type: "felt", navn: "total" }]
 */
function parserReferanse(referanse: string): ReferanseDel[] {
  const resultat: ReferanseDel[] = [];
  const moenster = /(\w+)(?:\[(\w+)=(\w+)\])?/g;
  let match: RegExpExecArray | null;

  while ((match = moenster.exec(referanse)) !== null) {
    resultat.push({ type: "felt", navn: match[1] });

    if (match[2] && match[3]) {
      const verdi = isNaN(Number(match[3]))
        ? match[3]
        : Number(match[3]);
      resultat.push({ type: "filter", felt: match[2], verdi });
    }
  }

  return resultat;
}

/**
 * Formaterer en oppløst datareferanse til visning.
 */
export function formaterDatareferanse(
  referanse: string,
  data: BudgetYear
): string | null {
  const verdi = opplosDatareferanse(referanse, data);
  if (verdi === null) return null;

  if (Math.abs(verdi) >= 1_000_000_000) {
    return `${(verdi / 1_000_000_000).toFixed(1).replace(".", ",")} mrd. kr`;
  }
  if (Math.abs(verdi) >= 1_000_000) {
    return `${(verdi / 1_000_000).toFixed(1).replace(".", ",")} mill. kr`;
  }
  return `${verdi.toLocaleString("nb-NO")} kr`;
}
