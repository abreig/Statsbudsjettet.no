"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { AggregertKategori, SPUData } from "@/components/data/types/budget";
import { formaterBelop } from "@/components/shared/NumberFormat";
import styles from "./StackedBarChart.module.css";

interface StackedBarChartProps {
  utgifter: AggregertKategori[];
  inntekter: AggregertKategori[];
  spu: SPUData;
  visEndring: boolean;
  onSegmentClick: (side: "utgift" | "inntekt", id: string) => void;
  onKontantstromClick: () => void;
  aar: number;
  totalUtgifter?: number;
  totalInntekter?: number;
}

// Layout-konstanter
const BAR_H = 560;
const BAR_W = 200;
const BAR_GAP = 80;
const BAR_TOP = 76;
const BAR_BOTTOM = BAR_TOP + BAR_H;

// SPU-boks dimensjoner
const SPU_BOX_W = 150;
const SPU_BOX_H = 56;
const KS_BOX_W = 164;
const KS_BOX_H = 48;
const SPU_GAP = 60; // avstand mellom inntektsbar og SPU-sone

// Beregn sentrert layout — søylene (Utgifter + Inntekter) sentreres,
// SPU-sonen strekker seg til høyre
const BARS_W = BAR_W * 2 + BAR_GAP;
const SPU_SIDE_W = SPU_GAP + Math.max(SPU_BOX_W, KS_BOX_W);
const SVG_W = BARS_W + 2 * SPU_SIDE_W + 40;
const UTGIFT_X = Math.round(SVG_W / 2 - BARS_W / 2);
const INNTEKT_X = UTGIFT_X + BAR_W + BAR_GAP;
const SPU_ZONE_X = INNTEKT_X + BAR_W + SPU_GAP;

// SPU-farger
const SPU_BLA = "#2C4F8A";
const FOND_GUL = "#E8C840";
const FOND_GUL_LIGHT = "#F5E08A";

function formaterMrd(belop: number): string {
  const mrd = belop / 1e9;
  return mrd.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function tekstFarge(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 140 ? "#0C1045" : "#fff";
}

interface SegmentData {
  id: string;
  navn: string;
  belop: number;
  farge: string;
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  midY: number;
}

interface TooltipInfo {
  title: string;
  value: string;
  desc?: string;
  accent?: string;
  cx: number;
  cy: number;
}

function Tooltip({
  info,
  containerRef,
}: {
  info: TooltipInfo | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!info) return null;
  const r = containerRef?.current?.getBoundingClientRect();
  if (!r) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: Math.min(info.cx - r.left + 18, r.width - 290),
        top: info.cy - r.top - 12,
        transform: "translateY(-100%)",
        background: "#0C1045",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.55,
        pointerEvents: "none",
        zIndex: 50,
        maxWidth: 280,
        boxShadow: "0 10px 32px rgba(12,16,69,0.4)",
        borderLeft: `3px solid ${info.accent || FOND_GUL}`,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 3 }}>{info.title}</div>
      <div style={{ color: FOND_GUL, fontWeight: 700, fontSize: 17 }}>{info.value}</div>
      {info.desc && (
        <div style={{ opacity: 0.65, fontSize: 11, marginTop: 4 }}>{info.desc}</div>
      )}
    </div>
  );
}

export default function StackedBarChart({
  utgifter,
  inntekter,
  spu,
  onSegmentClick,
  onKontantstromClick,
  totalUtgifter,
  totalInntekter,
}: StackedBarChartProps) {
  const [tt, setTt] = useState<TooltipInfo | null>(null);
  const [hovGroup, setHovGroup] = useState<string | null>(null);
  const [hovId, setHovId] = useState<string | null>(null);
  const [erAnimert, setErAnimert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setErAnimert(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  // Bruk eksplisitte totaler fra data, eller beregn fra kategorier som fallback
  const utgKatSum = useMemo(() => utgifter.reduce((s, k) => s + k.belop, 0), [utgifter]);
  const innKatSum = useMemo(() => inntekter.reduce((s, k) => s + k.belop, 0), [inntekter]);
  const utgTotal = totalUtgifter ?? utgKatSum;
  const innTotal = totalInntekter ?? (innKatSum + spu.fondsuttak);
  const fondsuttak = spu.fondsuttak;

  // Skala basert på utgifter (høyeste søylen)
  const scale = BAR_H / utgTotal;

  // Inntekter: ordinære + fondsuttak
  const ordH = innKatSum * scale;
  const fondH = fondsuttak * scale;
  const innTotalH = ordH + fondH;
  const innTopY = BAR_BOTTOM - innTotalH;
  const ordTopY = BAR_BOTTOM - ordH;
  const fondSegY = innTopY; // fondsuttak er øverst

  // Utgiftssegmenter — fyller hele baren
  const uSegs: SegmentData[] = useMemo(() => {
    const sorted = [...utgifter].sort((a, b) => b.belop - a.belop);
    let y = BAR_BOTTOM;
    return sorted.map((d) => {
      const h = d.belop * scale;
      y -= h;
      return { ...d, rx: UTGIFT_X, ry: y, rw: BAR_W, rh: h, midY: y + h / 2 };
    });
  }, [utgifter, scale]);

  // Inntektssegmenter — fyller den ordinære delen (under fondsuttak)
  const iSegs: SegmentData[] = useMemo(() => {
    const sorted = [...inntekter].sort((a, b) => b.belop - a.belop);
    let y = BAR_BOTTOM;
    return sorted.map((d) => {
      const h = d.belop * scale;
      y -= h;
      return { ...d, rx: INNTEKT_X, ry: y, rw: BAR_W, rh: h, midY: y + h / 2 };
    });
  }, [inntekter, scale]);

  // SPU-bokser — plasser sentrert på fondsuttak-segmentet
  const spuCx = SPU_ZONE_X + Math.max(SPU_BOX_W, KS_BOX_W) / 2;
  const spuX = spuCx - SPU_BOX_W / 2;
  const spuY = fondSegY + fondH / 2 - SPU_BOX_H / 2 + 30;
  const ksX = spuCx - KS_BOX_W / 2;
  const ksY = spuY - 90;

  // SPU-flow: fylt bane fra SPU-boks til hele fondsuttak-segmentet
  const flowBarRight = INNTEKT_X + BAR_W;
  const flowSpuLeft = spuX;
  const flowMidX = (flowBarRight + flowSpuLeft) / 2;
  const flowPath = [
    `M${flowBarRight},${fondSegY}`,             // top-venstre (bar-kant, topp av fondsuttak)
    `C${flowMidX},${fondSegY}`,                 // kontrollpunkt
    ` ${flowMidX},${spuY}`,
    ` ${flowSpuLeft},${spuY}`,                  // top-høyre (SPU-boks topp)
    `L${flowSpuLeft},${spuY + SPU_BOX_H}`,     // bunn-høyre (SPU-boks bunn)
    `C${flowMidX},${spuY + SPU_BOX_H}`,        // kontrollpunkt
    ` ${flowMidX},${fondSegY + fondH}`,
    ` ${flowBarRight},${fondSegY + fondH}`,     // bunn-venstre (bar-kant, bunn av fondsuttak)
    "Z",
  ].join(" ");

  const show = useCallback(
    (e: React.MouseEvent, id: string, group: string, title: string, value: string, desc?: string, accent?: string) => {
      setHovGroup(group);
      setHovId(id);
      setTt({ title, value, desc, accent, cx: e.clientX, cy: e.clientY });
    },
    []
  );
  const move = useCallback(
    (e: React.MouseEvent) => setTt((p) => (p ? { ...p, cx: e.clientX, cy: e.clientY } : null)),
    []
  );
  const hide = useCallback(() => {
    setHovGroup(null);
    setHovId(null);
    setTt(null);
  }, []);

  const dim = (group: string, id: string) => hovGroup === group && hovId !== id;
  const H = BAR_BOTTOM + 24;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div ref={ref} style={{ position: "relative", overflowX: "auto" }} onMouseLeave={hide}>
        <svg
          width={SVG_W} height={H} viewBox={`0 0 ${SVG_W} ${H}`}
          style={{ display: "block", margin: "0 auto", maxWidth: "100%", overflow: "visible" }}
          role="img"
          aria-label={`Budsjettvisualisering: utgifter ${formaterBelop(utgTotal)}, inntekter ${formaterBelop(innTotal)}`}
        >
          <defs>
            <pattern id="spu-stripe" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill={FOND_GUL} />
              <line x1="0" y1="0" x2="0" y2="7" stroke={FOND_GUL_LIGHT} strokeWidth="3" strokeOpacity="0.5" />
            </pattern>
            <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={FOND_GUL} stopOpacity="0.35" />
              <stop offset="100%" stopColor={SPU_BLA} stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="arrow-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SPU_BLA} stopOpacity="0.15" />
              <stop offset="100%" stopColor={SPU_BLA} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* UTGIFTER */}
          <text x={UTGIFT_X + BAR_W / 2} y={28} textAnchor="middle" fontSize={11} fontWeight={600} fill="#888" letterSpacing="0.12em">UTGIFTER</text>
          <text x={UTGIFT_X + BAR_W / 2} y={52} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fontWeight={700} fill="#0C1045">{formaterMrd(utgTotal)}</text>
          <text x={UTGIFT_X + BAR_W / 2} y={68} textAnchor="middle" fontSize={10} fill="#aaa">mrd. kr</text>

          {uSegs.map((s) => (
            <g key={s.id} tabIndex={0} role="button" aria-label={`${s.navn}: ${formaterBelop(s.belop)}`}
              onClick={() => onSegmentClick("utgift", s.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSegmentClick("utgift", s.id); } }}
              style={{ cursor: "pointer", opacity: erAnimert ? (dim("utgift", s.id) ? 0.15 : 1) : 0, transition: "opacity 0.3s ease" }}
            >
              <rect x={s.rx} y={s.ry} width={s.rw} height={s.rh} fill={s.farge} rx={1}
                onMouseEnter={(e) => show(e, s.id, "utgift", s.navn, `${formaterMrd(s.belop)} mrd. kr`, `${((s.belop / utgTotal) * 100).toFixed(1)} % av totale utgifter`, s.farge)}
                onMouseMove={move} onMouseLeave={hide} />
              {s.ry > BAR_TOP + 2 && <line x1={s.rx} y1={s.ry} x2={s.rx + s.rw} y2={s.ry} stroke="#fff" strokeWidth={1} pointerEvents="none" />}
              {s.rh > 28 && <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? -3 : 4)} textAnchor="middle" fontSize={s.rh > 50 ? 12 : 10} fontWeight={500} fill={tekstFarge(s.farge)} pointerEvents="none" opacity={0.95}>{s.rh > 50 ? s.navn : ""}</text>}
              {s.rh > 22 && <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? 13 : 4)} textAnchor="middle" fontSize={s.rh > 50 ? 13 : 10} fontWeight={700} fill={tekstFarge(s.farge)} pointerEvents="none">{formaterMrd(s.belop)}</text>}
            </g>
          ))}

          {/* INNTEKTER */}
          <text x={INNTEKT_X + BAR_W / 2} y={28} textAnchor="middle" fontSize={11} fontWeight={600} fill="#888" letterSpacing="0.12em">INNTEKTER</text>
          <text x={INNTEKT_X + BAR_W / 2} y={52} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fontWeight={700} fill="#0C1045">{formaterMrd(innTotal)}</text>
          <text x={INNTEKT_X + BAR_W / 2} y={68} textAnchor="middle" fontSize={10} fill="#aaa">mrd. kr</text>

          {/* Ordinære inntektssegmenter */}
          {iSegs.map((s) => (
            <g key={s.id} tabIndex={0} role="button" aria-label={`${s.navn}: ${formaterBelop(s.belop)}`}
              onClick={() => onSegmentClick("inntekt", s.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSegmentClick("inntekt", s.id); } }}
              style={{ cursor: "pointer", opacity: erAnimert ? (dim("inntekt", s.id) ? 0.15 : 1) : 0, transition: "opacity 0.3s ease" }}
            >
              <rect x={s.rx} y={s.ry} width={s.rw} height={s.rh} fill={s.farge} rx={1}
                onMouseEnter={(e) => show(e, s.id, "inntekt", s.navn, `${formaterMrd(s.belop)} mrd. kr`, `${((s.belop / innKatSum) * 100).toFixed(1)} % av ordinære inntekter`, s.farge)}
                onMouseMove={move} onMouseLeave={hide} />
              {s.ry > ordTopY + 2 && <line x1={s.rx} y1={s.ry} x2={s.rx + s.rw} y2={s.ry} stroke="#fff" strokeWidth={1} pointerEvents="none" />}
              {s.rh > 28 && <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? -3 : 4)} textAnchor="middle" fontSize={s.rh > 50 ? 12 : 10} fontWeight={500} fill={tekstFarge(s.farge)} pointerEvents="none" opacity={0.95}>{s.rh > 50 ? s.navn : ""}</text>}
              {s.rh > 22 && <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? 13 : 4)} textAnchor="middle" fontSize={s.rh > 50 ? 13 : 10} fontWeight={700} fill={tekstFarge(s.farge)} pointerEvents="none">{formaterMrd(s.belop)}</text>}
            </g>
          ))}

          {/* Fondsuttak-segment (gul, øverst på inntektssøylen) */}
          <g style={{ cursor: "pointer", opacity: erAnimert ? (dim("inntekt", "fondsuttak") ? 0.15 : 1) : 0, transition: "opacity 0.3s ease" }}>
            <rect x={INNTEKT_X} y={fondSegY} width={BAR_W} height={fondH} fill="url(#spu-stripe)" rx={1}
              onMouseEnter={(e) => show(e, "fondsuttak", "inntekt", "Uttak fra SPU", `${formaterMrd(fondsuttak)} mrd. kr`, "= det oljekorrigerte underskuddet. Styrt av handlingsregelen.", FOND_GUL)}
              onMouseMove={move} onMouseLeave={hide} />
            {fondH > 30 && (
              <>
                <text x={INNTEKT_X + BAR_W / 2} y={fondSegY + fondH / 2 - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0C1045" pointerEvents="none">Uttak fra SPU</text>
                <text x={INNTEKT_X + BAR_W / 2} y={fondSegY + fondH / 2 + 12} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0C1045" pointerEvents="none">{formaterMrd(fondsuttak)}</text>
              </>
            )}
          </g>

          {/* Skillelinje ordinære / fondsuttak */}
          <line x1={INNTEKT_X} y1={ordTopY} x2={INNTEKT_X + BAR_W} y2={ordTopY} stroke={SPU_BLA} strokeWidth={1} strokeDasharray="4,3" opacity={0.3} />

          {/* Alignment-linjer */}
          <line x1={UTGIFT_X} y1={BAR_TOP} x2={INNTEKT_X + BAR_W} y2={BAR_TOP} stroke="#e0ddd6" strokeWidth={0.5} />
          <line x1={UTGIFT_X} y1={BAR_BOTTOM} x2={INNTEKT_X + BAR_W} y2={BAR_BOTTOM} stroke="#e0ddd6" strokeWidth={0.5} />

          {/* SPU-FLOW: fylt bane fra SPU-boks til fondsuttak-segment */}
          <path
            d={flowPath}
            fill="url(#flow-grad)"
            stroke={FOND_GUL}
            strokeWidth={0.5}
            strokeOpacity={0.3}
            opacity={erAnimert ? 0.7 : 0}
            style={{ transition: "opacity 0.5s ease 0.5s" }}
          />

          {/* KONTANTSTRØM-BOKS */}
          <g style={{ cursor: "pointer", opacity: erAnimert ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}
            onClick={onKontantstromClick} tabIndex={0} role="button"
            aria-label={`Netto kontantstrøm petroleum: ${formaterBelop(spu.netto_kontantstrom)}. Klikk for fordeling.`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onKontantstromClick(); } }}>
            <rect x={ksX} y={ksY} width={KS_BOX_W} height={KS_BOX_H} rx={8} fill={SPU_BLA} opacity={0.9}
              onMouseEnter={(e) => show(e, "kontant", "kontant", "Netto kontantstrøm petroleum", `${formaterMrd(spu.netto_kontantstrom)} mrd. kr`, "Klikk for fordeling. Går uavkortet til fondet.", SPU_BLA)}
              onMouseMove={move} onMouseLeave={hide} />
            <text x={spuCx} y={ksY + KS_BOX_H / 2 - 8} textAnchor="middle" fontSize={10} fontWeight={500} fill="rgba(255,255,255,0.7)" pointerEvents="none">Netto kontantstrøm petroleum</text>
            <text x={spuCx} y={ksY + KS_BOX_H / 2 + 10} textAnchor="middle" fontSize={15} fontWeight={700} fill="#fff" pointerEvents="none">{formaterMrd(spu.netto_kontantstrom)} mrd. kr</text>
            <text x={spuCx} y={ksY - 8} textAnchor="middle" fontSize={8} fill="#bbb" pointerEvents="none">Klikk for fordeling</text>
          </g>

          {/* Pil kontantstrøm → SPU */}
          <line x1={spuCx} y1={ksY + KS_BOX_H + 4} x2={spuCx} y2={spuY - 4} stroke="url(#arrow-grad)" strokeWidth={3} style={{ opacity: erAnimert ? 1 : 0, transition: "opacity 0.5s ease 0.4s" }} />
          <polygon points={`${spuCx},${spuY - 4} ${spuCx - 6},${spuY - 16} ${spuCx + 6},${spuY - 16}`} fill={SPU_BLA} opacity={erAnimert ? 0.4 : 0} style={{ transition: "opacity 0.5s ease 0.4s" }} />

          {/* SPU-BOKS */}
          <g style={{ opacity: erAnimert ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
            <rect x={spuX} y={spuY} width={SPU_BOX_W} height={SPU_BOX_H} rx={8} fill={SPU_BLA} style={{ cursor: "pointer" }}
              onMouseEnter={(e) => show(e, "spu", "spu", "Statens pensjonsfond utland", "~19 800 mrd. kr", "Handlingsregelen: uttak ~3 % av fondets verdi per år", SPU_BLA)}
              onMouseMove={move} onMouseLeave={hide} />
            <text x={spuCx} y={spuY + SPU_BOX_H / 2 - 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff" pointerEvents="none">SPU</text>
            <text x={spuCx} y={spuY + SPU_BOX_H / 2 + 12} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.55)" pointerEvents="none">Statens pensjonsfond utland</text>
            <text x={spuCx} y={spuY + SPU_BOX_H + 16} textAnchor="middle" fontSize={9} fill="#999" fontStyle="italic">Uttak ~3 % av fondets verdi</text>
          </g>
        </svg>

        <Tooltip info={tt} containerRef={ref} />
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {[
          { bg: "linear-gradient(180deg, #0C1045, #839DD5)", label: "Utgifter (marine-skala)" },
          { bg: "linear-gradient(180deg, #004D52, #5AB8AD)", label: "Ordinære inntekter (teal-skala)" },
          { bg: `repeating-linear-gradient(45deg, ${FOND_GUL}, ${FOND_GUL} 2px, ${FOND_GUL_LIGHT} 2px, ${FOND_GUL_LIGHT} 4px)`, label: "Uttak fra SPU" },
          { bg: SPU_BLA, label: "SPU / petroleumsinntekter" },
        ].map((item) => (
          <div key={item.label} className={styles.legendItem}>
            <div className={styles.legendSwatch} style={{ background: item.bg }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
