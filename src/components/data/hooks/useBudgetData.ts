"use client";

import { useState, useEffect } from "react";
import type { BudgetYear } from "@/components/data/types/budget";

interface UseBudgetDataResult {
  data: BudgetYear | null;
  laster: boolean;
  feil: string | null;
}

export function useBudgetData(aar: number): UseBudgetDataResult {
  const [data, setData] = useState<BudgetYear | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);

  useEffect(() => {
    setLaster(true);
    setFeil(null);

    fetch(`/data/${aar}/gul_bok_full.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Kunne ikke laste data for ${aar}`);
        return res.json();
      })
      .then((json) => {
        setData(json as BudgetYear);
        setLaster(false);
      })
      .catch((err) => {
        setFeil(err.message);
        setLaster(false);
      });
  }, [aar]);

  return { data, laster, feil };
}
