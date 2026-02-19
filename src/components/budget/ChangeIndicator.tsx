import type { ChangeIndicatorProps } from "@/components/data/types/budget";
import { formaterBelop } from "@/components/shared/NumberFormat";

export default function ChangeIndicator({
  endring_absolut,
  endring_prosent,
  compact = false,
}: ChangeIndicatorProps) {
  const erOkning = endring_prosent > 0;
  const erNedgang = endring_prosent < 0;
  const farge = erOkning
    ? "var(--farge-okning)"
    : erNedgang
      ? "var(--farge-nedgang)"
      : "var(--tekst-sekundaer)";

  const pilSymbol = erOkning ? "↑" : erNedgang ? "↓" : "→";
  const prosentTekst = `${erOkning ? "+" : ""}${endring_prosent.toFixed(1)} %`;

  const ariaLabel = erOkning
    ? `Økning på ${formaterBelop(Math.abs(endring_absolut))}, tilsvarende ${endring_prosent.toFixed(1)} prosent fra saldert budsjett`
    : erNedgang
      ? `Nedgang på ${formaterBelop(Math.abs(endring_absolut))}, tilsvarende ${Math.abs(endring_prosent).toFixed(1)} prosent fra saldert budsjett`
      : "Ingen endring fra saldert budsjett";

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
      {!compact && (
        <span style={{ color: "var(--tekst-deaktivert)", fontSize: "var(--tekst-xs)" }}>
          ({formaterBelop(endring_absolut, 1, true, true)})
        </span>
      )}
    </span>
  );
}
