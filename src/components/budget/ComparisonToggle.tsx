"use client";

import type { ComparisonToggleProps } from "@/components/data/types/budget";

export default function ComparisonToggle({ aktiv, onToggle }: ComparisonToggleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--tekst-sm)",
      }}
    >
      <label
        htmlFor="endring-toggle"
        style={{ color: "var(--tekst-sekundaer)" }}
      >
        Vis endring fra saldert budsjett
      </label>
      <button
        id="endring-toggle"
        role="switch"
        aria-checked={aktiv}
        onClick={() => onToggle(!aktiv)}
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "var(--radius-full)",
          border: "none",
          backgroundColor: aktiv ? "var(--reg-blaa)" : "var(--reg-lysgraa)",
          position: "relative",
          cursor: "pointer",
          transition: "background-color var(--varighet-rask) var(--easing-standard)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: aktiv ? "22px" : "2px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-hvit)",
            boxShadow: "var(--skygge-sm)",
            transition: "left var(--varighet-rask) var(--easing-standard)",
          }}
        />
      </button>
    </div>
  );
}
