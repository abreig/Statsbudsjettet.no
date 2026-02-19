"use client";

import type { ModulKonfigurasjon, AggregertBudsjett, BudgetYear } from "@/components/data/types/budget";
import type { CMSTema } from "@/lib/mock-cms";
import HeroSection from "@/components/hero/HeroSection";
import PlanSection from "@/components/plan/PlanSection";
import BudsjettSeksjon from "@/components/budget/BudsjettSeksjon";
import Nokkeltall from "@/components/shared/Nokkeltall";
import EgendefinertTekst from "@/components/shared/EgendefinertTekst";

interface ModulRendrerProps {
  moduler: ModulKonfigurasjon[];
  aar: number;
  aggregertData: AggregertBudsjett | null;
  fullData: BudgetYear | null;
  temaer: CMSTema[];
}

/**
 * ModulRendrer — kjernekomponent for modulbasert komposisjon.
 * Filtrerer på synlighet, sorterer etter rekkefølge, og mapper
 * modultype til React-komponent.
 */
export default function ModulRendrer({
  moduler,
  aar,
  aggregertData,
  fullData,
  temaer,
}: ModulRendrerProps) {
  const synligeModuler = moduler
    .filter((m) => m.synlig)
    .sort((a, b) => a.rekkefolge - b.rekkefolge);

  return (
    <>
      {synligeModuler.map((modul, indeks) => (
        <ModulKomponent
          key={`${modul.type}-${indeks}`}
          modul={modul}
          aar={aar}
          aggregertData={aggregertData}
          fullData={fullData}
          temaer={temaer}
        />
      ))}
    </>
  );
}

function ModulKomponent({
  modul,
  aar,
  aggregertData,
  fullData,
  temaer,
}: {
  modul: ModulKonfigurasjon;
  aar: number;
  aggregertData: AggregertBudsjett | null;
  fullData: BudgetYear | null;
  temaer: CMSTema[];
}) {
  const konf = modul.konfigurasjon;

  switch (modul.type) {
    case "hero": {
      const nokkeltall = (konf.nokkeltall as { etikett: string; datareferanse?: string; verdi?: string }[]) ?? [];
      return (
        <HeroSection
          aar={aar}
          tittel={(konf.tittel as string) ?? `Statsbudsjettet ${aar}`}
          undertittel={konf.undertittel as string | undefined}
          nokkeltall={nokkeltall}
          budsjettdata={fullData}
        />
      );
    }

    case "plan_for_norge":
      return (
        <PlanSection
          temaer={temaer}
          budsjettdata={fullData}
        />
      );

    case "budsjettgrafer": {
      if (!aggregertData) return null;
      return (
        <BudsjettSeksjon
          data={aggregertData}
          aar={aar}
          overskrift={konf.overskrift as string | undefined}
          forklaringstekst={konf.forklaringstekst as string | undefined}
        />
      );
    }

    case "nokkeltall":
      return (
        <Nokkeltall
          konfigurasjon={konf}
          budsjettdata={fullData}
        />
      );

    case "egendefinert_tekst":
      return (
        <EgendefinertTekst konfigurasjon={konf} />
      );

    default:
      return null;
  }
}
