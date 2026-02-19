import type { NumberFormatProps } from "@/components/data/types/budget";

/**
 * Formaterer tall etter norsk standard:
 * - Over 1 mrd: «2 970,9 mrd. kr»
 * - 1 mill – 1 mrd: «413,6 mill. kr»
 * - Under 1 mill: «850 000 kr»
 */
export function formaterBelop(
  belop: number,
  precision: number = 1,
  visValuta: boolean = true,
  somEndring: boolean = false
): string {
  const abs = Math.abs(belop);
  const fortegn = somEndring && belop > 0 ? "+" : belop < 0 ? "−" : "";
  let tall: string;
  let enhet: string;

  if (abs >= 1_000_000_000) {
    tall = (abs / 1_000_000_000).toFixed(precision).replace(".", ",");
    enhet = "mrd.";
  } else if (abs >= 1_000_000) {
    tall = (abs / 1_000_000).toFixed(precision).replace(".", ",");
    enhet = "mill.";
  } else {
    tall = Math.round(abs)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
    enhet = "";
  }

  const valutaSuffix = visValuta ? " kr" : "";
  const enhetStr = enhet ? ` ${enhet}` : "";

  return `${fortegn}${tall}${enhetStr}${valutaSuffix}`.trim();
}

export default function NumberFormat({
  belop,
  precision = 1,
  visValuta = true,
  somEndring = false,
}: NumberFormatProps) {
  const abs = Math.abs(belop);
  const tekst = formaterBelop(belop, precision, visValuta, somEndring);

  if (abs >= 1_000_000_000) {
    return (
      <span>
        {somEndring && belop > 0 ? "+" : belop < 0 ? "−" : ""}
        {(abs / 1_000_000_000).toFixed(precision).replace(".", ",")}{" "}
        <abbr title="milliarder">mrd.</abbr>
        {visValuta ? " kr" : ""}
      </span>
    );
  }

  if (abs >= 1_000_000) {
    return (
      <span>
        {somEndring && belop > 0 ? "+" : belop < 0 ? "−" : ""}
        {(abs / 1_000_000).toFixed(precision).replace(".", ",")}{" "}
        <abbr title="millioner">mill.</abbr>
        {visValuta ? " kr" : ""}
      </span>
    );
  }

  return <span>{tekst}</span>;
}
