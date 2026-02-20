"use client";

import { useState, forwardRef, useImperativeHandle, useCallback } from "react";
import dynamic from "next/dynamic";
import StackedBarChart from "./StackedBarChart";
import ModalOverlay from "@/components/shared/ModalOverlay";
import { formaterBelop } from "@/components/shared/NumberFormat";
import type { AggregertBudsjett, KontantstromKilde } from "@/components/data/types/budget";
import styles from "./StackedBarChart.module.css";

const DrillDownPanel = dynamic(() => import("./DrillDownPanel"), { ssr: false });
import { useDrillDown } from "@/components/data/hooks/useDrillDown";

interface BudsjettSeksjonProps {
  data: AggregertBudsjett;
  aar: number;
  overskrift?: string;
  forklaringstekst?: string;
}

export interface BudsjettSeksjonHandle {
  openDrillDown: (side: "utgift" | "inntekt", omrNr: number) => void;
}

const BudsjettSeksjon = forwardRef<BudsjettSeksjonHandle, BudsjettSeksjonProps>(
  function BudsjettSeksjon({ data, aar, overskrift, forklaringstekst }, ref) {
    const [drillDown, setDrillDown] = useState<{
      side: "utgift" | "inntekt";
      id: string;
    } | null>(null);

    const [visKontantstrom, setVisKontantstrom] = useState(false);

    // Finn omr_nr basert på segment-id
    const finnOmrNr = useCallback(
      (side: "utgift" | "inntekt", id: string): number | null => {
        const kategorier =
          side === "utgift" ? data.utgifter_aggregert : data.inntekter_aggregert;
        const kat = kategorier.find((k) => k.id === id);
        if (kat?.omr_nr) return kat.omr_nr;
        // For grupperte kategorier (f.eks. folketrygden), bruk første omr_nr
        if (kat?.omr_gruppe && kat.omr_gruppe.length > 0) return kat.omr_gruppe[0];
        return null;
      },
      [data]
    );

    const omrNr = drillDown ? finnOmrNr(drillDown.side, drillDown.id) : null;
    const drillDownData = useDrillDown(aar, omrNr, drillDown?.side ?? "utgift");

    const handleSegmentClick = useCallback(
      (side: "utgift" | "inntekt", id: string) => {
        setDrillDown({ side, id });
      },
      []
    );

    const handleClose = useCallback(() => {
      setDrillDown(null);
    }, []);

    const handleKontantstromClick = useCallback(() => {
      setVisKontantstrom(true);
    }, []);

    // Eksponér openDrillDown for eksterne kall (f.eks. fra PlanSection)
    useImperativeHandle(ref, () => ({
      openDrillDown(side: "utgift" | "inntekt", omrNr: number) {
        // Finn segment-id fra omrNr
        const kategorier =
          side === "utgift" ? data.utgifter_aggregert : data.inntekter_aggregert;
        const kat = kategorier.find(
          (k) => k.omr_nr === omrNr || (k.omr_gruppe && k.omr_gruppe.includes(omrNr))
        );
        if (kat) {
          setDrillDown({ side, id: kat.id });
        }
      },
    }));

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
          visEndring={false}
          onSegmentClick={handleSegmentClick}
          onKontantstromClick={handleKontantstromClick}
          aar={aar}
        />

        {/* Forklaringstekst om fondsmekanismen */}
        <div className={styles.forklaring}>
          <strong>Slik fungerer fondsmekanismen:</strong> Statens inntekter fra
          petroleumsvirksomheten overføres i sin helhet til Statens pensjonsfond
          utland (SPU). For å dekke det oljekorrigerte underskuddet på
          statsbudsjettet — {formaterBelop(data.spu.fondsuttak)} — overføres et
          beløp tilbake fra fondet. Uttaket styres av handlingsregelen, som
          tilsier at man over tid ikke skal bruke mer enn den forventede
          realavkastningen av fondet (anslått til 3 %).
        </div>

        {/* Drill-down modal */}
        <ModalOverlay
          open={drillDown !== null && drillDownData.data !== null}
          onClose={handleClose}
          ariaLabel={drillDownData.data?.navn ?? "Drill-down"}
        >
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
              visEndring={false}
            />
          )}
        </ModalOverlay>

        {/* Kontantstrøm-modal */}
        <ModalOverlay
          open={visKontantstrom}
          onClose={() => setVisKontantstrom(false)}
          ariaLabel="Petroleumsinntekter — kontantstrøm"
        >
          <KontantstromInnhold
            kilder={data.spu.kontantstrom_kilder}
            total={data.spu.netto_kontantstrom}
            onClose={() => setVisKontantstrom(false)}
          />
        </ModalOverlay>
      </section>
    );
  }
);

export default BudsjettSeksjon;

/* ---------------------------------------------------------------
   Kontantstrøm-innhold (vist i ModalOverlay)
   --------------------------------------------------------------- */

function KontantstromInnhold({
  kilder,
  total,
  onClose,
}: {
  kilder: KontantstromKilde[];
  total: number;
  onClose: () => void;
}) {
  const sortert = [...kilder].sort((a, b) => b.belop - a.belop);
  const SPU_BLA = "#2C4F8A";

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-4)",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "var(--tekst-2xl)",
              fontWeight: "var(--vekt-bold)",
              color: SPU_BLA,
              marginBottom: "var(--space-1)",
            }}
          >
            Netto kontantstrøm fra petroleum
          </h3>
          <div
            style={{
              fontFamily: "var(--font-tall)",
              fontSize: "var(--tekst-xl)",
              color: "var(--tekst-sekundaer)",
            }}
          >
            {formaterBelop(total)}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Lukk"
          style={{
            background: "none",
            border: "1px solid var(--reg-lysgraa)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-2)",
            cursor: "pointer",
            fontSize: "var(--tekst-lg)",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--tekst-sm)",
          color: "var(--tekst-sekundaer)",
          lineHeight: "var(--linjehoyde-normal)",
          marginBottom: "var(--space-5)",
        }}
      >
        Netto kontantstrøm fra petroleumsvirksomheten overføres i sin helhet til
        Statens pensjonsfond utland (SPU). Beløpet består av skatter, avgifter
        og statens direkte økonomiske engasjement (SDØE/SDFI).
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {sortert.map((kilde) => {
          const andel = total > 0 ? (kilde.belop / total) * 100 : 0;
          return (
            <li
              key={kilde.id}
              style={{
                padding: "var(--space-3)",
                border: "1px solid var(--reg-lysgraa)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-2)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--tekst-sm)",
                    fontWeight: "var(--vekt-medium)",
                    color: "var(--tekst-primaer)",
                  }}
                >
                  {kilde.navn}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-tall)",
                    fontSize: "var(--tekst-sm)",
                    color: "var(--tekst-sekundaer)",
                  }}
                >
                  {formaterBelop(kilde.belop)}
                </span>
              </div>
              {/* Fremgangslinje */}
              <div
                style={{
                  background: "var(--reg-lysgraa)",
                  height: 6,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${andel}%`,
                    height: "100%",
                    background: SPU_BLA,
                    borderRadius: 3,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: "var(--tekst-xs)",
                  color: "var(--tekst-deaktivert)",
                  marginTop: 4,
                  fontFamily: "var(--font-tall)",
                }}
              >
                {andel.toFixed(1)} %
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
