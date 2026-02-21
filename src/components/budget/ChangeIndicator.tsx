import type { ChangeIndicatorProps } from "@/components/data/types/budget";
import { formaterBelop } from "@/components/shared/NumberFormat";

export default function ChangeIndicator({
  endring_absolut,
  endring_prosent,
  er_ny_post = false,
  side = "utgift",
  compact = false,
}: ChangeIndicatorProps) {
  // Ny post — vis etikett uten pil
  if (er_ny_post) {
    return (
      <span
        aria-label="Ny budsjettpost"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-1)",
          fontFamily: "var(--font-tall)",
          fontSize: compact ? "var(--tekst-xs)" : "var(--tekst-sm)",
          fontWeight: "var(--vekt-semibold)",
        }}
      >
        <span
          style={{
            backgroundColor: "var(--reg-gul)",
            color: "var(--reg-marine)",
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--tekst-xs)",
            fontWeight: "var(--vekt-semibold)",
            letterSpacing: "0.03em",
          }}
        >
          NY
        </span>
      </span>
    );
  }

  // Hvis ingen data tilgjengelig
  if (endring_prosent === null || endring_prosent === undefined) {
    return null;
  }

  const erOkning = endring_prosent > 0;
  const erNedgang = endring_prosent < 0;

  // Fargesemantikk: nøytralt blå/grå i stedet for rød/grønn
  // for å unngå politisk konnotasjon (jf. ENDRINGSVISNING.md §9)
  const farge = erOkning
    ? "var(--farge-okning)"
    : erNedgang
      ? "var(--farge-nedgang)"
      : "var(--tekst-sekundaer)";

  const pilSymbol = erOkning ? "↑" : erNedgang ? "↓" : "→";
  const prosentTekst = `${erOkning ? "+" : ""}${endring_prosent.toFixed(1)} %`;

  // Kontekstbevisst aria-tekst basert på side
  const retningsTekst = side === "inntekt"
    ? (erOkning ? "Økning i inntekter" : erNedgang ? "Nedgang i inntekter" : "Ingen endring i inntekter")
    : (erOkning ? "Økning" : erNedgang ? "Nedgang" : "Ingen endring");

  const ariaLabel =
    endring_absolut !== null && endring_absolut !== undefined
      ? `${retningsTekst} på ${formaterBelop(Math.abs(endring_absolut))}, tilsvarende ${Math.abs(endring_prosent).toFixed(1)} prosent fra saldert budsjett`
      : `${retningsTekst} på ${Math.abs(endring_prosent).toFixed(1)} prosent fra saldert budsjett`;

  return (
    <span
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        color: farge,
        fontFamily: "var(--font-tall)",
        fontSize: compact ? "var(--tekst-xs)" : "var(--tekst-sm)",
        fontWeight: "var(--vekt-medium)",
      }}
    >
      <span aria-hidden="true">{pilSymbol}</span>
      <span>{prosentTekst}</span>
      {!compact && endring_absolut !== null && endring_absolut !== undefined && (
        <span style={{ color: "var(--tekst-deaktivert)", fontSize: "var(--tekst-xs)" }}>
          ({formaterBelop(endring_absolut, 1, true, true)})
        </span>
      )}
    </span>
  );
}
