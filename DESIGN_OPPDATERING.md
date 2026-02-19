# DESIGN_OPPDATERING.md -- Revidert StackedBarChart og SPU-visualisering

> Instruksjoner for Claude Code. Dette dokumentet beskriver designbeslutninger
> tatt etter prototyping-økter og erstatter/oppdaterer relevante seksjoner i
> DESIGN.md (primært 4.1 StackedBarChart, 4.2 SPUBridge og 4.5 Fargeskjema).
> Referer til `konsept_a_v5.jsx` for fungerende React-prototype.

---

## 1. Overordnet konsept

Hovedvisualiseringen på landingssiden viser **tre visuelle soner** fra venstre til høyre:

```
┌──────────┐   ┌──────────┐   ┌────────────────────┐
│          │   │ Fondsutt.│   │                    │
│          │   ├──────────┤   │  Netto kontantstrøm │
│ UTGIFTER │   │          │   │  ┌────────────────┐ │
│          │   │ Ordinære │   │  │      SPU       │ │
│          │   │ inntekter│   │  └────────────────┘ │
│          │   │          │   │  Handlingsregelen   │
└──────────┘   └──────────┘   └────────────────────┘
```

**Sone 1 (venstre):** Stacked barplot -- utgifter. Alle budsjettformål stablet. Ingen SPU-segment. Prinsippet «en krone er en krone» gjelder: fondspenger øremerkes ikke.

**Sone 2 (midten):** Stacked barplot -- inntekter. Ordinære inntekter (skatter, avgifter) i bunn. Fondsuttaket som et eget segment øverst, visuelt adskilt med gult stripemønster og stiplet skillelinje. Inntektsbaren og utgiftsbaren har eksakt samme høyde -- budsjettet går alltid opp.

**Sone 3 (høyre):** SPU-mekanismen. To bokser i samme blåfarge:
- **Netto kontantstrøm fra petroleumsvirksomheten** (øverst): Viser 656 mrd. kr. Klikkbar for drill-down til kilder (petroleumsskatter, SDFI, Equinor-utbytte, andre).
- **SPU** (under): Statens pensjonsfond utland. Merket med handlingsregelen (~3 % av fondets verdi).
- Stiplet pil nedover fra kontantstrøm til SPU (pengene strømmer inn i fondet).
- Bezier-bro fra SPU til fondsuttak-segmentet på inntektsbaren.

### 1.1 Nøkkelinnsikter bak designet

**Budsjettet balanserer alltid.** Det oljekorrigerte underskuddet er per definisjon lik fondsuttaket. Utgiftsbar-høyde === inntektsbar-høyde. Visualiseringen må aldri gi inntrykk av at det er et «hull» som ikke er dekket.

**En krone er en krone.** Utgiftssiden har ingen SPU-markering. Det er ikke mulig å spore hvilke kroner som «kommer fra fondet» vs. skatter. Alle inntekter finansierer alle utgifter. SPU-overføring til fondet (kap. 2800) vises IKKE som et utgiftssegment -- det er en bokføringsmessig overføring som håndteres i SPU-sonen.

**Fondsuttaket hører hjemme på inntektssiden.** Det er en finansieringskilde som dekker det strukturelle underskuddet. Det er ikke en ordinær inntektskategori (skilles visuelt med stripemønster og farge), men det er korrekt plassert i inntektsbaren.

**Petroleumsinntektene berører aldri budsjettet direkte.** De strømmer inn i fondet. Det er fondets verdi (ikke årets petroleumsinntekter) som bestemmer uttaket. Denne separasjonen er hele poenget med fondsmekanismen og handlingsregelen.

---

## 2. Fargeskjema (erstatter DESIGN.md 4.5)

### 2.1 Monokromatiske skalaer per side

Den tidligere tilnærmingen med 9 distinkte farger fra regjeringspaletten erstattes med monokromatiske skalaer. Dette gir visuell ro og tydelig gruppeidentitet.

**Utgiftssiden -- marine-skala (8 nyanser, mørkest til lysest etter beløp):**

| Segment (sortert) | Hex |
|---|---|
| Folketrygden (størst) | `#0C1045` |
| Øvrige utgifter | `#181C62` |
| Kommuner og distrikter | `#263080` |
| Helse og omsorg | `#354A9E` |
| Næring og fiskeri | `#4A65B5` |
| Kunnskapsformål | `#6580C5` |
| Forsvar | `#839DD5` |
| Transport (minst) | `#A8BAE2` |

**Inntektssiden -- teal-skala (5 nyanser):**

| Segment (sortert) | Hex |
|---|---|
| Skatt på inntekt og formue | `#004D52` |
| Merverdiavgift | `#006B73` |
| Arbeidsgiveravgift | `#008286` |
| Trygdeavgift | `#2A9D8F` |
| Øvrige inntekter | `#5AB8AD` |

**SPU-sonen:**

| Element | Hex | Bruk |
|---|---|---|
| SPU-boks og kontantstrøm-boks | `#2C4F8A` | Fyllfarge for begge bokser |
| Fondsuttak (stripemønster base) | `#E8C840` | Gul i stripemønster |
| Fondsuttak (stripemønster lys) | `#F5E08A` | Lysere stripe-linje |
| Bro-gradient start | `#2C4F8A` | SPU-siden av broen |
| Bro-gradient slutt | `#E8C840` | Fonduttak-siden av broen |

### 2.2 Tekst på segmenter

Hvit tekst (`#fff`) på mørke segmenter (luminans < 140). Mørk marine (`#0C1045`) på lyse segmenter. Mønsteret gir automatisk WCAG AA-kontrast.

### 2.3 Fargeprinsipp

Gul/gull brukes KUN for fondsuttaket (stripemønster). SPU-blå brukes KUN for SPU-boksen og kontantstrøm-boksen. De to monokromatiske skalaene skiller utgifts- og inntektssiden visuelt uten å kreve mange ulike farger. Resultatet er tre distinkte visuelle grupper som umiddelbart kommuniserer «dette er utgifter», «dette er inntekter» og «dette er fondsmekanismen».

---

## 3. Komponentendringer

### 3.1 StackedBarChart (erstatter DESIGN.md 4.1)

**Props-endring:**

```typescript
interface StackedBarChartProps {
  utgifter: AggregertKategori[];
  inntekterOrdinaere: AggregertKategori[];   // ENDRET: kun ordinære
  fondsuttak: number;                         // NYTT: beregnet som utgifter_total - ord_inntekter_total
  spu: SPUData;
  visEndring: boolean;
  onSegmentClick: (side: 'utgift' | 'inntekt', id: string) => void;
  onKontantstromClick: () => void;            // NYTT: drill-down for kontantstrøm
  aar: number;
}
```

**Visuell oppbygning:**

- Utgiftsbar og inntektsbar side om side med ~80px gap
- Begge barer har eksakt samme høyde (budsjettet balanserer)
- Utgiftssegmenter: marine-skala, sortert størst (mørkest) nederst
- Inntektssegmenter: teal-skala, sortert størst (mørkest) nederst
- Fondsuttak-segment øverst på inntektsbaren med gult stripemønster
- Stiplet skillelinje mellom ordinære inntekter og fondsuttak
- 1px hvite skillelinjer mellom segmenter i begge barer
- Segmentetiketter: navn + beløp i mrd. kr INNE i segmentet (ingen prosent)
- Tynne alignment-linjer topp/bunn på tvers av begge barer

**Ingen SPU-segment på utgiftssiden.** Overføringen til fondet (kap. 2800) er en bokføringspost som håndteres i SPU-sonen, ikke som et utgiftsformål.

### 3.2 SPUBridge (erstatter DESIGN.md 4.2)

**Erstattes av tre elementer:**

1. **SPU-boks:** Rektangel i `#2C4F8A`, avrundede hjørner (8px), viser «SPU» og «Statens pensjonsfond utland». Plassert til høyre for inntektsbaren, vertikalt sentrert på fondsuttak-segmentet. Hover-tooltip med fondets verdi og handlingsregel-info.

2. **Kontantstrøm-boks:** Rektangel i `#2C4F8A` (samme farge), plassert OVER SPU-boksen. Viser «Netto kontantstrøm petroleum» og beløp (656 mrd. kr). Klikkbar -- åpner drill-down-panel med fordeling (petroleumsskatter, SDFI, Equinor-utbytte, andre petroleumsinntekter).

3. **Bro-kurve:** Bezier fra SPU-boks til fondsuttak-segmentet. Gradient fra SPU-blå til fondsuttak-gul. Bredde proporsjonal med fonduttaket. Stiplet overliggende linje for definisjon.

**Forbindelser:**
- Stiplet pil NEDOVER fra kontantstrøm-boks til SPU-boks (pengene strømmer inn)
- Bezier-bro VENSTRE fra SPU-boks til fondsuttak-segmentet (uttaket finansierer underskuddet)

### 3.3 DrillDown for kontantstrøm (NYTT)

Når bruker klikker kontantstrøm-boksen, åpnes et overlay-panel som viser:
- Tittel: «Netto kontantstrøm fra petroleumsvirksomheten»
- Totalbeløp
- Horisontale progress bars for hver kilde (petroleumsskatter, SDFI, Equinor-utbytte, andre)
- Lukk-knapp

Samme DrillDownPanel-komponent som brukes for utgifts-/inntektskategorier.

---

## 4. Interaksjoner

**Hover på segment:** Dimmer alle andre segmenter i SAMME bar (opacity 0.12-0.15). Viser tooltip med navn, beløp i mrd. kr, og prosentandel.

**Hover på SPU-boks:** Tooltip med fondets verdi, handlingsregel-info.

**Hover på kontantstrøm-boks:** Tooltip med totalbeløp og «Klikk for fordeling».

**Hover på fondsuttak-segment:** Tooltip forklarer at beløpet = det oljekorrigerte underskuddet.

**Klikk på kontantstrøm-boks:** Åpner drill-down-panel.

**Klikk på utgifts-/inntektssegment:** Åpner drill-down som før (DESIGN.md 4.3).

---

## 5. Responsivitet

**Desktop (>1024px):** Full layout som beskrevet.

**Tablet (768-1024px):** Barene smalere. SPU-sonen kan flyttes under barene.

**Mobil (<768px):** Barene stablet vertikalt (utgifter øverst, inntekter under). SPU-sonen erstattes med et forklarende tekstkort med nøkkeltall (fondsuttak, kontantstrøm, fondets verdi).

---

## 6. Forklaring under visualiseringen

En fast tekstboks under grafen med lys bakgrunn og blå venstre-border:

> **Fondsmekanismen:** Statsbudsjettet går alltid opp. Ordinære inntekter (skatter
> og avgifter) dekker hoveddelen av utgiftene. Gapet -- det oljekorrigerte
> underskuddet på [X] mrd. kr -- fylles av uttaket fra Statens pensjonsfond utland.
> Samtidig strømmer petroleumsinntektene ([Y] mrd. kr) direkte inn i fondet uten å
> berøre budsjettet. På utgiftssiden gjelder *en krone er en krone* -- alle inntekter
> finansierer alle utgifter.

Beløpene [X] og [Y] hentes fra datapipelinen via datareferanser.

---

## 7. Referanseimplementasjon

Se `konsept_a_v5.jsx` for fungerende React-prototype. Denne filen inneholder:
- Monokromatiske fargeskalaer
- Korrekt layout (utgifter | inntekter | SPU-sone)
- Fondsuttak som topplag på inntektsbaren
- SPU- og kontantstrøm-bokser med stiplet pil og bro
- Drill-down-panel for kontantstrøm
- Tooltip-system
- Forklaringstekst

Prototypen bruker mock-data. I produksjon hentes alle beløp fra `gul_bok_aggregert.json`.

---

## 8. Endringer i datapipelinen

`gul_bok_aggregert.json` trenger følgende justeringer:

```json
{
  "utgifter_aggregert": [
    // ENDRET: IKKE inkluder SPU-overføring (kap. 2800) her.
    // Kun reelle utgiftsformål.
    { "id": "folketrygden", "navn": "Folketrygden", "belop": 702000000000 },
    ...
  ],
  "inntekter_aggregert": [
    // ENDRET: KUN ordinære inntekter. IKKE inkluder SPU-overføring (kap. 5800).
    { "id": "skatt_person", "navn": "Skatt på inntekt og formue", "belop": 430000000000 },
    ...
  ],
  "spu": {
    // ENDRET: fondsuttak beregnes som utgifter_total - ordinære_inntekter_total
    "fondsuttak": 619200000000,
    "netto_kontantstrom": 656000000000,
    "kontantstrom_kilder": [
      { "id": "petskatt", "navn": "Petroleumsskatter", "belop": 381000000000 },
      { "id": "sdfi", "navn": "SDFI", "belop": 168000000000 },
      { "id": "equinor", "navn": "Equinor-utbytte", "belop": 38000000000 },
      { "id": "andre", "navn": "Andre petroleumsinnt.", "belop": 69000000000 }
    ]
  }
}
```

**Viktig:** `utgifter_aggregert` skal EKSKLUDERE programområde 34 (SPU-overføringer). Disse er bokføringsposter, ikke reelle utgiftsformål. Tilsvarende skal `inntekter_aggregert` EKSKLUDERE kap. 5800 (overføring fra fondet). Fondsuttaket beregnes som differansen.
