# DESIGN.md -- Design og frontend-arkitektur for statsbudsjettet.no

## 1. Designvisjon og estetisk retning

### 1.1 Overordnet konsept

Statsbudsjettet.no skal kommunisere regjeringens politiske prosjekt og budsjettallene på en måte som er tilgjengelig, troverdig og visuelt engasjerende. Estetikken skal være **editorial-institusjonell** -- en balanse mellom det autoritative uttrykket man forventer av en offentlig publikasjon og den visuelle klarheten og interaktiviteten man finner i moderne datajournalistikk (tenk FTs eller NRKs beste datavisualiseringer).

Designet skal unngå to ytterpunkter: det sterile og byråkratiske på den ene siden, og det overdesignede og uoffisielle på den andre. Det skal kjennes ut som et dokument fra regjeringen -- men et dokument som er laget for folk, ikke for Stortinget.

### 1.2 Estetiske prinsipper

**Typografi.** Sidene skal bruke en distinkt, lesbar serifskrift for overskrifter og brødtekst i redaksjonelle seksjoner (f.eks. *Merriweather*, *Source Serif Pro* eller *Lora*), kombinert med en ren grotesk for tallmateriale, grafer og navigasjon (f.eks. *DM Sans*, *Outfit* eller *Plus Jakarta Sans*). Tallene i grafene skal bruke tabular lining figures for optisk justering i kolonner.

**Fargepalett.** Nettstedet opererer med to adskilte fargesystemer som samvirker visuelt. Budsjettgrafer og tallvisualisering benytter den offisielle regjeringspaletten (se seksjon 4.5), som er forankret i en dyp marineblå (#181C62) med variasjoner i blåtoner, korallrødt og nøytrale nyanser, supplert med tilleggsfarger for diagrammer med mange verdier. «Plan for Norge»-seksjonen bruker egne aksentfarger per temaområde (se seksjon 5), som er hentet fra regjeringens publikasjon og gir visuell avgrensning mellom den politiske innrammingen og budsjettallene. Bakgrunnen er en varm sandtone (#F7F4EF) som gir luft og kontrast til begge palettsystemene.

**Romlig komposisjon.** Landingssiden bruker generøs negativ plass og lar de to stacked barplots dominere den visuelle opplevelsen over folden. Drill-down-visninger bruker en gradvis innsnevring av visuelt fokus -- fra bred oversikt til detaljerte tabeller -- som metafor for å «dykke ned» i tallene.

**Bevegelse.** Animasjoner brukes tilbakeholdent og funksjonelt: barplots bygges opp med staggered reveal ved lasting, drill-down-overganger bruker en smooth expand/collapse, og tallverdier animeres med count-up ved første visning. Ingen dekorativ animasjon.


## 2. Sidestruktur og navigasjon

### 2.1 Informasjonsarkitektur

Nettstedet er strukturert som én sammenhengende side med tydelige seksjoner, supplert med en dedikert historikkvisning. Brukerreisen er vertikal -- man scroller nedover for å bevege seg fra det politiske narrativet til tallene -- men med mulighet for å hoppe direkte til seksjoner via navigasjonen.

```
statsbudsjettet.no
├── Landingsside (én lang side)
│   ├── Hero: Årstall, tittel, nøkkeltall
│   ├── Seksjon A: «Regjeringens plan for Norge» (5 temaer)
│   ├── Seksjon B: Budsjettgrafer (stacked barplots, utgifter + inntekter)
│   └── Seksjon C: Nøkkeltall og sammendrag
├── Drill-down-visning (modal/panel)
│   ├── Programområdenivå
│   ├── Programkategorinivå
│   ├── Kapittelnivå
│   └── Postnivå
├── Sammenligningsvisning (endring fra saldert t-1)
└── Historikk
    ├── Velg budsjettår (dropdown/faner)
    └── Identisk struktur som landingssiden per år
```

### 2.2 Navigasjonsdesign

**Toppmeny (sticky).** En smal, fast header som inneholder: logoen til statsbudsjettet.no (venstre), horisontale lenker til hovedseksjonene (midten), og en årsvelger for historiske budsjetter (høyre). På mobil kollapses denne til en hamburger-meny med årsvelger synlig.

**Seksjon-navigasjon.** Når brukeren scroller forbi hero-seksjonen, vises en sekundær navigasjonslinje under headeren med ankerpunkter til de fem temaene og budsjettgrafene. Aktivt anker markeres visuelt. Denne linjen er kun synlig på desktop og nettbrett.

**Drill-down-navigasjon.** Ved klikk på et segment i barplottet åpnes en drill-down-panel (se seksjon 4.3). Panelet har en brødsmulesti (breadcrumb) øverst som viser hierarkisk posisjon: `Utgifter > Helse og omsorg > Spesialisthelsetjenester > Regionale helseforetak`. Hvert ledd i stien er klikkbart for å navigere opp i hierarkiet.

**Historikknavigasjon.** Årsvelgeren er en dropdown-meny med tilgjengelige budsjettår. Ved bytte av år oppdateres alt innhold, inkludert temaer og grafer, med dataene for det valgte året. URL-en oppdateres til `/2024`, `/2023` osv. for delingsvennlige lenker.

### 2.3 URL-struktur

```
/                           → Gjeldende budsjettår (landingsside)
/2025                       → Budsjettår 2025
/2025/forsvar               → Drill-down til programområde «Forsvar» 
/2025/forsvar/investeringer  → Videre drill-down til postgruppe
/historikk                  → Oversikt over alle tilgjengelige år
```


## 3. Komponentbibliotek

### 3.1 Oversikt over komponenter

Komponentbiblioteket er bygget i React med TypeScript. Alle komponenter bruker CSS-variabler for tema, er dokumentert med Storybook, og tilfredsstiller WCAG 2.1 AA-kravene (se seksjon 6).

```
components/
├── layout/
│   ├── Header.tsx
│   ├── SectionNav.tsx
│   ├── Footer.tsx
│   └── PageContainer.tsx
├── hero/
│   └── HeroSection.tsx
├── plan/
│   ├── PlanSection.tsx
│   ├── ThemeCard.tsx
│   ├── ThemeDetail.tsx
│   ├── QuoteBlock.tsx
│   └── AnalysisChart.tsx
├── budget/
│   ├── StackedBarChart.tsx
│   ├── BarSegment.tsx
│   ├── SPUBridge.tsx
│   ├── DrillDownPanel.tsx
│   ├── BreadcrumbNav.tsx
│   ├── BudgetTable.tsx
│   ├── ComparisonToggle.tsx
│   ├── ChangeIndicator.tsx
│   └── PostGroupBreakdown.tsx
├── history/
│   ├── YearSelector.tsx
│   └── HistoryOverview.tsx
├── shared/
│   ├── Tooltip.tsx
│   ├── NumberFormat.tsx
│   ├── LoadingState.tsx
│   ├── ErrorBoundary.tsx
│   └── AccessibleLabel.tsx
└── data/
    ├── hooks/
    │   ├── useBudgetData.ts
    │   ├── useDrillDown.ts
    │   └── useComparison.ts
    └── types/
        └── budget.ts
```

### 3.2 Datatyper (TypeScript)

Typesystemet speiler den hierarkiske datamodellen fra DATA.md:

```typescript
// budget.ts

export interface BudgetYear {
  budsjettaar: number;
  publisert: string;
  valuta: 'NOK';
  utgifter: BudgetSide;
  inntekter: BudgetSide;
  spu: SPUData;
  metadata: BudgetMetadata;
}

export interface BudgetSide {
  total: number;
  omraader: Programomraade[];
}

export interface Programomraade {
  omr_nr: number;
  navn: string;
  total: number;
  kategorier: Programkategori[];
}

export interface Programkategori {
  kat_nr: number;
  navn: string;
  total: number;
  kapitler: Kapittel[];
}

export interface Kapittel {
  kap_nr: number;
  navn: string;
  total: number;
  poster: Post[];
}

export interface Post {
  post_nr: number;
  upost_nr: number;
  navn: string;
  belop: number;
  postgruppe: Postgruppe;
  stikkord: string[];
  endring_fra_saldert: EndringsData | null;
}

export type Postgruppe =
  | 'driftsutgifter'
  | 'investeringer'
  | 'overforinger_statsregnskaper'
  | 'overforinger_private'
  | 'utlaan_statsgjeld';

export interface EndringsData {
  belop: number;
  saldert_forrige: number;
  endring_absolut: number;
  endring_prosent: number;
}

export interface SPUData {
  overfoering_til_fond: number;
  finansposter_til_fond: number;
  overfoering_fra_fond: number;
  netto_overfoering: number;
}

export interface AggregertKategori {
  id: string;
  navn: string;
  belop: number;
  farge: string;
  type?: 'spu';
}

export interface BudgetMetadata {
  kilde: string;
  saldert_budsjett_forrige: string;
}
```


## 4. Komponentspesifikasjoner

### 4.1 StackedBarChart -- Hovedvisualisering

Dette er den sentrale visuelle komponenten på landingssiden. Den viser to vertikale stacked barplots side om side: utgifter (venstre) og inntekter (høyre).

**Teknologivalg.** Komponenten bygges med D3.js for beregning og SVG for rendering, pakket inn i en React-komponent. D3 brukes til skalaberegning og datamanipulasjon, men selve DOM-manipulasjonen håndteres av React for å unngå konflikter.

**Visuell oppbygning.** Hver bar er en vertikal stabel der segmentene representerer aggregerte programområder (ca. 8--10 segmenter per side, jf. den aggregerte visningen i DATA.md avsnitt 4.2). Segmentene er sortert fra størst til minst, nedenfra og opp. Hvert segment har:

- En fargefylt bakgrunn med 1px skillelinje mellom segmenter.
- En etikett med kategorinavn og beløp i milliarder kroner, plassert inne i segmentet dersom det er stort nok, ellers som en ekstern etikett med ledelinje.
- En hover-tilstand som lyser opp segmentet, viser en tooltip med prosentandel og eventuell endringsdata, og demper de øvrige segmentene (opacity: 0.4).
- En klikkbar interaksjon som åpner drill-down-panelet for det aktuelle programområdet.

**SPU-håndtering.** Overføringer til og fra Statens pensjonsfond utland behandles visuelt som spesielle segmenter. «Overføring til SPU» (724,9 mrd. kr) vises som et eget segment øverst i utgiftsbarplottet med den gule tilleggsfargen (#FFDF4F) og et stripemønster (diagonale linjer) for å signalisere at dette er en annen type pengestrøm enn ordinære utgifter. «Overføring fra SPU» (413,6 mrd. kr) vises tilsvarende i inntektsbarplottet med samme farge og mønster. Mellom de to barsene tegnes en visuell bro (en kurvet linje eller en pil) fra SPU-inntektssegmentet til den nedre delen av utgiftsbarplottet, med en etikett som forklarer at denne overføringen finansierer det oljekorrigerte underskuddet. Denne broen er en sentral pedagogisk mekanisme og skal alltid være synlig.

**Props-interface:**

```typescript
interface StackedBarChartProps {
  utgifter: AggregertKategori[];
  inntekter: AggregertKategori[];
  spu: SPUData;
  visEndring: boolean;           // toggle for å vise endringsdata
  onSegmentClick: (side: 'utgift' | 'inntekt', id: string) => void;
  aar: number;
}
```

**Responsiv oppførsel.** På skjermer bredere enn 768px vises de to barsene side om side. På smalere skjermer stables de vertikalt (utgifter øverst, inntekter under), og SPU-broen erstattes med en tekstforklaring med tall.

### 4.2 SPUBridge -- Oljefondsbro

En dedikert komponent som tegner den visuelle forbindelsen mellom SPU-segmentene i de to barplottene. Denne rendres som en SVG-overlay over StackedBarChart.

```typescript
interface SPUBridgeProps {
  fraPosition: { x: number; y: number; height: number };
  tilPosition: { x: number; y: number; height: number };
  belop: number;
  nettoOverfoering: number;
}
```

Broen tegnes som en bezier-kurve med en gradient fra inntektsfargen til utgiftsfargen. Ved hover vises en tooltip som forklarer mekanismen: «Overføring fra oljefondet dekker det oljekorrigerte underskuddet på 413,6 mrd. kr.»

### 4.3 DrillDownPanel -- Hierarkisk navigasjon i budsjettdata

Når brukeren klikker på et segment i barplottet, åpnes et panel som viser neste nivå i hierarkiet. Panelet kan implementeres enten som en sidepanel (drawer) fra høyre på desktop, eller som en fullskjermsvisning på mobil.

**Hierarkinivåer og visninger.** Panelet støtter seks nivåer (jf. DATA.md avsnitt 2.1):

| Nivå | Viser | Visualisering |
|------|-------|---------------|
| 1: Side (utgift/inntekt) | Alle programområder | Horisontal barplot, sortert etter størrelse |
| 2: Programområde | Programkategorier innenfor området | Horisontal barplot + beskrivende tekst |
| 3: Programkategori | Kapitler innenfor kategorien | Horisontal barplot |
| 4: Kapittel | Poster innenfor kapittelet | Tabell med postgruppering |
| 5: Post | Detaljer om enkeltpost | Detaljkort med stikkord, beløp, endring |

Hvert nivå inkluderer:

- **Brødsmulesti** øverst for å navigere oppover i hierarkiet.
- **Overskrift** med navn og totalbeløp for det valgte elementet.
- **Postgruppe-fordeling** (der relevant): en liten donut-chart eller horisontal stabel som viser fordelingen mellom drift, investeringer, overføringer osv. (jf. DATA.md avsnitt 2.4).
- **Endringsindikator** som viser absolutt og prosentvis endring fra saldert budsjett forrige år (dersom toggle er aktivert).
- **Underordnede elementer** som en klikkbar liste eller barplot.

**Navigasjonsanimasjon.** Når brukeren klikker seg nedover i hierarkiet, glir det nye innholdet inn fra høyre med en fade-in. Når brukeren navigerer oppover (via brødsmulestien), glir innholdet ut til høyre. Dette gir en romlig metafor for å «gå dypere» og «gå tilbake».

```typescript
interface DrillDownPanelProps {
  data: Programomraade | Programkategori | Kapittel | Post;
  hierarkiSti: HierarkiNode[];   // for breadcrumb
  onNavigate: (node: HierarkiNode) => void;
  onClose: () => void;
  visEndring: boolean;
}

interface HierarkiNode {
  nivaa: 1 | 2 | 3 | 4 | 5;
  id: number;
  navn: string;
}
```

### 4.4 ComparisonToggle og ChangeIndicator -- Sammenligningsvisning

**ComparisonToggle** er en enkel toggle-bryter plassert over barplottene som lar brukeren slå av og på visning av endring fra saldert budsjett t-1. Når togglen er aktiv, endres visualiseringen:

- I barplottene vises en tynn linje (marker) innenfor hvert segment som markerer fjorårets nivå, slik at differansen blir tydelig.
- Ved siden av hvert segmentnavn vises en **ChangeIndicator**-komponent: en pil opp (grønn) eller ned (rød) med prosentvis endring. For tilgjengelighet brukes også tekst ("+13,3 %" eller "-2,1 %") og ikke kun farge.

**ChangeIndicator-komponent:**

```typescript
interface ChangeIndicatorProps {
  endring_absolut: number;
  endring_prosent: number;
  compact?: boolean;            // kun prosenttall, for bruk i trange kontekster
}
```

Komponenten rendrer en `<span>` med `aria-label` som beskriver endringen i klarspråk, f.eks. «Økning på 12,9 milliarder kroner, tilsvarende 13,3 prosent fra saldert budsjett 2024.»

Sammenligningsvisningen forutsetter at `endring_fra_saldert`-feltet er populert i JSON-dataene (jf. DATA.md avsnitt 4.3). Dersom feltet er `null` (f.eks. for nye poster), vises teksten «Ny post» i stedet for en endringsindikator.

### 4.5 Fargeskjema for budsjettgrafer

Budsjettgrafer og all tallvisualisering bruker den offisielle regjeringspaletten. Paletten består av fem hovedfarger og fire tilleggsfarger, og gir til sammen ni distinkte verdier som dekker behovet for stacked barplots med opptil ni segmenter. Fargene er definert som CSS-variabler.

#### 4.5.1 Offisiell palett -- hovedfarger

| CSS-variabel | Beskrivelse | Hex | Pantone |
|-------------|-------------|-----|---------|
| `--reg-marine` | Mørk marineblå (primær) | #181C62 | 2758 C |
| `--reg-blaa` | Mellomblå | #4156A6 | 7455 C |
| `--reg-lyseblaa` | Lys mellomblå | #5B91CC | 659 C |
| `--reg-korall` | Korallrød | #F15D61 | 178C |
| `--reg-lysgraa` | Lys grå (nøytral) | #EDEDEE | 7541 C |

#### 4.5.2 Offisiell palett -- tilleggsfarger

Tilleggsfargene supplerer hovedpaletten der det er behov for et større fargespekter, primært i diagrammer med mange verdier og informasjonsgrafikk der man ønsker kontrast til hovedpaletten.

| CSS-variabel | Beskrivelse | Hex | Pantone |
|-------------|-------------|-----|---------|
| `--reg-lilla` | Lilla | #97499C | Purple C |
| `--reg-teal` | Mørk teal | #008286 | 562 C |
| `--reg-mint` | Lys mint/teal | #60C3AD | 338 C |
| `--reg-gul` | Gul | #FFDF4F | 113 C |

#### 4.5.3 Fargetildeling -- utgiftssiden

For utgiftssiden i stacked barplottet tildeles fargene slik at de største segmentene får de mest fremtredende fargene fra hovedpaletten, mens mindre segmenter bruker tilleggsfarger. SPU-overføringen skilles ut med den gule tilleggsfargen og et diagonalt stripemønster for å signalisere at dette er en annen type pengestrøm.

| Kategori | CSS-variabel | Hex |
|----------|-------------|-----|
| Folketrygden | `--reg-marine` | #181C62 |
| Kommuner og distrikter | `--reg-blaa` | #4156A6 |
| Helse og omsorg | `--reg-korall` | #F15D61 |
| Næring og fiskeri | `--reg-teal` | #008286 |
| Kunnskapsformål | `--reg-lyseblaa` | #5B91CC |
| Forsvar | `--reg-lilla` | #97499C |
| Transport | `--reg-mint` | #60C3AD |
| Øvrige utgifter | `--reg-lysgraa` | #EDEDEE |
| SPU-overføring | `--reg-gul` | #FFDF4F |

#### 4.5.4 Fargetildeling -- inntektssiden

Inntektssiden gjenbruker samme palett, men med en annen tildelingsrekkefølge for å unngå at samme farge representerer ulike begreper i de to barsene som vises side om side.

| Kategori | CSS-variabel | Hex |
|----------|-------------|-----|
| Skatt på inntekt og formue | `--reg-blaa` | #4156A6 |
| Merverdiavgift | `--reg-korall` | #F15D61 |
| Petroleumsskatter | `--reg-marine` | #181C62 |
| Arbeidsgiveravgift | `--reg-teal` | #008286 |
| Trygdeavgift | `--reg-lilla` | #97499C |
| Øvrige inntekter | `--reg-lysgraa` | #EDEDEE |
| SPU-overføring | `--reg-gul` | #FFDF4F |

#### 4.5.5 Retningslinjer for fargebruk

Noen prinsipielle retningslinjer for bruken av denne paletten i budsjettvisningene. For det første brukes `--reg-gul` (#FFDF4F) konsekvent og utelukkende for SPU-overføringer på tvers av alle visninger (barplot, drill-down, sammenligningsvisning). For det andre brukes `--reg-lysgraa` (#EDEDEE) kun for restkategorier («øvrige») og aldri for primærkategorier, da den har lav visuell fremtredenhet. For det tredje skal all tekst som legges oppå segmenter med lyse farger (#EDEDEE, #FFDF4F, #60C3AD) bruke mørk tekst (#181C62), mens tekst oppå mørke segmenter (#181C62, #4156A6, #008286, #97499C) bruker hvit tekst (#FFFFFF). Dette sikrer WCAG AA-kontrast i alle tilfeller. For det fjerde skal fargetildelingen i drill-down-visninger følge samme kategori-farge-kobling som i barplottet -- et segment som er blått i oversiktsvisningen forblir blått når man klikker seg inn i det.

### 4.6 BudgetTable -- Tabellvisning for detaljerte poster

På de nederste nivåene i drill-down (kapittel- og postnivå) brukes en tabell i stedet for grafer. Tabellen viser alle poster med kolonner for postnummer, postnavn, beløp, postgruppe, stikkord og eventuell endring.

```typescript
interface BudgetTableProps {
  poster: Post[];
  visEndring: boolean;
  sortering: 'belop' | 'postnr' | 'endring';
  sorteringsretning: 'asc' | 'desc';
  onSorteringsEndring: (felt: string) => void;
}
```

Tabellen er responsiv: på skjermer smalere enn 640px kollapses den til en kortvisning der hver post vises som et eget kort med nøkkelfelter stablet vertikalt.

### 4.7 NumberFormat -- Tallformatering

Alle tall i grensesnittet formateres konsistent via denne hjelpekomponenten. Beløp over 1 milliard vises som «X,X mrd. kr», beløp mellom 1 million og 1 milliard som «X,X mill. kr», og beløp under 1 million som «X XXX kr» med mellomrom som tusenskilletegn (norsk standard). Komponenten tar en `precision`-prop for å kontrollere antall desimaler.

```typescript
interface NumberFormatProps {
  belop: number;
  precision?: number;       // standard: 1
  visValuta?: boolean;      // standard: true
  somEndring?: boolean;     // viser +/- fortegn
}
```


## 5. «Plan for Norge»-seksjonen

### 5.1 Struktur

Denne seksjonen presenterer regjeringens fem temaområder fra «Regjeringens plan for Norge 2025--2029». Den ligger øverst på landingssiden, rett under hero, og fungerer som den politiske innrammingen av budsjettet.

De fem temaene er:

| Nr | Tema | Aksentfarge | Hex |
|----|------|-------------|-----|
| 1 | Trygghet for økonomien | Dempet teal | #2A7F7F |
| 2 | Trygghet for arbeids- og næringslivet | Varm lilla | #7B5EA7 |
| 3 | Trygghet for barn og unge | Sennepsgul | #C99A2E |
| 4 | Trygghet for helsa | Varm rød | #B84C3C |
| 5 | Trygghet for landet | Mørk gull | #8B7530 |

### 5.2 ThemeCard -- Temakort

Hvert tema vises initialt som et kompakt kort i et horisontalt rutenett (fem kort på én rad på desktop, to-og-to med siste sentrert på nettbrett, stablet vertikalt på mobil). Kortet inneholder:

- Et farget ikon eller grafisk element i temaets aksentfarge.
- Temaets tittel (f.eks. «Trygghet for økonomien»).
- En kort ingress (1--2 setninger).
- En «Les mer»-lenke som ekspanderer kortet til en ThemeDetail-visning.

```typescript
interface ThemeCardProps {
  tema: {
    nr: number;
    tittel: string;
    ingress: string;
    farge: string;
    ikon: string;
  };
  onExpand: (nr: number) => void;
  erAktiv: boolean;
}
```

### 5.3 ThemeDetail -- Utvidet temavisning

Når brukeren klikker «Les mer» på et temakort, ekspanderes visningen til å vise det fulle innholdet for temaet. Ekspanderingen skjer som en smooth animasjon der kortet vokser til full bredde og de øvrige kortene skyves ned. Innholdet i den utvidede visningen:

**Problembeskrivelse.** En kort analyse av utfordringsbildet innenfor temaet, eventuelt supplert med en enkel graf eller nøkkeltall (f.eks. «Sysselsettingsandel: 80,2 %» for økonomitemaet). Grafen rendres av AnalysisChart-komponenten.

**Prioriteringer.** En liste over regjeringens prioriteringer innenfor temaet, hentet direkte fra planen. Hver prioritering er et kort avsnitt med tittel og beskrivelse.

**Sitat.** Et QuoteBlock-komponent med sitat fra relevant statsråd, presentert med navn, tittel og bilde (dersom tilgjengelig).

**Kobling til budsjettet.** Nederst i den utvidede visningen vises 2--3 relevante budsjettområder med beløp og en lenke som scroller ned til budsjettgrafene og åpner relevant drill-down. For eksempel kan «Trygghet for landet» lenke til programområde 4 (Militært forsvar, 110,1 mrd. kr).

```typescript
interface ThemeDetailProps {
  tema: {
    nr: number;
    tittel: string;
    ingress: string;
    farge: string;
    problembeskrivelse: string;
    analysegraf?: AnalysisChartData;
    prioriteringer: Prioritering[];
    sitat?: Sitat;
    budsjettlenker: BudsjettLenke[];
  };
  onClose: () => void;
  onBudsjettNavigasjon: (omrNr: number) => void;
}

interface Prioritering {
  tittel: string;
  beskrivelse: string;
}

interface Sitat {
  tekst: string;
  person: string;
  tittel: string;
  bildeSrc?: string;
}

interface BudsjettLenke {
  omrNr: number;
  navn: string;
  belop: number;
}
```

### 5.4 QuoteBlock -- Sitatkomponent

Et visuelt fremhevet sitat med stor anførselstegn-dekorasjon, tekst i kursiv serifskrift, og navn/tittel på avsender under. Bakgrunnen har en subtil gradient i temaets aksentfarge (10 % opacity).

### 5.5 AnalysisChart -- Analysegraf

En enkel, fokusert graf som illustrerer ett nøkkeltall eller én trend innenfor et temaområde. Kan rendres som linjegraf (for tidsserier), barplot (for sammenligning) eller et stort nøkkeltall med kontekst. Bygges med D3.js, men holdes visuelt enkel -- maksimalt to akser, ingen 3D, ingen unødvendig dekorasjon.


## 6. Responsivitet og tilgjengelighet

### 6.1 Responsiv strategi

Designet følger en mobile-first-tilnærming med tre hovedbrekkpunkter:

| Brekkpunkt | Bredde | Målgruppe |
|------------|--------|-----------|
| Mobil | < 640px | Telefoner |
| Nettbrett | 640px -- 1024px | Nettbrett, små laptoper |
| Desktop | > 1024px | Laptoper, skjermer |

**Mobiltilpasninger:**

- Stacked barplots stables vertikalt (utgifter over inntekter).
- SPU-broen erstattes med en forklarende tekstboks mellom de to grafene.
- Drill-down-panelet tar full skjermbredde.
- ThemeCards stables vertikalt (én per rad).
- Tabeller kollapses til kortvisning.
- Navigasjonsmeny kollapses til hamburger.
- Tallformateringen kan bruke kortere format (f.eks. «110 mrd.» uten «kr»).

**Nettbretttilpasninger:**

- Stacked barplots vises side om side, men med redusert bredde.
- ThemeCards vises i et 2x3-rutenett.
- Drill-down åpnes som overlay (ikke sidepanel).

### 6.2 WCAG 2.1 AA-krav

Nettstedet skal tilfredsstille alle WCAG 2.1 AA-krav. Følgende er de mest relevante kravene gitt komponentsammensetningen:

**Perseptibilitet (prinsipp 1).**

- Alle bilder og ikoner har `alt`-tekst.
- Alle grafer har en tilgjengelig alternativbeskrivelse via `aria-label` på SVG-elementet og en skjult tekstoppsummering (`sr-only`) som beskriver hovedtrekk i tallene.
- Fargekontrast: alle tekst-bakgrunn-kombinasjoner har minimum 4.5:1 kontrastforhold (AA). Stor tekst (> 18pt) har minimum 3:1.
- Informasjon formidles aldri kun gjennom farge. Alle endringsindikorer bruker pil-ikon og tekst i tillegg til farge.

**Operabilitet (prinsipp 2).**

- All funksjonalitet er tilgjengelig med tastatur. Segmenter i barplottene kan navigeres med Tab og aktiveres med Enter/Space.
- Fokusrekkefølge følger visuell rekkefølge.
- Drill-down-panelet har fokus-trap slik at Tab-navigasjon holdes innenfor panelet når det er åpent, og fokus returneres til utløsende element ved lukking.
- Alle interaktive elementer har synlige fokusindikatorer (outline med 2px offset i aksentfarge).
- Animasjoner respekterer `prefers-reduced-motion`. Dersom brukeren har satt denne innstillingen, deaktiveres alle animasjoner bortsett fra essensielle overganger (som drill-down-åpning, som i stedet skjer umiddelbart).

**Forståelighet (prinsipp 3).**

- Sidespråk er satt til `lang="nb"` (norsk bokmål).
- Forkortelser som «mrd.» og «mill.» er pakket i `<abbr>`-elementer med `title`-attributt.
- Feilmeldinger (f.eks. ved datalastingsfeil) er tydelige og beskrivende.

**Robusthet (prinsipp 4).**

- Alle komponenter bruker semantisk HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<table>`, `<th>`, `<td>`.
- SVG-grafer bruker `role="img"` med `aria-label`.
- Tabeller bruker `<caption>` og `scope`-attributter på header-celler.
- Drill-down-panelet bruker `role="dialog"` med `aria-modal="true"` og `aria-labelledby`.

### 6.3 Ytelse

- JSON-data for aggregert visning lastes ved sideinnlasting (< 50 KB).
- Full hierarkisk data lastes on-demand ved drill-down (lazy loading per programområde).
- Bilder bruker `<picture>`-elementet med WebP og fallback til JPEG.
- Grafer rendres med SVG for skarphet på alle oppløsninger.
- Målsetting: Lighthouse-score over 90 for Performance, Accessibility og Best Practices.


## 7. Publiseringsverktøy og modulbasert arkitektur

### 7.1 CMS-integrasjon

For å tilfredsstille kravet om at innhold og moduler skal kunne endres uten frontend-deploy (jf. Brukerbehov-dokumentet), bygges siden med et headless CMS (f.eks. Sanity eller Strapi) som datakilde for redaksjonelt innhold. Budsjettdataene hentes fra statiske JSON-filer generert av datapipelinen (jf. DATA.md avsnitt 6).

**Redigerbare elementer i CMS:**

- Hero-tekst og nøkkeltall.
- Innhold i ThemeDetail (problembeskrivelse, prioriteringer, sitater, bilder).
- Rekkefølge og synlighet av moduler på landingssiden.
- Metadata (publiseringsdato, kildehenvisninger).

**Ikke-redigerbare elementer (styrt av datapipeline):**

- Budsjettall og hierarki.
- Endringsdata mot saldert budsjett t-1.
- SPU-beregninger.

### 7.2 Modularkitektur

Landingssiden er bygget opp av moduler som kan skjules, omorganiseres eller konfigureres i CMS. Hver modul har en `type`-identifikator og et konfigurasjonsobjekt:

```typescript
type ModulType =
  | 'hero'
  | 'plan_for_norge'
  | 'budsjettgrafer'
  | 'nokkeltall'
  | 'egendefinert_tekst';

interface ModulKonfigurasjon {
  type: ModulType;
  synlig: boolean;
  rekkefølge: number;
  konfigurasjon: Record<string, unknown>;
}
```

Denne arkitekturen gjør det mulig å tilpasse siden for hvert budsjettår uten kodeendringer. For eksempel kan man for et gitt år velge å fremheve et ekstra nøkkeltall, endre rekkefølgen på temaene eller legge til en egendefinert tekstboks med tilleggsinformasjon.


## 8. Teknisk stack

| Lag | Teknologi | Begrunnelse |
|-----|-----------|-------------|
| Rammeverk | Next.js (App Router) | SSR/SSG for ytelse og SEO, filbasert routing |
| Språk | TypeScript | Typesikkerhet for kompleks datamodell |
| Grafer | D3.js + React | Fleksibel, tilgjengelig datavisualisering |
| Styling | CSS Modules + CSS-variabler | Scoped styling, enkel temaendring |
| CMS | Sanity (eller tilsvarende headless CMS) | Norskspråklig støtte, fleksibelt innholdsskjema |
| Hosting | Vercel eller sky.regjeringen.no | Rask deploy, CDN-distribusjon |
| Testing | Vitest + Testing Library + axe-core | Enhets-, integrasjons- og tilgjengelighetstester |
| Dokumentasjon | Storybook | Visuell komponentdokumentasjon |

## 9. Åpne spørsmål og videre arbeid

Følgende spørsmål bør avklares i designfasen:

- Skal historiske budsjetter ha samme temamoduler som gjeldende budsjett, eller kun tallvisningene?
- Hvordan skal strukturendringer mellom år håndteres visuelt (jf. DATA.md avsnitt 5.2 om departements-mapping)?
- Skal det tilbys nedlasting av data i CSV/Excel-format fra drill-down-visningene?
- Hvilke makroøkonomiske nøkkeltall bør vises som kontekst (BNP, oljepris, sysselsetting)?
- Skal det utvikles en egen søkefunksjon for å finne spesifikke kapitler eller poster?
- Avklaring av domene: statsbudsjettet.no som frittstående, eller som undersider av regjeringen.no?
