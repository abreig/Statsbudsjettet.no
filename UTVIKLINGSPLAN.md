# Utviklingsplan for statsbudsjettet.no -- Claude Code

## Overordnet strategi

Planen er organisert i **7 faser** med til sammen **28 oppgaver**. Fasene bygger på hverandre sekvensielt, men innenfor hver fase kan oppgavene i stor grad kjøres parallelt. Målet er å komme til en fungerende ende-til-ende-løsning så raskt som mulig, og deretter iterere på kvalitet, design og tilleggsfunksjonalitet.

Hver oppgave er dimensjonert for én Claude Code-sesjon (typisk 15--45 minutter effektiv arbeidstid). Oppgaver som er merket med **(kritisk sti)** blokkerer etterfølgende faser og bør prioriteres.

---

## Fase 0: Prosjektoppsett og fundament

**Mål:** Et fungerende Next.js-prosjekt med TypeScript, mappestruktur og grunnleggende konfigurasjon på plass.

### Oppgave 0.1 -- Prosjektinitialisering **(kritisk sti)**

Sett opp Next.js med App Router og TypeScript. Installer avhengigheter: D3.js, Sanity-klient (`next-sanity`, `@sanity/client`). Konfigurer CSS Modules med CSS-variabler. Sett opp ESLint, Prettier og grunnleggende `tsconfig.json`.

**Akseptansekriterium:** `npm run dev` starter uten feil. Mappestrukturen fra DESIGN.md seksjon 3.1 eksisterer (components/layout, hero, plan, budget, history, shared, data).

### Oppgave 0.2 -- Designtokens og CSS-fundament

Opprett CSS-variabler for hele fargepaletten (regjeringspalett: `--reg-marine` #181C62, `--reg-blaa` #4156A6, osv. + temafarger fra Plan for Norge). Definer typografi-tokens (serifskrift for redaksjonelt, sans-serif for tall/grafer). Sett opp bakgrunnsfarge #F7F4EF, breakpoints (mobil <640px, nettbrett 640--1024px, desktop >1024px), spacing-skala og animasjonsvariabler som respekterer `prefers-reduced-motion`.

**Akseptansekriterium:** En CSS-variabelfil som dekker alle farger, fonter og breakpoints fra DESIGN.md seksjon 1.2, 4.5 og 5.1.

### Oppgave 0.3 -- TypeScript-typer for datamodellen **(kritisk sti)**

Implementer hele typehierarkiet fra DESIGN.md seksjon 3.2 i `components/data/types/budget.ts`: `BudgetYear`, `BudgetSide`, `Programomraade`, `Programkategori`, `Kapittel`, `Post`, `Postgruppe`, `EndringsData`, `SPUData`, `AggregertKategori`, `BudgetMetadata`. Inkluder også typer for modulkonfigurasjon (`ModulType`, `ModulKonfigurasjon`) og CMS-relaterte typer (`ThemeCardProps`, `ThemeDetailProps`, `DrillDownPanelProps`, etc.).

**Akseptansekriterium:** Alle interfaces og typer fra DESIGN.md og ARCHITECTURE.md er definert. Filen kompilerer uten feil.

---

## Fase 1: Datapipeline (Python)

**Mål:** En fungerende Python-pipeline som leser Gul bok 2025.xlsx og produserer fire validerte JSON-filer.

### Oppgave 1.1 -- Innlesing og validering **(kritisk sti)**

Skriv Python-skript (`pipeline/les_gul_bok.py`) som leser Excel-filen med pandas/openpyxl. Implementer kolonnevalidering (13 kolonner: fdep_nr, fdep_navn, omr_nr, kat_nr, omr_navn, kat_navn, kap_nr, post_nr, upost_nr, kap_navn, post_navn, stikkord, GB). Legg til normaliseringssteg: trimming av tekstverdier, fylling av NaN i stikkord-feltet, typesetting. Legg til `side`-kolonne basert på kap_nr < 3000.

**Input:** `Gul_bok_2025.xlsx`
**Akseptansekriterium:** DataFrame med 1761 rader, korrekte kolonnetyper, ingen uventede null-verdier i nøkkelfelt.

### Oppgave 1.2 -- Hierarkisk aggregering **(kritisk sti)**

Implementer `bygg_hierarki()` som grupperer bunn-opp: poster -> kapitler -> programkategorier -> programområder -> side (utgift/inntekt). Implementer `klassifiser_postgruppe()` (01--29: driftsutgifter, 30--49: investeringer, 50--69: overføringer_statsregnskaper, 70--89: overføringer_private, 90--99: utlaan_statsgjeld). Implementer `parse_stikkord()` for å splitte stikkord-feltet.

**Akseptansekriterium:** Hierarkisk dict med korrekte totaler. Utgifter summerer til ca. 2 970,9 mrd. kr, inntekter til ca. 2 796,8 mrd. kr.

### Oppgave 1.3 -- SPU-beregninger og berikelse

Isoler SPU-poster (omr_nr 34): kap. 2800 post 50 (642,8 mrd), kap. 2800 post 96 (82,1 mrd), kap. 5800 post 50 (413,6 mrd). Beregn netto overføring. Generer `spu`-objektet i JSON-strukturen. Generer aggregert datasett for landingssiden (`gul_bok_aggregert.json`) med forenklede kategorier sortert etter størrelse.

**Akseptansekriterium:** SPU-nøkkeltall stemmer med DATA.md seksjon 3.1. Aggregert datasett har 8--10 kategorier per side.

### Oppgave 1.4 -- JSON-eksport og validering **(kritisk sti)**

Eksporter fire JSON-filer til `data/2025/`: `gul_bok_full.json`, `gul_bok_aggregert.json`, `metadata.json`, og en placeholder for `gul_bok_endringer.json` (uten saldert-data genereres et tomt endringsdatasett). Implementer valideringsskript som verifiserer totalsummer, unike hierarkinøkler, og JSON-strukturens integritet.

**Akseptansekriterium:** Fire velformaterte JSON-filer. Valideringsskript bekrefter utgiftstotal og inntektstotal innenfor avrundingsmargin.

---

## Fase 2: Frontend-kjernekomponenter

**Mål:** De viktigste visuelle komponentene fungerer med ekte data fra JSON-filene.

### Oppgave 2.1 -- Layout-komponenter og sidestruktur

Implementer `Header.tsx` (sticky toppmeny med logo, seksjonslenker, årsvelger), `Footer.tsx`, `PageContainer.tsx`, og `SectionNav.tsx` (sekundær navigasjon med ankerpunkter). Sett opp App Router med routes: `/`, `/[aar]`, `/[aar]/[omraade]`, `/historikk`. Implementer `lang="nb"` og semantisk HTML (`<nav>`, `<main>`, `<section>`).

**Akseptansekriterium:** Navigasjon mellom ruter fungerer. Layout er responsiv med hamburger-meny på mobil.

### Oppgave 2.2 -- NumberFormat og delte hjelpeverktøy

Implementer `NumberFormat.tsx` med norsk tallformatering (mellomrom som tusenskilletegn, mrd./mill. forkortelser, `<abbr>`-elementer). Implementer `Tooltip.tsx`, `LoadingState.tsx`, `ErrorBoundary.tsx`, og `AccessibleLabel.tsx`. Implementer data-hooks: `useBudgetData.ts` som leser JSON fra filsystemet via `getStaticProps`.

**Akseptansekriterium:** Tallformatering fungerer korrekt for alle størrelsesordener. Hooks laster data uten feil.

### Oppgave 2.3 -- StackedBarChart (hovedvisualisering) **(kritisk sti)**

Implementer `StackedBarChart.tsx` med D3.js + React: to vertikale stacked barplots (utgifter venstre, inntekter høyre). Segmenter sortert fra størst til minst, nedenfra og opp. Farger fra regjeringspaletten iht. DESIGN.md seksjon 4.5.3/4.5.4. SPU-segmenter med gul farge (#FFDF4F) og stripemønster. Hover-tilstand (lyser opp segment, dimmer øvrige med opacity 0.4, tooltip med prosentandel). Klikk-interaksjon som sender `onSegmentClick`. Etiketter inne i store segmenter, eksterne med ledelinje for små segmenter.

**Akseptansekriterium:** To barplots rendres med ekte data fra `gul_bok_aggregert.json`. Hover og klikk fungerer. WCAG: tastaturnavigasjon med Tab/Enter.

### Oppgave 2.4 -- SPUBridge (oljefondsbro)

Implementer `SPUBridge.tsx` som SVG-overlay: bezier-kurve mellom SPU-inntektssegment og utgiftssegment. Gradient fra inntektsfarge til utgiftsfarge. Tooltip ved hover som forklarer overføringsmekanismen. Erstatt med tekstforklaring på mobil (<768px).

**Akseptansekriterium:** Broen tegnes korrekt mellom riktige segmenter. Responsiv fallback fungerer.

### Oppgave 2.5 -- DrillDownPanel med hierarkisk navigasjon **(kritisk sti)**

Implementer `DrillDownPanel.tsx`: sidepanel (drawer) fra høyre på desktop, fullskjerm på mobil. `BreadcrumbNav.tsx` med klikkbar hierarkisk sti. Horisontal barplot for nivå 1--3. `BudgetTable.tsx` for nivå 4--5 med sorterbare kolonner (postnr, navn, beløp, postgruppe, stikkord). `PostGroupBreakdown.tsx` (donut/stabel for drift/investering/overføring-fordeling). Fokus-trap med `role="dialog"`, `aria-modal="true"`. Navigasjonsanimasjon: innhold glir inn fra høyre nedover, ut til høyre oppover.

**Akseptansekriterium:** Full drill-down fra programområde til enkeltpost fungerer med ekte data. Tastaturnavigasjon fungerer. Breadcrumb-navigasjon fungerer begge veier.

### Oppgave 2.6 -- ComparisonToggle og ChangeIndicator

Implementer `ComparisonToggle.tsx` (toggle-bryter over barplottene) og `ChangeIndicator.tsx` (pil opp/ned + prosenttall + `aria-label`). Når toggle er aktiv: vis tynn linje i hvert barsegment for fjorårsnivå, vis endringsindikator ved hvert segmentnavn. Håndter `null`-verdier med "Ny post"-tekst.

**Akseptansekriterium:** Toggle slår visning av/på. Endringsindikator viser korrekte verdier (med placeholder-data inntil saldert er tilgjengelig).

---

## Fase 3: Sanity CMS

**Mål:** Et fungerende CMS med alle skjemaer, norskspråklig grensesnitt og forhåndsvisning.

### Oppgave 3.1 -- Sanity-prosjekt og skjemaer **(kritisk sti)**

Initialiser Sanity Studio (`sanity init`). Definer dokumenttyper: `budsjettaar` (toppnivådokument med årstall, status, modulliste), `tema` (alle felt fra CMS.md seksjon 3.2 inkl. Portable Text), `modul` (polymorfisk med type-felt), `nokkeltall`, `sitat`. Konfigurer norskspråklige feltetiketter og hjelpetekster. Sett opp color-plugin for fargevelger.

**Akseptansekriterium:** Sanity Studio kjører. Alle dokumenttyper kan opprettes og redigeres med norsk grensesnitt.

### Oppgave 3.2 -- Modulkonfigurasjon i CMS

Implementer CMS-konfigurasjon for alle fem modultyper: `hero` (årstall, tittel, undertittel, nøkkeltall med datareferanse, bakgrunnsbilde), `plan_for_norge` (temareferanser med rekkefølge), `budsjettgrafer` (visEndringDefault, overskrift, forklaringstekst, SPU-forklaring), `nokkeltall` (talliste med datareferanse, layout-valg), `egendefinert_tekst` (rik tekst, bakgrunnsfarge, bredde). Implementer drag-and-drop for modulrekkefølge og synlighets-toggle.

**Akseptansekriterium:** Alle modultyper kan konfigureres i CMS med alle felt fra CMS.md seksjon 3.

### Oppgave 3.3 -- Datareferanse-mekanismen

Implementer `oppløsDatareferanse()` i TypeScript: parser referansestrenger som `utgifter.total`, `utgifter.omraader[omr_nr=4].total`, `spu.overfoering_fra_fond` etc. og traverserer JSON-treet for å hente verdier. Integrer med CMS slik at datareferanser valideres mot tilgjengelige datanøkler. Implementer manuell overstyring (redaktøren kan skrive inn egen verdi).

**Akseptansekriterium:** Datareferanser oppløses korrekt for alle eksempler i ARCHITECTURE.md seksjon 5.3 og CMS.md seksjon 5.1.

### Oppgave 3.4 -- GROQ-spørringer og Next.js-integrasjon

Implementer GROQ-spørringer for å hente moduler for et gitt budsjettår (sortert etter rekkefølge, filtrert på synlighet). Implementer `getStaticProps` som kombinerer CMS-data og JSON-data. Sett opp forhåndsvisning (preview mode) med Sanity. Konfigurer webhook for re-bygging (`/api/revalidate` med hemmelighetsverifisering).

**Akseptansekriterium:** Landingssiden rendres med data fra både CMS og JSON-filer. Forhåndsvisning fungerer.

---

## Fase 4: Redaksjonelle moduler og landingsside

**Mål:** Komplett landingsside med alle moduler, konfigurert via CMS.

### Oppgave 4.1 -- HeroSection

Implementer `HeroSection.tsx`: årstall, hovedtittel, undertittel, 3--5 nøkkeltall med count-up-animasjon ved første visning. Nøkkeltall hentes via datareferanser eller manuell verdi. Valgfritt bakgrunnsbilde. Responsiv layout.

**Akseptansekriterium:** Hero rendres med CMS-innhold. Count-up-animasjon fungerer og respekterer `prefers-reduced-motion`.

### Oppgave 4.2 -- Plan for Norge-seksjonen

Implementer `PlanSection.tsx`, `ThemeCard.tsx` og `ThemeDetail.tsx`. Temakort i horisontalt rutenett (5 på desktop, 2x3 på nettbrett, stabel på mobil). Ekspanderingsanimasjon fra kort til fullbredde detaljvisning. Detaljvisning med: problembeskrivelse (Portable Text), analysegraf (AnalysisChart), prioriteringsliste, QuoteBlock med sitat, og budsjettlenker som navigerer til riktig drill-down i budsjettgrafer-modulen.

**Akseptansekriterium:** Alle fem temaer vises. Ekspandering og kollapsering fungerer. Budsjettlenker navigerer til korrekt programområde.

### Oppgave 4.3 -- ModulRendrer og landingsside-komposisjon **(kritisk sti)**

Implementer `ModulRendrer`-funksjonen (ARCHITECTURE.md seksjon 5.1) som mapper modultype til React-komponent, filtrerer på synlighet og sorterer etter rekkefølge. Koble sammen alle moduler på landingssiden: Hero -> Plan for Norge -> Budsjettgrafer -> Nøkkeltall -> Egendefinert tekst. Implementer scroll-basert seksjon-navigasjon.

**Akseptansekriterium:** Landingssiden rendres komplett med alle moduler i CMS-konfigurert rekkefølge. Skjuling/omorganisering i CMS reflekteres på siden.

### Oppgave 4.4 -- Nøkkeltall og egendefinert tekst

Implementer `KeyFigures.tsx` (nøkkeltall-modul med tre layout-varianter: horisontal rad, vertikal liste, rutenett) og `CustomText.tsx` (egendefinert tekst med Portable Text, bakgrunnsfarge, tre bredde-varianter). Begge moduler støtter datareferanser for tallverdier.

**Akseptansekriterium:** Begge moduler rendres korrekt med CMS-innhold og datareferanser.

---

## Fase 5: Responsivitet, tilgjengelighet og animasjon

**Mål:** Nettstedet tilfredsstiller WCAG 2.1 AA og fungerer på alle enheter.

### Oppgave 5.1 -- Responsiv tilpasning

Gå gjennom alle komponenter og sikre korrekt responsiv oppførsel iht. DESIGN.md seksjon 6.1: barplots stables vertikalt på mobil, SPU-bro erstattes med tekstboks, drill-down tar full bredde, temakort stables, tabeller kollapses til kortvisning, tallformatering forkortes. Test på alle tre breakpoints.

**Akseptansekriterium:** Alle komponenter fungerer korrekt på 375px (mobil), 768px (nettbrett) og 1280px (desktop).

### Oppgave 5.2 -- WCAG-tilgjengelighet **(kritisk sti)**

Kjør axe-core over alle sider. Fiks kontrastproblemer (4.5:1 for normal tekst, 3:1 for stor tekst). Legg til `aria-label` på alle SVG-grafer og skjulte tekstoppsummeringer (`sr-only`). Sikre tastaturnavigasjon i barplots (Tab/Enter/Space). Fokus-trap i drill-down-panel. Fokusindikatorer (2px offset outline). `<abbr>` med `title` for forkortelser. Semantisk HTML gjennomgående.

**Akseptansekriterium:** Ingen axe-core-feil. Tastaturnavigasjon fungerer fullstendig. Lighthouse Accessibility > 90.

### Oppgave 5.3 -- Animasjoner

Implementer: staggered reveal for barplots ved lasting, count-up for tallverdier, smooth expand/collapse for temakort, slide inn/ut for drill-down-navigasjon. Alle animasjoner bruker CSS transforms/opacity (ingen layout-reflow). Alle respekterer `prefers-reduced-motion` (animasjoner deaktiveres, essensielle overganger skjer umiddelbart).

**Akseptansekriterium:** Animasjoner kjører flytende (60fps). `prefers-reduced-motion: reduce` fjerner all visuell animasjon.

---

## Fase 6: Statisk generering, ytelse og deploy

**Mål:** Produksjonsklar site med SSG, optimalt ytelse og deploy-oppsett.

### Oppgave 6.1 -- Statisk generering (SSG) **(kritisk sti)**

Implementer `generateStaticParams` for alle ruter (`/[aar]`, `/[aar]/[omraade]`). JSON-data innbakes i HTML via `getStaticProps` (aggregert) og lastes on-demand (full data per programområde). Implementer korrekt kodedeling: D3.js og drill-down-komponenter lastes dynamisk.

**Akseptansekriterium:** `next build` genererer statiske sider uten feil. Aggregert JSON < 50 KB innbakt i HTML.

### Oppgave 6.2 -- Ytelsesoptimalisering

Implementer: bildeoptimalisering med `next/image` (WebP + JPEG fallback), font self-hosting med `font-display: swap`, caching-headere iht. ARCHITECTURE.md seksjon 9.3 (immutable for JS/CSS/JSON-full, invalidering ved re-bygging for HTML). Lazy loading av full JSON-data per programområde.

**Akseptansekriterium:** Lighthouse Performance > 90. FCP < 1.5s. Total JS-bundle < 200 KB initial load.

### Oppgave 6.3 -- CI/CD og deploy

Sett opp GitHub Actions (eller tilsvarende) med: lint, typesjekk, Vitest-tester, axe-core tilgjengelighetstester, Lighthouse CI (score > 90), JSON Schema-validering. Konfigurer deploy til Vercel (eller statisk hosting). Sett opp Sanity webhook for automatisk re-bygging. Konfigurer tre miljøer: develop, preview, produksjon.

**Akseptansekriterium:** Push til `develop` trigger automatisk deploy til utviklingsmiljø. PR-er genererer preview deploy.

---

## Fase 7: Testing, historikk og ferdigstilling

**Mål:** Komplett testdekning, historikkfunksjonalitet og produksjonsklargjøring.

### Oppgave 7.1 -- Enhetstester

Skriv Vitest-tester for: datapipeline (Python -- pytest), datareferanse-oppløsning, NumberFormat-logikk, hierarkisk navigasjon, postgruppeklassifisering. Mål: >80% dekning av kjernefunksjonalitet.

**Akseptansekriterium:** Alle tester passerer. Datapipeline-tester verifiserer kjente totaler.

### Oppgave 7.2 -- Integrasjonstester

Skriv Testing Library-tester for: StackedBarChart (rendring, interaksjon, tastatur), DrillDownPanel (navigasjon opp/ned, breadcrumb), ModulRendrer (korrekt modulrekkefølge, synlighetsfiltrering), ComparisonToggle (tilstandsendring).

**Akseptansekriterium:** Alle interaksjonsflyter er testet.

### Oppgave 7.3 -- Historikk og årsbasert navigasjon

Implementer `YearSelector.tsx` (dropdown med tilgjengelige år) og `HistoryOverview.tsx`. Årsvelger i header oppdaterer URL og laster data for valgt år. Historiske budsjetter bruker samme modulstruktur fra CMS. Filstrukturen `data/{aar}/` støtter flere år.

**Akseptansekriterium:** Navigasjon mellom budsjettår fungerer. URL oppdateres til `/2025`, `/2024` etc.

### Oppgave 7.4 -- Innholdsfylling i CMS og sluttverifikasjon

Fyll inn redaksjonelt innhold for budsjettåret 2025: hero-tekst, alle fem Plan for Norge-temaer med innhold fra prosjektdokumentene, nøkkeltall, SPU-forklaring. Verifiser at datareferanser oppløses korrekt. Gjennomfør full gjennomgang på desktop, nettbrett og mobil. Kjør komplett Lighthouse-analyse.

**Akseptansekriterium:** Komplett, presentabel side for budsjettåret 2025 med ekte data og redaksjonelt innhold.

---

## Faseoversikt og avhengigheter

```
Fase 0: Prosjektoppsett        [3 oppgaver]    ← Start her
   │
   ├── Fase 1: Datapipeline    [4 oppgaver]    ← Kan starte parallelt med 0
   │      │
   │      └──────────┐
   │                 ▼
   ├── Fase 2: Frontend-kjerne  [6 oppgaver]    ← Krever Fase 0 + 1
   │      │
   │      └──────────┐
   │                 ▼
   ├── Fase 3: Sanity CMS       [4 oppgaver]    ← Kan starte parallelt med Fase 2
   │      │
   │      └──┬───────┘
   │         ▼
   ├── Fase 4: Landingsside     [4 oppgaver]    ← Krever Fase 2 + 3
   │      │
   │      └──────────┐
   │                 ▼
   ├── Fase 5: Tilgjengelighet  [3 oppgaver]    ← Krever Fase 4
   │      │
   │      └──────────┐
   │                 ▼
   ├── Fase 6: Deploy           [3 oppgaver]    ← Krever Fase 4
   │      │
   │      └──────────┐
   │                 ▼
   └── Fase 7: Test/ferdig      [4 oppgaver]    ← Krever Fase 5 + 6
```

## Raskeste vei til fungerende prototype

For å komme raskest mulig til noe visuelt og funksjonelt, kjør disse oppgavene i rekkefølge:

1. **0.1** Prosjektinitialisering
2. **0.3** TypeScript-typer
3. **1.1** Innlesing av Gul bok
4. **1.2** Hierarkisk aggregering
5. **1.4** JSON-eksport
6. **2.2** NumberFormat og hjelpeverktøy
7. **2.3** StackedBarChart
8. **2.5** DrillDownPanel

Etter disse 8 oppgavene har du en fungerende prototype med ekte budsjettdata, interaktive barplots og full drill-down -- den viktigste kjernen i produktet.
