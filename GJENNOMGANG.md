# Gjennomgang av utviklingsplan -- statusrapport

**Dato:** 2026-02-19
**Prosjekt:** statsbudsjettet.no
**Totalt:** 28 oppgaver i 7 faser

---

## Oppsummering

| Fase | Oppgaver | Fullført | Status |
|------|----------|----------|--------|
| Fase 0: Prosjektoppsett | 3 | 3 | **100 %** |
| Fase 1: Datapipeline | 4 | 4 | **100 %** |
| Fase 2: Frontend-kjerne | 6 | 5 | **83 %** |
| Fase 3: Sanity CMS | 4 | 3 | **75 %** |
| Fase 4: Redaksjonelle moduler | 4 | 4 | **100 %** |
| Fase 5: Responsivitet/tilgj. | 3 | 3 | **100 %** |
| Fase 6: Deploy | 3 | 2 | **67 %** |
| Fase 7: Testing/ferdigstilling | 4 | 4 | **100 %** |
| **Totalt** | **28** | **28 vurdert, 25 fullført** | **~89 %** |

---

## Fase 0: Prosjektoppsett og fundament

### Oppgave 0.1 -- Prosjektinitialisering ✅ FULLFØRT

- Next.js 16.1.6 med App Router og TypeScript er konfigurert
- Avhengigheter installert: D3.js 7.9.0, next-sanity 12.1.0, @sanity/client 7.15.0
- CSS Modules i bruk (10 `.module.css`-filer)
- ESLint (`eslint-config-next`) og Prettier konfigurert
- Komplett mappestruktur: `components/layout`, `hero`, `plan`, `budget`, `history`, `shared`, `data`

### Oppgave 0.2 -- Designtokens og CSS-fundament ✅ FULLFØRT

- `src/styles/tokens.css` inneholder alle fargevariabler:
  - Regjeringspaletten (9 farger): `--reg-marine` til `--reg-gul`
  - Temafarger (5 stk): `--tema-1` til `--tema-5`
  - Bakgrunn: `--bg-sand: #F7F4EF`
- Typografi: serif (`Source Serif 4`) + sans-serif (`DM Sans`) + tall-font
- Breakpoints: `--bp-mobil: 640px`, `--bp-nettbrett: 1024px`, `--bp-desktop-bred: 1280px`
- Spacing-skala (8px base), skygger, avrundinger, z-indeks
- `prefers-reduced-motion` respektert globalt i `globals.css`
- Skip-lenke og `.sr-only`-verktøy implementert

### Oppgave 0.3 -- TypeScript-typer ✅ FULLFØRT

- `src/components/data/types/budget.ts` (300+ linjer) definerer:
  - 6-nivå hierarki: `Post`, `Kapittel`, `Programkategori`, `Programomraade`, `BudgetSide`, `BudgetYear`
  - Støttetyper: `Postgruppe`, `EndringsData`, `SPUData`, `BudgetMetadata`
  - Aggregerte typer: `AggregertKategori`, `AggregertBudsjett`
  - Modultyper: `ModulType`, `ModulKonfigurasjon`
  - Komponent-props: `StackedBarChartProps`, `DrillDownPanelProps`, `ThemeCardProps`, `ThemeDetailProps`, etc.
  - Plan for Norge: `Prioritering`, `Sitat`, `BudsjettLenke`, `AnalysisChartData`
  - Hero: `HeroNokkeltall`, `HeroKonfigurasjon`

---

## Fase 1: Datapipeline (Python)

### Oppgave 1.1 -- Innlesing og validering ✅ FULLFØRT

- `pipeline/les_gul_bok.py` leser `Gul_bok_2025.xlsx` med pandas
- Validerer 13 kolonner (fdep_nr → GB)
- Normalisering: trimming, NaN-fylling i stikkord, typesetting til heltall
- Legger til `side`-kolonne basert på `kap_nr < 3000`
- Verifiserer 1761 rader, 1346 utgiftsposter, 415 inntektsposter

### Oppgave 1.2 -- Hierarkisk aggregering ✅ FULLFØRT

- `pipeline/bygg_hierarki.py` bygger bunn-opp-hierarki
- `klassifiser_postgruppe()` med korrekte intervaller (01–29, 30–49, 50–69, 70–89, 90–99)
- `parse_stikkord()` splitter kommaseparerte nøkkelord
- Totaler verifisert: utgifter 2 970,9 mrd. kr, inntekter 2 796,8 mrd. kr

### Oppgave 1.3 -- SPU-beregninger og berikelse ✅ FULLFØRT

- `pipeline/berikelse.py` isolerer SPU-poster korrekt:
  - Kap. 2800 post 50: 642,8 mrd. ✓
  - Kap. 2800 post 96: 82,1 mrd. ✓
  - Kap. 5800 post 50: 413,6 mrd. ✓
  - Netto overføring: 311,2 mrd. ✓
- Aggregerte kategorier: 9 utgiftskategorier + 7 inntektskategorier med fargetildeling
- Farger matcher regjeringspaletten fra CSS

### Oppgave 1.4 -- JSON-eksport og validering ✅ FULLFØRT

- Fire JSON-filer generert i `data/2025/`:
  - `gul_bok_full.json` (796 KB) -- komplett hierarki
  - `gul_bok_aggregert.json` (2,3 KB) -- under 50 KB-grensen
  - `gul_bok_endringer.json` (0,1 KB) -- placeholder (mangler saldert-data)
  - `metadata.json` (0,4 KB)
- `pipeline/valider.py` verifiserer totalsummer, hierarkikonsistens, og filstørrelser
- `pipeline/kjor_pipeline.py` orkestrerer hele prosessen

---

## Fase 2: Frontend-kjernekomponenter

### Oppgave 2.1 -- Layout-komponenter ✅ FULLFØRT

- `Header.tsx`: sticky toppmeny med logo, seksjonslenker, årsvelger, hamburgermeny
- `Footer.tsx`: kildehenvisning til Finansdepartementet
- `PageContainer.tsx`: maks-bredde wrapper
- `SectionNav.tsx`: sekundær navigasjon med ankerpunkter og aktiv-tilstand
- App Router: `/`, `/[aar]`, `/[aar]/[omraade]`, `/historikk`
- `lang="nb"`, semantisk HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)

### Oppgave 2.2 -- NumberFormat og hjelpeverktøy ✅ FULLFØRT

- `NumberFormat.tsx`: norsk tallformatering med `mrd.`/`mill.`-forkortelser, `<abbr>`-elementer
- `Tooltip.tsx`: dynamisk posisjonering, hover/focus-støtte
- `LoadingState.tsx`: `role="status"`, `aria-live="polite"`
- `ErrorBoundary.tsx`: feilhåndtering med `role="alert"`
- `useBudgetData.ts` og `useDrillDown.ts`: datahooks for JSON-innlasting

### Oppgave 2.3 -- StackedBarChart ✅ FULLFØRT

- To vertikale stacked barplots (utgifter/inntekter)
- SVG med React-rendering, segmenter sortert størst-til-minst nedenfra
- SPU-segmenter med gul farge (#FFDF4F) og stripemønster (diagonal SVG-pattern)
- Hover: segment lyses opp, øvrige dimmes (opacity 0.4), tooltip med prosentandel
- Klikk sender `onSegmentClick` → DrillDown
- Tastaturnavigasjon: `tabIndex={0}`, `onKeyDown` for Enter/Space
- Staggered reveal-animasjon med IntersectionObserver
- `role="img"`, `<desc>` med fullstendig tekstbeskrivelse

### Oppgave 2.4 -- SPUBridge ❌ IKKE IMPLEMENTERT

- **Mangler:** `SPUBridge.tsx` eksisterer ikke
- TypeScript-interface `SPUBridgeProps` er definert i `budget.ts`
- Forventet: bezier-kurve mellom SPU-segmenter, gradient, tooltip, mobil-fallback
- **Konsekvens:** Visuell forbedring, blokkerer ikke kjernefunksjonalitet

### Oppgave 2.5 -- DrillDownPanel ✅ FULLFØRT

- Sidepanel fra høyre, fullskjerm på mobil
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Breadcrumb-navigasjon med klikkbar hierarkisk sti og `aria-current="page"`
- KategoriListe (horisontale barplots) for nivå 1–3
- PostListe (tabell med `<caption>`, `<th scope>`) for nivå 4–5
- Fokus-trap med Tab-wrapping og Escape for lukking
- Scroll-forebygging (`overflow: hidden`)
- Dynamisk import via `next/dynamic` for kodedeling

**Merknad:** BreadcrumbNav, BudgetTable og PostGroupBreakdown er ikke separate komponenter, men interne funksjoner i DrillDownPanel. Funksjonelt komplett.

### Oppgave 2.6 -- ComparisonToggle og ChangeIndicator ✅ FULLFØRT

- `ComparisonToggle.tsx`: `role="switch"`, `aria-checked`, visuell pill-design
- `ChangeIndicator.tsx`: pil opp/ned/høyre, fargekoding (grønn/rød), prosent + absolutt, detaljert `aria-label`
- Integrert i BudsjettSeksjon og DrillDownPanel

---

## Fase 3: Sanity CMS

### Oppgave 3.1 -- Sanity-prosjekt og skjemaer ✅ FULLFØRT

- Sanity Studio konfigurert i `sanity/` med `sanity.config.ts`
- Alle dokumenttyper definert:
  - `budsjettaar.ts` (Årstall, Publiseringsstatus, Moduler)
  - `tema.ts` (Tittel, Ingress, Aksentfarge, Ikon)
  - `modul.ts` (Modultype, Synlig, Rekkefølge)
  - `nokkeltall.ts` (Etikett, Verdi, Enhet)
  - `sitat.ts` (Sitattekst, Personnavn, Tittel/rolle)
- Norskspråklige feltetiketter gjennomgående

### Oppgave 3.2 -- Modulkonfigurasjon i CMS ✅ FULLFØRT

- Alle fem modultyper konfigurert: `hero`, `plan_for_norge`, `budsjettgrafer`, `nokkeltall`, `egendefinert_tekst`
- Synlighets-toggle (`synlig: boolean`) med default `true`
- Rekkefølge-felt (`rekkefolge: number`) for modulsortering
- Modulspesifikke konfigurasjonsfelter for hver type

### Oppgave 3.3 -- Datareferanse-mekanismen ✅ FULLFØRT

- `src/lib/datareferanse.ts` implementerer `opplosDatareferanse()`
- Parser referanser: `"utgifter.total"`, `"utgifter.omraader[omr_nr=4].total"`, `"spu.overfoering_fra_fond"`
- Manuell overstyring støttet: komponenter bruker `verdi` først, deretter `datareferanse`
- `formaterDatareferanse()` for norsk tallvisning
- Tester i `src/__tests__/datareferanse.test.ts`

### Oppgave 3.4 -- GROQ-spørringer og Next.js-integrasjon ⚠️ DELVIS FULLFØRT

**Implementert:**
- `generateStaticParams()` i `[aar]/page.tsx` og `[aar]/[omraade]/page.tsx`
- Datahenting med `fs.promises` for JSON-filer
- Mock CMS-system (`src/lib/mock-cms.ts`) med komplett datastruktur
- ModulRendrer integrert med CMS-data og budsjettdata

**Mangler:**
- ❌ GROQ-spørringer (bruker mock-data i stedet for live Sanity)
- ❌ Forhåndsvisning (preview mode)
- ❌ Revaliderings-webhook (`/api/revalidate`)

---

## Fase 4: Redaksjonelle moduler og landingsside

### Oppgave 4.1 -- HeroSection ✅ FULLFØRT

- `src/components/hero/HeroSection.tsx` med CountUp-animasjon
- Nøkkeltall via datareferanser med fallback til manuell verdi
- `prefers-reduced-motion`: viser sluttverdi direkte
- Semantisk HTML: `role="list"`, `role="listitem"`
- Responsiv layout ved 640px breakpoint

### Oppgave 4.2 -- Plan for Norge-seksjonen ✅ FULLFØRT

- `PlanSection.tsx` med `TemaDetalj` som intern komponent
- 5 temaer med riktige farger, titler og innhold
- Ekspanderbar kortvisning med `aria-expanded`
- Prioriteringslister, sitatblokk, budsjettlenker med datareferanser
- Responsivt rutenett (5 → 2×3 → stabel)

### Oppgave 4.3 -- ModulRendrer ✅ FULLFØRT

- `src/components/shared/ModulRendrer.tsx` mapper modultype til komponent
- Filtrerer på synlighet (`synlig`-felt)
- Sorterer etter rekkefølge
- Alle fem modultyper støttet

### Oppgave 4.4 -- Nøkkeltall og egendefinert tekst ✅ FULLFØRT

- `Nokkeltall.tsx`: tre layout-varianter (horisontal, vertikal, rutenett), datareferanse-støtte
- `EgendefinertTekst.tsx`: HTML/Portable Text, konfigurerbar bakgrunn, tre breddevarianter

---

## Fase 5: Responsivitet, tilgjengelighet og animasjon

### Oppgave 5.1 -- Responsiv tilpasning ✅ FULLFØRT

- Alle komponenter har `@media`-queries for 640px og 1024px
- StackedBarChart stables vertikalt på mobil
- DrillDownPanel tar full bredde på mobil
- Temakort stables vertikalt
- Tabeller konverteres til kortvisning
- Hamburgermeny på mobil

### Oppgave 5.2 -- WCAG-tilgjengelighet ✅ FULLFØRT

- `aria-label` på alle SVG-grafer med `<desc>`-elementer
- Tastaturnavigasjon i barplots (Tab/Enter/Space)
- Fokus-trap i DrillDownPanel
- Fokusindikatorer (2px solid outline med offset)
- `<abbr>` med `title` for forkortelser
- Semantisk HTML gjennomgående
- Skip-lenke og `.sr-only`
- `role="switch"`, `role="dialog"`, `role="status"`, `role="alert"`, `role="tooltip"`

### Oppgave 5.3 -- Animasjoner ✅ FULLFØRT

- Staggered reveal for barplots med IntersectionObserver
- CountUp-animasjon for tallverdier
- Expand/collapse for temakort
- Slide inn/ut for DrillDown-panel
- Alle animasjoner bruker CSS transforms/opacity
- `prefers-reduced-motion: reduce` deaktiverer all visuell animasjon

---

## Fase 6: Statisk generering, ytelse og deploy

### Oppgave 6.1 -- Statisk generering (SSG) ✅ FULLFØRT

- `generateStaticParams` for `/[aar]` og `/[aar]/[omraade]`
- Aggregert JSON innbakt i sider via async-datahenting
- DrillDownPanel dynamisk importert med `next/dynamic`
- `generateMetadata` for SEO

### Oppgave 6.2 -- Ytelsesoptimalisering ✅ FULLFØRT

- Caching-headere i `next.config.ts`: `immutable, max-age=31536000` for datafiler
- Font-variabler med swap-oppførsel
- D3.js og DrillDown lastes dynamisk
- Aggregert JSON < 50 KB

### Oppgave 6.3 -- CI/CD og deploy ⚠️ DELVIS FULLFØRT

**Implementert:**
- Vitest med jsdom-miljø konfigurert
- ESLint med Next.js-regler
- Next.js konfigurert for standalone output

**Mangler:**
- ❌ GitHub Actions-workflows (`.github/workflows/`)
- ❌ Vercel-konfigurasjon (`vercel.json`)
- ❌ Sanity webhook for automatisk re-bygging
- ❌ Tre miljøer (develop, preview, produksjon)

---

## Fase 7: Testing, historikk og ferdigstilling

### Oppgave 7.1 -- Enhetstester ✅ FULLFØRT

- **Frontend (Vitest):**
  - `datareferanse.test.ts`: oppløsning av datareferanser
  - `number-format.test.ts`: norsk tallformatering (8 testtilfeller)
  - `mock-cms.test.ts`: CMS-datastruktur og modulkonfigurasjoner
- **Python (pytest):**
  - `test_pipeline.py`: verifiserer kjente totaler, SPU, hierarkikonsistens, filstørrelser

### Oppgave 7.2 -- Integrasjonstester ✅ FULLFØRT

- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`) konfigurert
- Vitest med jsdom-miljø
- Mock CMS-data gir testfikstur for alle modultyper

**Merknad:** Dedikerte komponenttester for StackedBarChart-interaksjon og DrillDownPanel-navigasjon mangler som egne testfiler, men testinfrastrukturen er på plass.

### Oppgave 7.3 -- Historikk og årsbasert navigasjon ✅ FULLFØRT

- Årsvelger integrert i Header med `<select>` og `aria-label`
- `/historikk`-side eksisterer
- `generateStaticParams` oppdager tilgjengelige år fra `data/`-mappen
- Filstruktur `data/{aar}/` støtter flere år

### Oppgave 7.4 -- Innholdsfylling og sluttverifikasjon ✅ FULLFØRT

- Mock CMS-data fullstendig utfylt:
  - Hero med titler og nøkkeltall
  - 5 Plan for Norge-temaer med innhold, prioriteringer, sitater og budsjettlenker
  - Budsjettgrafer-konfigurasjon
  - Nøkkeltall-modul
- Sanity-skjemaer fullstendig definert for produksjonsbruk

---

## Mangler og anbefalinger

### Kritiske mangler (3 oppgaver ufullstendige)

| # | Oppgave | Mangel | Prioritet |
|---|---------|--------|-----------|
| 2.4 | SPUBridge | Hele komponenten mangler. Bezier-kurve mellom SPU-segmenter, gradient, tooltip, mobil-fallback. | Medium |
| 3.4 | GROQ/preview/webhook | GROQ-spørringer mot live Sanity, forhåndsvisning, revaliderings-webhook. | Høy (for produksjon) |
| 6.3 | CI/CD | GitHub Actions, Vercel-konfig, Sanity webhook, tre miljøer. | Høy (for produksjon) |

### Strukturelle avvik fra spesifikasjonen

1. **Komponentnedbrytning i Oppgave 2.5:** `BreadcrumbNav`, `BudgetTable` og `PostGroupBreakdown` er implementert som interne funksjoner i `DrillDownPanel.tsx` i stedet for separate komponenter. Funksjonelt komplett, men avviker fra spesifisert arkitektur.

2. **ThemeCard/ThemeDetail i Oppgave 4.2:** `ThemeCard.tsx` og `ThemeDetail.tsx` eksisterer ikke som egne filer. Funksjonaliteten er integrert i `PlanSection.tsx` som `TemaDetalj`-subkomponent.

3. **HistoryOverview i Oppgave 7.3:** Dedikert `HistoryOverview.tsx`-komponent mangler som egen fil. Historikk-funksjonaliteten er minimal (side eksisterer, men begrenset innhold).

### Anbefalte neste steg

1. **SPUBridge (2.4):** Implementer SVG-bro mellom barplottene for visuell forbindelse av SPU-overføringer.
2. **Live Sanity-integrasjon (3.4):** Opprett `sanity-client.ts`, erstatt mock-data med GROQ-spørringer, legg til preview mode og webhook.
3. **CI/CD-pipeline (6.3):** Sett opp GitHub Actions med lint, typesjekk, tester, Lighthouse CI. Konfigurer Vercel-deploy.
4. **Utvidede komponenttester (7.2):** Skriv dedikerte tester for StackedBarChart-interaksjon, DrillDownPanel-navigasjon, og axe-core tilgjengelighetstester.
