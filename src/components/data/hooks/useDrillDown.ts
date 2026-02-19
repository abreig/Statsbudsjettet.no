"use client";

import { useState, useEffect } from "react";
import type { Programomraade } from "@/components/data/types/budget";

interface UseDrillDownResult {
  data: Programomraade | null;
  laster: boolean;
  feil: string | null;
}

export function useDrillDown(
  aar: number,
  omrNr: number | null,
  side: "utgift" | "inntekt"
): UseDrillDownResult {
  const [data, setData] = useState<Programomraade | null>(null);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  useEffect(() => {
    if (omrNr === null) {
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
        const omraade = sideData.omraader.find(
          (o: Programomraade) => o.omr_nr === omrNr
        );
        setData(omraade ?? null);
        setLaster(false);
      })
      .catch((err) => {
        setFeil(err.message);
        setLaster(false);
      });
  }, [aar, omrNr, side]);

  return { data, laster, feil };
}
