"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { AggregertKategori, SPUData } from "@/components/data/types/budget";
import { formaterBelop } from "@/components/shared/NumberFormat";
import styles from "./StackedBarChart.module.css";

interface StackedBarChartProps {
  utgifter: AggregertKategori[];
  inntekter: AggregertKategori[];
  spu: SPUData;
  visEndring: boolean;
  onSegmentClick: (side: "utgift" | "inntekt", id: string) => void;
  aar: number;
}

const BAR_BREDDE = 200;
const BAR_HOYDE = 500;
const PADDING_TOP = 10;
const ETIKETT_BREDDE = 160;
const SVG_BREDDE = BAR_BREDDE + ETIKETT_BREDDE + 20;

interface SegmentInfo {
  kategori: AggregertKategori;
  y: number;
  hoyde: number;
}

function beregnSegmenter(
  kategorier: AggregertKategori[],
  total: number
): SegmentInfo[] {
  const segmenter: SegmentInfo[] = [];
  let y = PADDING_TOP + BAR_HOYDE;

  // Bygg fra bunn og opp (største først, nederst)
  for (const kat of kategorier) {
    const hoyde = (kat.belop / total) * BAR_HOYDE;
    y -= hoyde;
    segmenter.push({ kategori: kat, y, hoyde });
  }

  return segmenter;
}

function tekstFargeForBakgrunn(farge: string): string {
  const lyseFarger = ["#EDEDEE", "#FFDF4F", "#60C3AD", "#ededee", "#ffdf4f", "#60c3ad"];
  return lyseFarger.some((lf) => farge.toLowerCase() === lf.toLowerCase())
    ? "#181C62"
    : "#FFFFFF";
}

function BarPlot({
  kategorier,
  tittel,
  side,
  onSegmentClick,
  hoverSegment,
  onHover,
  erAnimert,
}: {
  kategorier: AggregertKategori[];
  tittel: string;
  side: "utgift" | "inntekt";
  onSegmentClick: (side: "utgift" | "inntekt", id: string) => void;
  hoverSegment: string | null;
  onHover: (id: string | null) => void;
  erAnimert: boolean;
}) {
  const total = useMemo(
    () => kategorier.reduce((sum, k) => sum + k.belop, 0),
    [kategorier]
  );

  const segmenter = useMemo(
    () => beregnSegmenter(kategorier, total),
    [kategorier, total]
  );

  // Skjermleser-oppsummering av tallene
  const oppsummering = segmenter
    .map((seg) => `${seg.kategori.navn}: ${formaterBelop(seg.kategori.belop)}`)
    .join(". ");

  return (
    <div className={styles.barColumn}>
      <div className={styles.barTitle}>{tittel}</div>
      <div className={styles.barTotal}>
        {formaterBelop(total, 1, true)}
      </div>
      <svg
        className={styles.svgContainer}
        viewBox={`0 0 ${SVG_BREDDE} ${BAR_HOYDE + PADDING_TOP * 2}`}
        role="img"
        aria-label={`${tittel}: ${formaterBelop(total)}`}
      >
        <desc>
          Stacked barplot som viser {tittel.toLowerCase()} fordelt på {kategorier.length} kategorier.
          Totalt {formaterBelop(total)}. {oppsummering}
        </desc>

        {/* SPU stripemønster */}
        <defs>
          <pattern
            id={`spu-stripes-${side}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="#FFDF4F" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#E5C940" strokeWidth="2" />
          </pattern>
        </defs>

        {segmenter.map((seg, indeks) => {
          const erHovert = hoverSegment === seg.kategori.id;
          const erDimmet =
            hoverSegment !== null && hoverSegment !== seg.kategori.id;
          const erSPU = seg.kategori.type === "spu";
          const minHoyde = Math.max(seg.hoyde, 2);

          // Staggered reveal: segmenter bygges opp fra bunnen
          const forsinkelse = indeks * 60; // 60ms mellom hvert segment

          return (
            <g
              key={seg.kategori.id}
              tabIndex={0}
              role="button"
              aria-label={`${seg.kategori.navn}: ${formaterBelop(seg.kategori.belop)}, ${((seg.kategori.belop / total) * 100).toFixed(1)} prosent`}
              onClick={() => onSegmentClick(side, seg.kategori.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSegmentClick(side, seg.kategori.id);
                }
              }}
              onMouseEnter={() => onHover(seg.kategori.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(seg.kategori.id)}
              onBlur={() => onHover(null)}
              style={{
                cursor: "pointer",
                opacity: erDimmet ? 0.4 : erAnimert ? 1 : 0,
                transition: `opacity 150ms ease, transform 400ms ease ${forsinkelse}ms`,
                transform: erAnimert ? "translateY(0)" : `translateY(${BAR_HOYDE - seg.y}px)`,
              }}
            >
              {/* Segment-rektangel */}
              <rect
                x={0}
                y={seg.y}
                width={BAR_BREDDE}
                height={minHoyde}
                fill={erSPU ? `url(#spu-stripes-${side})` : seg.kategori.farge}
                stroke={erHovert ? "#000" : "none"}
                strokeWidth={erHovert ? 1.5 : 0}
              />

              {/* Segment-separasjon */}
              <line
                x1={0}
                y1={seg.y}
                x2={BAR_BREDDE}
                y2={seg.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
              />

              {/* Etikett */}
              {seg.hoyde > 25 ? (
                <text
                  x={BAR_BREDDE / 2}
                  y={seg.y + seg.hoyde / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={tekstFargeForBakgrunn(seg.kategori.farge)}
                  fontSize={seg.hoyde > 40 ? 11 : 9}
                  fontFamily="var(--font-sans)"
                  fontWeight="500"
                >
                  {seg.kategori.navn.length > 20
                    ? seg.kategori.navn.slice(0, 18) + "…"
                    : seg.kategori.navn}
                </text>
              ) : null}

              {/* Ekstern etikett med ledelinje */}
              <line
                x1={BAR_BREDDE}
                y1={seg.y + seg.hoyde / 2}
                x2={BAR_BREDDE + 10}
                y2={seg.y + seg.hoyde / 2}
                stroke="var(--tekst-sekundaer)"
                strokeWidth={0.5}
              />
              <text
                x={BAR_BREDDE + 14}
                y={seg.y + seg.hoyde / 2}
                dominantBaseline="central"
                fill="var(--tekst-primaer)"
                fontSize={10}
                fontFamily="var(--font-sans)"
              >
                {formaterBelop(seg.kategori.belop, 1, false)}
              </text>

              {/* Tooltip ved hover */}
              {erHovert && (
                <text
                  x={BAR_BREDDE / 2}
                  y={seg.y - 6}
                  textAnchor="middle"
                  fill="var(--tekst-primaer)"
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                  fontWeight="600"
                >
                  {((seg.kategori.belop / total) * 100).toFixed(1)} %
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function StackedBarChart({
  utgifter,
  inntekter,
  onSegmentClick,
}: StackedBarChartProps) {
  const [hoverSegment, setHoverSegment] = useState<string | null>(null);
  const [erAnimert, setErAnimert] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Staggered reveal: animerer seg inn etter mount
  useEffect(() => {
    // Bruk IntersectionObserver for å trigge animasjonen når grafen er synlig
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setErAnimert(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <BarPlot
        kategorier={utgifter}
        tittel="Utgifter"
        side="utgift"
        onSegmentClick={onSegmentClick}
        hoverSegment={hoverSegment}
        onHover={setHoverSegment}
        erAnimert={erAnimert}
      />
      <BarPlot
        kategorier={inntekter}
        tittel="Inntekter"
        side="inntekt"
        onSegmentClick={onSegmentClick}
        hoverSegment={hoverSegment}
        onHover={setHoverSegment}
        erAnimert={erAnimert}
      />
    </div>
  );
}
