"use client";

import { useState } from "react";
import StackedBarChart from "./StackedBarChart";
import DrillDownPanel from "./DrillDownPanel";
import type { AggregertBudsjett, HierarkiNode } from "@/components/data/types/budget";
import { useDrillDown } from "@/components/data/hooks/useDrillDown";

interface BudsjettSeksjonProps {
  data: AggregertBudsjett;
  aar: number;
  overskrift?: string;
  forklaringstekst?: string;
}

export default function BudsjettSeksjon({ data, aar, overskrift, forklaringstekst }: BudsjettSeksjonProps) {
  const [visEndring, setVisEndring] = useState(false);
  const [drillDown, setDrillDown] = useState<{
    side: "utgift" | "inntekt";
    id: string;
  } | null>(null);

  // Finn omr_nr basert på segment-id
  const finnOmrNr = (side: "utgift" | "inntekt", id: string): number | null => {
    const kategorier =
      side === "utgift" ? data.utgifter_aggregert : data.inntekter_aggregert;
    const kat = kategorier.find((k) => k.id === id);
    return kat?.omr_nr ?? null;
  };

  const omrNr = drillDown ? finnOmrNr(drillDown.side, drillDown.id) : null;
  const drillDownData = useDrillDown(aar, omrNr, drillDown?.side ?? "utgift");

  const handleSegmentClick = (side: "utgift" | "inntekt", id: string) => {
    setDrillDown({ side, id });
  };

  const handleClose = () => {
    setDrillDown(null);
  };

  return (
    <section id="budsjett" style={{ padding: "var(--space-8) 0" }}>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--tekst-3xl)",
          color: "var(--reg-marine)",
          marginBottom: "var(--space-3)",
          textAlign: "center",
        }}
      >
        {overskrift ?? "Budsjettet i tall"}
      </h2>

      {forklaringstekst && (
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--tekst-base)",
            color: "var(--tekst-sekundaer)",
            textAlign: "center",
            maxWidth: "40rem",
            margin: "0 auto var(--space-5)",
            lineHeight: "var(--linjehoyde-normal)",
          }}
        >
          {forklaringstekst}
        </p>
      )}

      <StackedBarChart
        utgifter={data.utgifter_aggregert}
        inntekter={data.inntekter_aggregert}
        spu={data.spu}
        visEndring={visEndring}
        onSegmentClick={handleSegmentClick}
        aar={aar}
      />

      {drillDown && drillDownData.data && (
        <DrillDownPanel
          data={drillDownData.data}
          hierarkiSti={[
            {
              nivaa: 1,
              id: 0,
              navn: drillDown.side === "utgift" ? "Utgifter" : "Inntekter",
            },
            {
              nivaa: 2,
              id: drillDownData.data.omr_nr,
              navn: drillDownData.data.navn,
            },
          ]}
          onNavigate={() => {}}
          onClose={handleClose}
          visEndring={visEndring}
        />
      )}
    </section>
  );
}
