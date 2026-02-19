import { useState, useMemo, useRef, useCallback } from "react";

// ============================================================
// DATA (Gul bok 2025)
// ============================================================
const UTGIFTER = [
  { id: "folketrygd", navn: "Folketrygden", belop: 702.0 },
  { id: "kommuner", navn: "Kommuner og distrikter", belop: 290.5 },
  { id: "helse", navn: "Helse og omsorg", belop: 248.1 },
  { id: "naering", navn: "Naering og fiskeri", belop: 132.0 },
  { id: "kunnskap", navn: "Kunnskapsformaal", belop: 120.0 },
  { id: "forsvar", navn: "Forsvar", belop: 110.1 },
  { id: "transport", navn: "Transport", belop: 95.3 },
  { id: "ovrige_u", navn: "Ovrige utgifter", belop: 548.0 },
];

const INNTEKTER_ORD = [
  { id: "skatt", navn: "Skatt paa inntekt og formue", belop: 430.0 },
  { id: "mva", navn: "Merverdiavgift", belop: 409.3 },
  { id: "arbgavg", navn: "Arbeidsgiveravgift", belop: 269.4 },
  { id: "trygd", navn: "Trygdeavgift", belop: 197.3 },
  { id: "ovrige_i", navn: "Ovrige inntekter", belop: 320.8 },
];

const KONTANTSTROM_KILDER = [
  { id: "petskatt", navn: "Petroleumsskatter", belop: 381 },
  { id: "sdfi", navn: "SDFI", belop: 168 },
  { id: "equinor", navn: "Equinor-utbytte", belop: 38 },
  { id: "andre_p", navn: "Andre petroleumsinnt.", belop: 69 },
];

const UTGIFTER_TOTAL = UTGIFTER.reduce((s, d) => s + d.belop, 0);
const ORD_TOTAL = INNTEKTER_ORD.reduce((s, d) => s + d.belop, 0);
const FONDSUTTAK = UTGIFTER_TOTAL - ORD_TOTAL;
const KONTANTSTROM_TOTAL = 656.0;

// ============================================================
// MONOCHROMATIC COLOR SCALES
// ============================================================
// Utgifter: marine-skala (moerkt til lyst)
const UTGIFT_FARGER = [
  "#0C1045", "#181C62", "#263080", "#354A9E",
  "#4A65B5", "#6580C5", "#839DD5", "#A8BAE2",
];
// Inntekter: teal-skala (moerkt til lyst)
const INNTEKT_FARGER = [
  "#004D52", "#006B73", "#008286", "#2A9D8F", "#5AB8AD",
];

const SPU_BLA = "#2C4F8A";
const SPU_BLA_LIGHT = "#3D6AAF";
const FOND_GUL = "#E8C840";
const FOND_GUL_LIGHT = "#F5E08A";

const fmt = (v) =>
  v.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const txtOn = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 140 ? "#0C1045" : "#fff";
};

// ============================================================
// TOOLTIP
// ============================================================
function Tooltip({ info, containerRef }) {
  if (!info) return null;
  const r = containerRef?.current?.getBoundingClientRect();
  if (!r) return null;
  return (
    <div style={{
      position: "absolute",
      left: Math.min(info.cx - r.left + 18, r.width - 290),
      top: info.cy - r.top - 12,
      transform: "translateY(-100%)",
      background: "#0C1045", color: "#fff", padding: "12px 16px",
      borderRadius: 8, fontSize: 13, lineHeight: 1.55,
      pointerEvents: "none", zIndex: 50, maxWidth: 280,
      boxShadow: "0 10px 32px rgba(12,16,69,0.4)",
      borderLeft: `3px solid ${info.accent || FOND_GUL}`,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 3 }}>{info.title}</div>
      <div style={{ color: FOND_GUL, fontWeight: 700, fontSize: 17 }}>{info.value}</div>
      {info.desc && <div style={{ opacity: 0.65, fontSize: 11, marginTop: 4 }}>{info.desc}</div>}
    </div>
  );
}

// ============================================================
// DRILL-DOWN
// ============================================================
function DrillDown({ items, total, onClose }) {
  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      background: "#fff", borderRadius: 14, padding: "28px 32px",
      boxShadow: "0 20px 60px rgba(12,16,69,0.22)", zIndex: 70,
      minWidth: 340, maxWidth: 420, border: `2px solid ${SPU_BLA}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: SPU_BLA, fontWeight: 600, marginBottom: 2 }}>Netto kontantstrom</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0C1045" }}>{fmt(total)} <span style={{ fontSize: 14, fontWeight: 400, color: "#888" }}>mrd. kr</span></div>
        </div>
        <button onClick={onClose} style={{
          background: "#f0f0f0", border: "none", borderRadius: 6,
          padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#666", fontWeight: 500,
        }}>Lukk</button>
      </div>
      {items.map((k) => (
        <div key={k.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ fontWeight: 500, color: "#0C1045" }}>{k.navn}</span>
            <span style={{ fontWeight: 600, color: SPU_BLA }}>{fmt(k.belop)} mrd.</span>
          </div>
          <div style={{ height: 8, background: "#e8edf5", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(k.belop / total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${SPU_BLA}, ${SPU_BLA_LIGHT})`, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function Budsjettvisning() {
  const [tt, setTt] = useState(null);
  const [drillOpen, setDrillOpen] = useState(false);
  const [hovGroup, setHovGroup] = useState(null);
  const [hovId, setHovId] = useState(null);
  const ref = useRef(null);

  const show = useCallback((e, id, group, title, value, desc, accent) => {
    setHovGroup(group);
    setHovId(id);
    setTt({ title, value, desc, accent, cx: e.clientX, cy: e.clientY });
  }, []);
  const move = useCallback((e) =>
    setTt((p) => (p ? { ...p, cx: e.clientX, cy: e.clientY } : null)), []);
  const hide = useCallback(() => { setHovGroup(null); setHovId(null); setTt(null); }, []);

  // Layout
  const W = 1080;
  const barH = 640;
  const barTop = 76;
  const barW = 200;
  const barGap = 80;
  const barBottom = barTop + barH;

  const utgiftX = 50;
  const inntektX = utgiftX + barW + barGap;
  const spuZoneX = inntektX + barW + 65;

  const scale = barH / UTGIFTER_TOTAL;
  const ordH = ORD_TOTAL * scale;
  const fondH = FONDSUTTAK * scale;
  const ordTopY = barBottom - ordH;
  const fondSegY = ordTopY - fondH;

  // SPU
  const spuW = 150;
  const spuH = 56;
  const spuX = spuZoneX + 10;
  const spuCx = spuX + spuW / 2;
  const spuY = fondSegY + fondH / 2 - spuH / 2 + 30;

  // Kontantstrøm (OVER SPU)
  const ksW = 164;
  const ksH = 48;
  const ksX = spuCx - ksW / 2;
  const ksY = spuY - 90;

  const H = barBottom + 24;

  // Segments
  const uSegs = useMemo(() => {
    const sorted = [...UTGIFTER].sort((a, b) => b.belop - a.belop);
    let y = barBottom;
    return sorted.map((d, i) => {
      const h = d.belop * scale;
      y -= h;
      return { ...d, farge: UTGIFT_FARGER[i], rx: utgiftX, ry: y, rw: barW, rh: h, midY: y + h / 2 };
    });
  }, [scale]);

  const iSegs = useMemo(() => {
    const sorted = [...INNTEKTER_ORD].sort((a, b) => b.belop - a.belop);
    let y = barBottom;
    return sorted.map((d, i) => {
      const h = d.belop * scale;
      y -= h;
      return { ...d, farge: INNTEKT_FARGER[i], rx: inntektX, ry: y, rw: barW, rh: h, midY: y + h / 2 };
    });
  }, [scale]);

  const dim = (group, id) => hovGroup === group && hovId !== id;

  // Bro path
  const broPath = `M${spuX},${spuY + spuH / 2} C${spuX - 45},${spuY + spuH / 2} ${inntektX + barW + 45},${fondSegY + fondH / 2} ${inntektX + barW},${fondSegY + fondH / 2}`;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F5F3EE", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0C1045 0%, #181C62 60%, #263080 100%)",
        padding: "2rem 2rem 1.6rem", position: "relative",
      }}>
        {/* Subtle texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px, 40px 40px",
        }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${FOND_GUL}, transparent)` }} />
        <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
            Statsbudsjettet 2025
          </div>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(1.3rem, 3.5vw, 2rem)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
            Utgifter, inntekter og Statens pensjonsfond utland
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, maxWidth: 620, lineHeight: 1.6 }}>
            Budsjettet gaar alltid opp. Gapet mellom ordinaere inntekter og utgifter dekkes av uttaket fra fondet.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "1.5rem auto 2.5rem", padding: "0 0.5rem" }}>
        <div style={{
          background: "#fff", borderRadius: 12, padding: "2rem 1.5rem",
          boxShadow: "0 2px 12px rgba(12,16,69,0.05), 0 0 0 1px rgba(12,16,69,0.03)",
        }}>
          <div ref={ref} style={{ position: "relative", overflowX: "auto" }} onMouseLeave={hide}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto", maxWidth: "100%", overflow: "visible" }}>
              <defs>
                <pattern id="spu-stripe" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="7" height="7" fill={FOND_GUL} />
                  <line x1="0" y1="0" x2="0" y2="7" stroke={FOND_GUL_LIGHT} strokeWidth="3" strokeOpacity="0.5" />
                </pattern>
                <linearGradient id="bro-grad" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor={FOND_GUL} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={SPU_BLA} stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="arrow-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SPU_BLA} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={SPU_BLA} stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* ===== UTGIFTER ===== */}
              <text x={utgiftX + barW / 2} y={28} textAnchor="middle" fontSize={11} fontWeight={600} fill="#888" letterSpacing="0.12em" style={{ textTransform: "uppercase" }}>Utgifter</text>
              <text x={utgiftX + barW / 2} y={52} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fontWeight={700} fill="#0C1045">
                {fmt(UTGIFTER_TOTAL)}
              </text>
              <text x={utgiftX + barW / 2} y={68} textAnchor="middle" fontSize={10} fill="#aaa">mrd. kr</text>

              {uSegs.map((s) => (
                <g key={s.id}>
                  <rect x={s.rx} y={s.ry} width={s.rw} height={s.rh} fill={s.farge} rx={1}
                    opacity={dim("utgift", s.id) ? 0.15 : 1}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => show(e, s.id, "utgift", s.navn, `${fmt(s.belop)} mrd. kr`, `${((s.belop / UTGIFTER_TOTAL) * 100).toFixed(1)} % av totale utgifter`, s.farge)}
                    onMouseMove={move} onMouseLeave={hide}
                  />
                  {/* 1px gap between segments */}
                  {s.ry > barTop + 2 && (
                    <line x1={s.rx} y1={s.ry} x2={s.rx + s.rw} y2={s.ry} stroke="#fff" strokeWidth={1} pointerEvents="none" />
                  )}
                  {/* Label inside */}
                  {s.rh > 28 && (
                    <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? -3 : 4)}
                      textAnchor="middle" fontSize={s.rh > 50 ? 12 : 10} fontWeight={500}
                      fill={txtOn(s.farge)} pointerEvents="none" opacity={0.95}>
                      {s.rh > 50 ? s.navn : ""}
                    </text>
                  )}
                  {s.rh > 22 && (
                    <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? 13 : 4)}
                      textAnchor="middle" fontSize={s.rh > 50 ? 13 : 10} fontWeight={700}
                      fill={txtOn(s.farge)} pointerEvents="none">
                      {fmt(s.belop)}
                    </text>
                  )}
                </g>
              ))}

              {/* ===== INNTEKTER ===== */}
              <text x={inntektX + barW / 2} y={28} textAnchor="middle" fontSize={11} fontWeight={600} fill="#888" letterSpacing="0.12em">INNTEKTER</text>
              <text x={inntektX + barW / 2} y={52} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fontWeight={700} fill="#0C1045">
                {fmt(UTGIFTER_TOTAL)}
              </text>
              <text x={inntektX + barW / 2} y={68} textAnchor="middle" fontSize={10} fill="#aaa">mrd. kr (totalt)</text>

              {/* Ordinaere segments */}
              {iSegs.map((s) => (
                <g key={s.id}>
                  <rect x={s.rx} y={s.ry} width={s.rw} height={s.rh} fill={s.farge} rx={1}
                    opacity={dim("inntekt", s.id) ? 0.15 : 1}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => show(e, s.id, "inntekt", s.navn, `${fmt(s.belop)} mrd. kr`, `${((s.belop / ORD_TOTAL) * 100).toFixed(1)} % av ordinaere inntekter`, s.farge)}
                    onMouseMove={move} onMouseLeave={hide}
                  />
                  {s.ry > ordTopY + 2 && (
                    <line x1={s.rx} y1={s.ry} x2={s.rx + s.rw} y2={s.ry} stroke="#fff" strokeWidth={1} pointerEvents="none" />
                  )}
                  {s.rh > 28 && (
                    <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? -3 : 4)}
                      textAnchor="middle" fontSize={s.rh > 50 ? 12 : 10} fontWeight={500}
                      fill={txtOn(s.farge)} pointerEvents="none" opacity={0.95}>
                      {s.rh > 50 ? s.navn : ""}
                    </text>
                  )}
                  {s.rh > 22 && (
                    <text x={s.rx + s.rw / 2} y={s.midY + (s.rh > 50 ? 13 : 4)}
                      textAnchor="middle" fontSize={s.rh > 50 ? 13 : 10} fontWeight={700}
                      fill={txtOn(s.farge)} pointerEvents="none">
                      {fmt(s.belop)}
                    </text>
                  )}
                </g>
              ))}

              {/* Skillelinje ordinaer / fondsuttak */}
              <line x1={inntektX} y1={ordTopY} x2={inntektX + barW} y2={ordTopY}
                stroke={SPU_BLA} strokeWidth={1} strokeDasharray="4,3" opacity={0.3} />

              {/* Fondsuttak-segment */}
              <rect x={inntektX} y={fondSegY} width={barW} height={fondH}
                fill="url(#spu-stripe)" rx={1}
                opacity={dim("inntekt", "fondsuttak") ? 0.15 : 1}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => show(e, "fondsuttak", "inntekt", "Uttak fra SPU", `${fmt(FONDSUTTAK)} mrd. kr`, "= det oljekorrigerte underskuddet. Styrt av handlingsregelen.", FOND_GUL)}
                onMouseMove={move} onMouseLeave={hide}
              />
              <text x={inntektX + barW / 2} y={fondSegY + fondH / 2 - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0C1045" pointerEvents="none">Uttak fra SPU</text>
              <text x={inntektX + barW / 2} y={fondSegY + fondH / 2 + 12} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0C1045" pointerEvents="none">{fmt(FONDSUTTAK)}</text>

              {/* Tynne alignment-linjer topp/bunn */}
              <line x1={utgiftX} y1={barTop} x2={inntektX + barW} y2={barTop} stroke="#e0ddd6" strokeWidth={0.5} />
              <line x1={utgiftX} y1={barBottom} x2={inntektX + barW} y2={barBottom} stroke="#e0ddd6" strokeWidth={0.5} />

              {/* ===== KONTANTSTROM BOKS (over SPU) ===== */}
              <rect x={ksX} y={ksY} width={ksW} height={ksH}
                rx={8} fill={SPU_BLA}
                opacity={0.9} style={{ cursor: "pointer" }}
                onClick={() => setDrillOpen(true)}
                onMouseEnter={(e) => show(e, "kontant", "kontant", "Netto kontantstrom petroleum", `${fmt(KONTANTSTROM_TOTAL)} mrd. kr`, "Klikk for fordeling. Gaar uavkortet til fondet.", SPU_BLA)}
                onMouseMove={move} onMouseLeave={hide}
              />
              <text x={spuCx} y={ksY + ksH / 2 - 8} textAnchor="middle" fontSize={10} fontWeight={500} fill="rgba(255,255,255,0.7)" pointerEvents="none">
                Netto kontantstrom petroleum
              </text>
              <text x={spuCx} y={ksY + ksH / 2 + 10} textAnchor="middle" fontSize={15} fontWeight={700} fill="#fff" pointerEvents="none">
                {fmt(KONTANTSTROM_TOTAL)} mrd. kr
              </text>
              <text x={spuCx} y={ksY - 8} textAnchor="middle" fontSize={8} fill="#bbb">Klikk for fordeling</text>

              {/* Pil ned fra kontantstrom til SPU */}
              <line x1={spuCx} y1={ksY + ksH + 4} x2={spuCx} y2={spuY - 4}
                stroke="url(#arrow-grad)" strokeWidth={3} />
              <polygon points={`${spuCx},${spuY - 4} ${spuCx - 6},${spuY - 16} ${spuCx + 6},${spuY - 16}`}
                fill={SPU_BLA} opacity={0.4} />

              {/* ===== SPU BOKS ===== */}
              <rect x={spuX} y={spuY} width={spuW} height={spuH}
                rx={8} fill={SPU_BLA}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => show(e, "spu", "spu", "Statens pensjonsfond utland", "~19 800 mrd. kr", "Handlingsregelen: uttak ~3 % av fondets verdi per aar", SPU_BLA)}
                onMouseMove={move} onMouseLeave={hide}
              />
              <text x={spuCx} y={spuY + spuH / 2 - 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff" pointerEvents="none">SPU</text>
              <text x={spuCx} y={spuY + spuH / 2 + 12} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.55)" pointerEvents="none">
                Statens pensjonsfond utland
              </text>

              {/* Handlingsregel under SPU */}
              <text x={spuCx} y={spuY + spuH + 16} textAnchor="middle" fontSize={9} fill="#999" fontStyle="italic">
                Uttak ~3 % av fondets verdi
              </text>

              {/* ===== BRO: SPU -> fondsuttak ===== */}
              <path d={broPath} fill="none" stroke="url(#bro-grad)" strokeWidth={Math.max(8, fondH * 0.4)} strokeLinecap="round" opacity={0.4} />
              <path d={broPath} fill="none" stroke={SPU_BLA} strokeWidth={1} opacity={0.15} strokeDasharray="4,4" />
            </svg>

            {drillOpen && (
              <>
                <div onClick={() => setDrillOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(12,16,69,0.08)", zIndex: 65, borderRadius: 12 }} />
                <DrillDown items={KONTANTSTROM_KILDER} total={KONTANTSTROM_TOTAL} onClose={() => setDrillOpen(false)} />
              </>
            )}
            <Tooltip info={tt} containerRef={ref} />
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center",
            padding: "16px 0 6px", marginTop: 16, borderTop: "1px solid #eae7e0",
          }}>
            {[
              { c: "linear-gradient(180deg, #0C1045, #839DD5)", l: "Utgifter (marine-skala)" },
              { c: "linear-gradient(180deg, #004D52, #5AB8AD)", l: "Ordinaere inntekter (teal-skala)" },
              { c: `repeating-linear-gradient(45deg, ${FOND_GUL}, ${FOND_GUL} 2px, ${FOND_GUL_LIGHT} 2px, ${FOND_GUL_LIGHT} 4px)`, l: "Uttak fra SPU" },
              { c: SPU_BLA, l: "SPU / petroleumsinntekter" },
            ].map((i) => (
              <div key={i.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#777" }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, background: i.c }} />{i.l}
              </div>
            ))}
          </div>

          {/* Forklaring */}
          <div style={{
            marginTop: 18, padding: "16px 22px", background: "#F7F8FC",
            borderRadius: 8, borderLeft: `3px solid ${SPU_BLA}`,
            fontSize: 14, lineHeight: 1.75, color: "#3a3a4a",
          }}>
            <strong style={{ color: "#0C1045" }}>Fondsmekanismen:</strong>{" "}
            Statsbudsjettet gaar alltid opp. Ordinaere inntekter (skatter og avgifter)
            dekker hoveddelen av utgiftene. Gapet -- det oljekorrigerte underskuddet paa{" "}
            {fmt(FONDSUTTAK)} mrd. kr -- fylles av uttaket fra Statens pensjonsfond utland.
            Samtidig stroemmer petroleumsinntektene ({fmt(KONTANTSTROM_TOTAL)} mrd. kr)
            direkte inn i fondet uten aa beroere budsjettet. Paa utgiftssiden gjelder{" "}
            <em>en krone er en krone</em> -- alle inntekter finansierer alle utgifter.
          </div>
        </div>
      </div>
    </div>
  );
}
