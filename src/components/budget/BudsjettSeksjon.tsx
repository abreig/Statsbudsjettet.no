"use client";

import { useState, forwardRef, useImperativeHandle, useCallback } from "react";
import dynamic from "next/dynamic";
import StackedBarChart from "./StackedBarChart";
import ComparisonToggle from "./ComparisonToggle";
import ModalOverlay from "@/components/shared/ModalOverlay";
import { formaterBelop } from "@/components/shared/NumberFormat";
import type { AggregertBudsjett, KontantstromKilde, Programomraade } from "@/components/data/types/budget";
import { hentAggregertOmtale } from "@/lib/mock-omtaler";
import styles from "./StackedBarChart.module.css";

const DrillDownPanel = dynamic(() => import("./DrillDownPanel"), { ssr: false });
import { useDrillDown } from "@/components/data/hooks/useDrillDown";
import { useMultiAreaDrillDown } from "@/components/data/hooks/useMultiAreaDrillDown";

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
    // Sjekk om endringsdata er tilgjengelig
    const harEndringsdata = data.utgifter_aggregert.some((k) => k.saldert_belop != null);

    const [visEndring, setVisEndring] = useState(harEndringsdata);
    const [drillDown, setDrillDown] = useState<{
      side: "utgift" | "inntekt";
      id: string;
    } | null>(null);

    // Ekstra state for valgt område i multi-area modus
    const [valgtOmrNr, setValgtOmrNr] = useState<number | null>(null);

    const [visKontantstrom, setVisKontantstrom] = useState(false);

    // Finn omr_nr eller omr_gruppe basert på segment-id
    const finnKategori = useCallback(
      (side: "utgift" | "inntekt", id: string) => {
        const kategorier =
          side === "utgift" ? data.utgifter_aggregert : data.inntekter_aggregert;
        return kategorier.find((k) => k.id === id) ?? null;
      },
      [data]
    );

    // Bestem om dette er en multi-area kategori (har omr_gruppe men ikke omr_nr)
    const erMultiArea: boolean = drillDown
      ? (() => {
          const kat = finnKategori(drillDown.side, drillDown.id);
          return !!(kat && !kat.omr_nr && kat.omr_gruppe && kat.omr_gruppe.length > 1);
        })()
      : false;

    // For single-area: finn omr_nr direkte
    const omrNr = drillDown
      ? (() => {
          if (valgtOmrNr !== null) return valgtOmrNr;
          const kat = finnKategori(drillDown.side, drillDown.id);
          if (kat?.omr_nr) return kat.omr_nr;
          if (kat?.omr_gruppe && kat.omr_gruppe.length === 1) return kat.omr_gruppe[0];
          return null;
        })()
      : null;

    // Multi-area data (laster alle områder for "Øvrige" kategorier)
    const multiOmrNrs = drillDown && erMultiArea && valgtOmrNr === null
      ? finnKategori(drillDown.side, drillDown.id)?.omr_gruppe ?? null
      : null;
    const multiAreaData = useMultiAreaDrillDown(aar, multiOmrNrs, drillDown?.side ?? "utgift");

    // Single-area data
    const drillDownData = useDrillDown(aar, omrNr, drillDown?.side ?? "utgift");

    const handleSegmentClick = useCallback(
      (side: "utgift" | "inntekt", id: string) => {
        setValgtOmrNr(null);
        setDrillDown({ side, id });
      },
      []
    );

    const handleClose = useCallback(() => {
      setDrillDown(null);
      setValgtOmrNr(null);
    }, []);

    const handleKontantstromClick = useCallback(() => {
      setVisKontantstrom(true);
    }, []);

    // Eksponér openDrillDown for eksterne kall (f.eks. fra PlanSection)
    useImperativeHandle(ref, () => ({
      openDrillDown(side: "utgift" | "inntekt", omrNr: number) {
        const kategorier =
          side === "utgift" ? data.utgifter_aggregert : data.inntekter_aggregert;
        const kat = kategorier.find(
          (k) => k.omr_nr === omrNr || (k.omr_gruppe && k.omr_gruppe.includes(omrNr))
        );
        if (kat) {
          setValgtOmrNr(null);
          setDrillDown({ side, id: kat.id });
        }
      },
    }));

    // Bestem om modalen skal åpnes
    const singleAreaReady = drillDown !== null && omrNr !== null && drillDownData.data !== null;
    const multiAreaReady = drillDown !== null && erMultiArea && valgtOmrNr === null && multiAreaData.data !== null;
    const modalOpen = singleAreaReady || multiAreaReady;

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

        {harEndringsdata && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
            <ComparisonToggle aktiv={visEndring} onToggle={setVisEndring} />
          </div>
        )}

        <StackedBarChart
          utgifter={data.utgifter_aggregert}
          inntekter={data.inntekter_aggregert}
          spu={data.spu}
          visEndring={visEndring}
          onSegmentClick={handleSegmentClick}
          onKontantstromClick={handleKontantstromClick}
          aar={aar}
          totalUtgifter={data.total_utgifter}
          totalInntekter={data.total_inntekter}
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
          open={modalOpen}
          onClose={handleClose}
          ariaLabel={
            singleAreaReady
              ? drillDownData.data?.navn ?? "Drill-down"
              : finnKategori(drillDown?.side ?? "utgift", drillDown?.id ?? "")?.navn ?? "Drill-down"
          }
        >
          {/* Multi-area oversikt (for "Øvrige" kategorier) */}
          {multiAreaReady && multiAreaData.data && drillDown && (
            <MultiAreaOversikt
              kategorinavn={finnKategori(drillDown.side, drillDown.id)?.navn ?? ""}
              omraader={multiAreaData.data}
              side={drillDown.side}
              onVelgOmraade={(nr) => setValgtOmrNr(nr)}
              onClose={handleClose}
            />
          )}

          {/* Single-area drill-down */}
          {singleAreaReady && drillDownData.data && drillDown && (
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
              omtale={hentAggregertOmtale(aar, drillDown.id)}
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
   Multi-area oversikt (for "Øvrige" kategorier med mange omr)
   --------------------------------------------------------------- */

function MultiAreaOversikt({
  kategorinavn,
  omraader,
  side,
  onVelgOmraade,
  onClose,
}: {
  kategorinavn: string;
  omraader: Programomraade[];
  side: "utgift" | "inntekt";
  onVelgOmraade: (omrNr: number) => void;
  onClose: () => void;
}) {
  const totalBelop = omraader.reduce((s, o) => s + o.total, 0);

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
              color: "var(--reg-marine)",
              marginBottom: "var(--space-1)",
            }}
          >
            {kategorinavn}
          </h3>
          <div
            style={{
              fontFamily: "var(--font-tall)",
              fontSize: "var(--tekst-xl)",
              color: "var(--tekst-sekundaer)",
            }}
          >
            {formaterBelop(totalBelop)}
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
          marginBottom: "var(--space-4)",
        }}
      >
        Denne kategorien består av {omraader.length} programområder. Velg et
        område for å se detaljene.
      </p>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
        role="list"
      >
        {omraader.map((omr) => {
          const andel = totalBelop > 0 ? (omr.total / totalBelop) * 100 : 0;
          return (
            <li key={omr.omr_nr}>
              <button
                onClick={() => onVelgOmraade(omr.omr_nr)}
                aria-label={`${omr.navn}: ${formaterBelop(omr.total)}. Klikk for detaljer.`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: "var(--space-3)",
                  padding: "var(--space-3)",
                  border: "1px solid var(--reg-lysgraa)",
                  borderRadius: "var(--radius-md)",
                  background: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  textAlign: "left",
                  transition: "border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--reg-blaa)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--reg-lysgraa)";
                }}
              >
                <div
                  style={{
                    width: 6,
                    minHeight: 32,
                    height: `${Math.max(32, andel * 1.2)}px`,
                    borderRadius: 3,
                    backgroundColor: side === "utgift" ? "var(--reg-blaa)" : "var(--reg-teal)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--tekst-sm)",
                      fontWeight: "var(--vekt-medium)",
                      color: "var(--tekst-primaer)",
                    }}
                  >
                    {omr.navn}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-tall)",
                    fontSize: "var(--tekst-sm)",
                    color: "var(--tekst-sekundaer)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {formaterBelop(omr.total)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-tall)",
                    fontSize: "var(--tekst-xs)",
                    color: "var(--tekst-deaktivert)",
                    whiteSpace: "nowrap",
                    width: "3.5rem",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {andel.toFixed(1)} %
                </div>
                <span
                  style={{
                    color: "var(--tekst-deaktivert)",
                    fontSize: "var(--tekst-lg)",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
