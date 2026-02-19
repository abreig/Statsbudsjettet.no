# Implementasjonsplan

Tre hovedoppgaver pluss DESIGN_OPPDATERING.md-endringene. Rekkefølgen er valgt slik at avhengigheter løses først.

---

## Fase A: Datapipeline for historiske år (2019–2024)

Excel-filer for 2019–2024 finnes i rotnivå. Bare 2025 har JSON-data i dag.

### A1. Generaliser kjor_pipeline.py for alle år
- Oppdater `kjor_pipeline.py` så den tar `budsjettaar` som CLI-argument og automatisk finner riktig Excel-fil (`Gul bok {aar}.xlsx`)
- Fjern hardkodede 2025-forventninger i `valider_grunndata()` — gjør forventede verdier valgfrie eller per-år
- Kjør pipeline for hvert år 2019–2024 → genererer `data/{aar}/gul_bok_full.json`, `gul_bok_aggregert.json`, `metadata.json`

### A2. Kopier generert data til public/
- Kopier `data/{aar}/` til `public/data/{aar}/` for alle 6 historiske år slik at det er tilgjengelig for klient-side fetch

---

## Fase B: Redesign av StackedBarChart + SPU-visualisering (DESIGN_OPPDATERING.md)

Følger prototypen i `konsept_a_v5.jsx` tett.

### B1. Oppdater aggregert data-format
- Oppdater `berikelse.py`: Fjern SPU (omr 34) fra `utgifter_aggregert`. Fjern kap. 5800 fra `inntekter_aggregert`. Legg til `fondsuttak`, `netto_kontantstrom` og `kontantstrom_kilder` i `spu`-objektet.
- Oppdater TypeScript-typer i `budget.ts`: `AggregertBudsjett` får nye felter for SPU, `inntekterOrdinaere` etc.
- Re-kjør pipeline for alle år

### B2. Ny StackedBarChart med 3-sone layout
- Erstatt nåværende StackedBarChart med 3-sone versjon fra konsept_a_v5.jsx
- **Sone 1** (venstre): Utgifter med marine monokromatisk skala (8 nyanser), ingen SPU-segment
- **Sone 2** (midten): Ordinære inntekter med teal-skala (5 nyanser) + fondsuttak med stripemønster øverst
- **Sone 3** (høyre): Kontantstrøm-boks + SPU-boks + Bezier-bro
- Begge barene har eksakt samme høyde (budsjettet balanserer)
- Tooltip-system, segment-dimming ved hover, staggered animasjon

### B3. SPU-sone-komponenter
- Kontantstrøm-boks (`#2C4F8A`, klikkbar → åpner drill-down)
- SPU-boks (tooltip med fondets verdi og handlingsregel)
- Stiplet pil mellom kontantstrøm og SPU
- Bezier-bro fra SPU-boks til fondsuttak-segment med gradient

### B4. Forklaringstekst under graf
- Statisk tekstboks med lys bakgrunn og blå venstre-border
- Fondsmekanismen-tekst med dynamiske beløp hentet fra data

### B5. Responsivitet
- Desktop (>1024px): Full 3-sone layout
- Tablet (768–1024px): Smalere barer, SPU-sone under
- Mobil (<768px): Barer stablet vertikalt, SPU-sone som tekstkort

---

## Fase C: Drill-down som modal med uskarp bakgrunn

Erstatter nåværende sidepanel-drawer med sentrert modal + `backdrop-filter: blur()`.

### C1. Ny ModalOverlay-komponent
- Ny gjenbrukbar `ModalOverlay.tsx` i `components/shared/`:
  - Fixed overlay med `backdrop-filter: blur(8px)` + semi-transparent bakgrunn
  - Sentrert innholdsboks med maks-bredde, avrundede hjørner, skygge
  - Fokus-trap (Tab holdes innenfor), Escape lukker
  - `body.overflow = hidden` mens åpen
  - Animasjon: fade-in bakgrunn + scale-in innhold

### C2. Refaktorer DrillDownPanel til å bruke ModalOverlay
- Erstatt nåværende sidepanel-layout med ModalOverlay
- Behold all eksisterende funksjonalitet: breadcrumb, KategoriListe, PostListe
- Legg til **klikk-navigasjon** på KategoriListe-elementer:
  - Klikk på programkategori → vis kapitler
  - Klikk på kapittel → vis poster
  - Oppdater breadcrumb og hierarkiSti ved hvert steg
- Animer innhold ved navigasjon (glid inn fra høyre ved drill-down, fra venstre ved tilbake)

### C3. Kontantstrøm drill-down
- Klikk på kontantstrøm-boks i SPU-sonen → åpner ModalOverlay
- Viser fordeling med horisontale progress bars (petroleumsskatter, SDFI, Equinor-utbytte, andre)
- Data kommer fra `spu.kontantstrom_kilder` i aggregert JSON

### C4. Mock-data for dype nivåer
- Der `gul_bok_full.json` mangler tilstrekkelig detalj for drill-down, generer mock-data
- Placeholder-tekst som indikerer at dette er eksempeldata

---

## Fase D: Plan for Norge som modal med dypere navigasjon

### D1. Refaktorer TemaDetalj til ModalOverlay
- Når bruker klikker et temakort, åpnes TemaDetalj i ModalOverlay (ikke inline-ekspansjon)
- Uskarp bakgrunn (`backdrop-filter: blur(8px)`)
- Større plass for innhold: prioriteringer, analysegraf, sitat, budsjettlenker
- Temafarge brukes som aksent i modal-header

### D2. Budsjettlenker som navigerer direkte til drill-down
- Budsjettlenke-knappene i TemaDetalj skal:
  1. Lukke Plan for Norge-modalen
  2. Scrolle ned til budsjettgraf-seksjonen
  3. Åpne DrillDownPanel med riktig programområde allerede valgt
- Implementer koordinering via en delt callback eller context:
  - `onBudsjettNavigasjon(omrNr)` lukker modal, scroller til `#budsjett`, og trigger `setDrillDown({ side: 'utgift', id })` i BudsjettSeksjon
- Krever at ModulRendrer løfter drill-down-state opp, eller bruker en enkel context

### D3. Styling og animasjon
- Modal åpnes med fade + scale-animasjon
- Lukkes med Escape eller klikk utenfor
- Responsiv: fullskjerm på mobil, sentrert boks på desktop

---

## Fase E: Historikk-modul (frontend)

### E1. Historikk-landingsside (`/historikk`)
- Erstatt placeholder i `src/app/historikk/page.tsx`
- Vis grid/liste med alle tilgjengelige budsjettår (2019–2025)
- Hvert år viser: årstall, totale utgifter, totale inntekter (fra metadata.json)
- Lenke til `/[aar]`-siden for hvert år

### E2. Årsvelger i header
- Legg til dropdown i Header-komponenten med tilgjengelige år
- Bytter til valgt år ved navigasjon

### E3. Mock CMS-data for historiske år
- Utvid `hentMockCMSData()` med forenklet modulkonfigurasjon for 2019–2024
- Kun `hero` + `budsjettgrafer` + `nokkeltall`-moduler (ingen Plan for Norge for historiske år)
- Sikre at `[aar]/page.tsx` fungerer for alle år

### E4. Generering av statiske sider
- `generateStaticParams` i `[aar]/page.tsx` genererer allerede sider for alle år-mapper i `data/`
- Verifiser at build genererer sider for 2019–2025

---

## Rekkefølge og avhengigheter

```
A1 → A2 (data må genereres først)
     ↓
B1 → B2 → B3 → B4 → B5 (ny graf avhenger av nytt dataformat)
     ↓
C1 → C2 → C3 → C4 (modal-komponent først, deretter refaktorering)
     ↓
D1 → D2 → D3 (Plan for Norge bruker samme ModalOverlay)
     ↓
E1 → E2 → E3 → E4 (historikk bruker all foregående infrastruktur)
```

Fase A og B henger tett sammen. C og D kan delvis parallelliseres (C1 ModalOverlay brukes av begge). Fase E kan starte uavhengig av C/D men trenger A ferdig.
