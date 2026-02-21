"use client";

import { useState, useEffect } from "react";
import type { Programomraade } from "@/components/data/types/budget";

interface UseMultiAreaDrillDownResult {
  data: Programomraade[] | null;
  laster: boolean;
  feil: string | null;
}

/**
 * Laster flere programområder på én gang.
 * Brukes for "Øvrige"-kategorier som spenner over mange områder.
 */
export function useMultiAreaDrillDown(
  aar: number,
  omrNrs: number[] | null,
  side: "utgift" | "inntekt"
): UseMultiAreaDrillDownResult {
  const [data, setData] = useState<Programomraade[] | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  // Stabil nøkkel for omrNrs-arrayet
  const omrNrsKey = omrNrs ? omrNrs.join(",") : "";

  useEffect(() => {
    if (!omrNrs || omrNrs.length === 0) {
      setData(null);
      return;
    }

    setLaster(true);
    setFeil(null);

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/${aar}/gul_bok_full.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Kunne ikke laste data for ${aar}`);
        return res.json();
      })
      .then((json) => {
        const sideData = side === "utgift" ? json.utgifter : json.inntekter;
        const omraader = sideData.omraader
          .filter((o: Programomraade) => omrNrs.includes(o.omr_nr))
          .sort((a: Programomraade, b: Programomraade) => b.total - a.total);
        setData(omraader);
        setLaster(false);
      })
      .catch((err) => {
        setFeil(err.message);
        setLaster(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aar, omrNrsKey, side]);

  return { data, laster, feil };
}
