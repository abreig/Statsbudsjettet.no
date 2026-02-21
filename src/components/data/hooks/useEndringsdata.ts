"use client";

import { useState, useEffect } from "react";
import type { EndringsMetadata } from "@/components/data/types/budget";

interface UseEndringsdataResult {
  data: EndringsMetadata | null;
  laster: boolean;
  feil: string | null;
}

export function useEndringsdata(aar: number): UseEndringsdataResult {
  const [data, setData] = useState<EndringsMetadata | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);

  useEffect(() => {
    setLaster(true);
    setFeil(null);

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/${aar}/gul_bok_endringer.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Kunne ikke laste endringsdata for ${aar}`);
        return res.json();
      })
      .then((json) => {
        setData(json as EndringsMetadata);
        setLaster(false);
      })
      .catch((err) => {
        setFeil(err.message);
        setLaster(false);
      });
  }, [aar]);

  return { data, laster, feil };
}
