"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  children: React.ReactNode;
  innhold: React.ReactNode;
}

export default function Tooltip({ children, innhold }: TooltipProps) {
  const [synlig, setSynlig] = useState(false);
  const [posisjon, setPosisjon] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (synlig && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosisjon({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [synlig]);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setSynlig(true)}
      onMouseLeave={() => setSynlig(false)}
      onFocus={() => setSynlig(true)}
      onBlur={() => setSynlig(false)}
      style={{ position: "relative", display: "inline-block" }}
    >
      {children}
      {synlig && (
        <span
          role="tooltip"
          style={{
            position: "fixed",
            top: posisjon.top,
            left: posisjon.left,
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--reg-marine)",
            color: "var(--tekst-invers)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--tekst-sm)",
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
            zIndex: "var(--z-tooltip)",
            pointerEvents: "none",
            boxShadow: "var(--skygge-md)",
          }}
        >
          {innhold}
        </span>
      )}
    </span>
  );
}
