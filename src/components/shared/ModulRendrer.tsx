"use client";

import { useRef, useCallback } from "react";
import type { ModulKonfigurasjon, AggregertBudsjett, BudgetYear, EndringsMetadata } from "@/components/data/types/budget";
import type { CMSTema } from "@/lib/mock-cms";
import HeroSection from "@/components/hero/HeroSection";
import HeroWaterfall from "@/components/hero/HeroWaterfall";
import PlanSection from "@/components/plan/PlanSection";
import BudsjettSeksjon from "@/components/budget/BudsjettSeksjon";
import type { BudsjettSeksjonHandle } from "@/components/budget/BudsjettSeksjon";
import Nokkeltall from "@/components/shared/Nokkeltall";
import EgendefinertTekst from "@/components/shared/EgendefinertTekst";
import NasjonalbudsjettetModul from "@/components/nasjonalbudsjettet/NasjonalbudsjettetModul";
import { hentNasjonalbudsjettetData } from "@/components/nasjonalbudsjettet/mock-nasjonalbudsjettet";

interface ModulRendrerProps {
  moduler: ModulKonfigurasjon[];
  aar: number;
  aggregertData: AggregertBudsjett | null;
  fullData: BudgetYear | null;
  temaer: CMSTema[];
  endringsdata?: EndringsMetadata | null;
}

/**
 * ModulRendrer — kjernekomponent for modulbasert komposisjon.
 * Filtrerer på synlighet, sorterer etter rekkefølge, og mapper
 * modultype til React-komponent.
 *
 * Kobler PlanSection → BudsjettSeksjon via ref for budsjettnavigasjon.
 */
export default function ModulRendrer({
  moduler,
  aar,
  aggregertData,
  fullData,
  temaer,
  endringsdata,
}: ModulRendrerProps) {
  const budsjettRef = useRef<BudsjettSeksjonHandle>(null);

  const handleBudsjettNavigasjon = useCallback((omrNr: number) => {
    budsjettRef.current?.openDrillDown("utgift", omrNr);
  }, []);

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
          endringsdata={endringsdata}
          budsjettRef={budsjettRef}
          onBudsjettNavigasjon={handleBudsjettNavigasjon}
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
  endringsdata,
  budsjettRef,
  onBudsjettNavigasjon,
}: {
  modul: ModulKonfigurasjon;
  aar: number;
  aggregertData: AggregertBudsjett | null;
  fullData: BudgetYear | null;
  temaer: CMSTema[];
  endringsdata?: EndringsMetadata | null;
  budsjettRef: React.RefObject<BudsjettSeksjonHandle | null>;
  onBudsjettNavigasjon: (omrNr: number) => void;
}) {
  const konf = modul.konfigurasjon;

  switch (modul.type) {
    case "hero": {
      const nokkeltall = (konf.nokkeltall as { etikett: string; datareferanse?: string; verdi?: string }[]) ?? [];

      // Bygg waterfall-drivere fra fullData (de 4 programområdene med størst kronemessig endring)
      const harEndring = endringsdata?.har_endringsdata && fullData?.utgifter.endring_fra_saldert;
      const waterfallDrivere = harEndring
        ? [...fullData.utgifter.omraader]
            .filter((omr) => omr.endring_fra_saldert?.endring_absolut != null)
            .sort((a, b) =>
              Math.abs(b.endring_fra_saldert!.endring_absolut!) -
              Math.abs(a.endring_fra_saldert!.endring_absolut!)
            )
            .slice(0, 4)
            .map((omr) => ({
              navn: omr.navn,
              endring_absolut: omr.endring_fra_saldert!.endring_absolut!,
            }))
        : null;

      return (
        <>
          <HeroSection
            aar={aar}
            tittel={(konf.tittel as string) ?? `Statsbudsjettet ${aar}`}
            undertittel={konf.undertittel as string | undefined}
            nokkeltall={nokkeltall}
            budsjettdata={fullData}
          />
          {harEndring && waterfallDrivere && waterfallDrivere.length > 0 && (
            <HeroWaterfall
              saldert_total={fullData.utgifter.endring_fra_saldert!.saldert_forrige}
              gb_total={fullData.utgifter.total}
              drivere={waterfallDrivere}
              side="utgift"
              saldert_aar={endringsdata!.saldert_aar!}
              gb_aar={aar}
            />
          )}
        </>
      );
    }

    case "plan_for_norge":
      return (
        <PlanSection
          temaer={temaer}
          budsjettdata={fullData}
          onBudsjettNavigasjon={onBudsjettNavigasjon}
        />
      );

    case "nasjonalbudsjettet": {
      const nasjonalbudsjettetData = hentNasjonalbudsjettetData(aar);
      if (!nasjonalbudsjettetData) return null;
      return <NasjonalbudsjettetModul konfigurasjon={nasjonalbudsjettetData} aar={aar} />;
    }

    case "budsjettgrafer": {
      if (!aggregertData) return null;
      return (
        <BudsjettSeksjon
          ref={budsjettRef}
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
