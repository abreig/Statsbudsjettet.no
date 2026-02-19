"use client";

import { useState, useEffect, useRef } from "react";

interface CountUpProps {
  sluttverdi: number;
  varighet?: number;
  formaterer: (verdi: number) => string;
}

/**
 * CountUp-animasjon for tallverdier.
 * Animerer fra 0 til sluttverdi ved første visning.
 * Respekterer prefers-reduced-motion (viser sluttverdi direkte).
 */
export default function CountUp({
  sluttverdi,
  varighet = 1200,
  formaterer,
}: CountUpProps) {
  const [visningsverdi, setVisningsverdi] = useState(0);
  const [erFerdig, setErFerdig] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Respekter prefers-reduced-motion
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisningsverdi(sluttverdi);
      setErFerdig(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !erFerdig) {
          animerVerdi();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sluttverdi]);

  function animerVerdi() {
    const startTid = performance.now();

    function oppdater(naaTid: number) {
      const framdrift = Math.min((naaTid - startTid) / varighet, 1);
      // Ease-out cubic for naturlig avbremsing
      const easet = 1 - Math.pow(1 - framdrift, 3);
      const gjeldende = easet * sluttverdi;

      setVisningsverdi(gjeldende);

      if (framdrift < 1) {
        requestAnimationFrame(oppdater);
      } else {
        setVisningsverdi(sluttverdi);
        setErFerdig(true);
      }
    }

    requestAnimationFrame(oppdater);
  }

  return <span ref={elementRef}>{formaterer(visningsverdi)}</span>;
}
