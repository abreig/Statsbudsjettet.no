# CLAUDE.md -- Systemprompt for statsbudsjettet.no

## Prosjektoversikt

Du utvikler **statsbudsjettet.no** -- en publikasjonsplattform som presenterer det norske statsbudsjettet for allmennheten. Plattformen kombinerer regjeringens politiske budskap ("Regjeringens plan for Norge") med de faktiske budsjettallene i en interaktiv, tilgjengelig nettopplevelse.

## Arkitekturprinsipper (ikke bryt disse)

1. **Todelt datakilde.** Redaksjonelt innhold (tekst, bilder, sitater, modulkonfigurasjon) eies av Sanity CMS. Budsjettdata (tall, hierarki, SPU-beregninger) eies av datapipelinen (Python). Disse kombineres ved byggetidspunktet, aldri ved kjøretid. Redaktører kan aldri overskrive verifiserte budsjettall.

2. **Statisk generering (SSG).** Nettstedet genereres som statiske HTML-sider. Dynamisk innhold begrenses til klientside-interaksjoner (drill-down, animasjoner). Ingen runtime-API for sluttbrukere.

3. **Modulbasert komposisjon.** Landingssiden er bygget av selvstendige moduler (`hero`, `plan_for_norge`, `budsjettgrafer`, `nokkeltall`, `egendefinert_tekst`) som kan konfigureres, omorganiseres og skjules i CMS uten kodeendringer.

4. **WCAG 2.1 AA.** Ufravikelig krav. Alle komponenter må ha tastaturnavigasjon, korrekt kontrast, aria-attributter og semantisk HTML. Bruk `lang="nb"`.

5. **Årsbasert innholdsstruktur.** Hvert budsjettår er et selvstendig dokument. Historiske budsjetter bevares uendret.

## Teknisk stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | Next.js (App Router), TypeScript |
| Visualisering | D3.js + React (SVG) |
| Styling | CSS Modules + CSS-variabler |
| CMS | Sanity (Portable Text, norskspråklig) |
| Datapipeline | Python (pandas, openpyxl) |
| Testing | Vitest + Testing Library + axe-core |
| Hosting | Vercel (primært) |

## Datamodell -- 6-nivå hierarki

Budsjettet har en hierarkisk trestruktur:

```
Nivå 1: Side (Utgifter / Inntekter)          ← kap_nr < 3000 = utgift
  └── Nivå 2: Fagdepartement                  ← fdep_nr (1--23, 17 departementer + Ymse)
        └── Nivå 3: Programområde              ← omr_nr (0--34, 27 områder)
              └── Nivå 4: Programkategori      ← kat_nr
                    └── Nivå 5: Kapittel       ← kap_nr
                          └── Nivå 6: Post     ← post_nr + upost_nr
```

**Nøkkeltall for 2025:** Utgifter: 2 970,9 mrd. kr (1346 poster). Inntekter: 2 796,8 mrd. kr (415 poster). Total: 1761 poster.

**Postgrupper** (tverrgående dimensjon basert på postnummer):
- 01--29: Driftsutgifter (522,6 mrd.)
- 30--49: Investeringer (139,9 mrd.)
- 50--69: Overføringer til statsregnskaper (1 475,9 mrd.)
- 70--89: Overføringer til private (3 188,9 mrd.)
- 90--99: Utlån og statsgjeld (440,5 mrd.)

**SPU (oljefondet)** krever særskilt håndtering:
- Kap. 2800 post 50: Overføring til fondet (642,8 mrd.) -- utgift
- Kap. 2800 post 96: Finansposter til fondet (82,1 mrd.) -- utgift
- Kap. 5800 post 50: Overføring fra fondet (413,6 mrd.) -- inntekt
- Netto overføring: 311,3 mrd. kr

## Mappestruktur

```
statsbudsjettet/
├── pipeline/                    # Python-datapipeline
│   ├── les_gul_bok.py          # Innlesing + validering
│   ├── bygg_hierarki.py        # Aggregering bunn-opp
│   ├── berikelse.py            # SPU, postgrupper, endringer
│   ├── eksporter.py            # JSON-eksport
│   └── valider.py              # Kontrollsummer
├── data/
│   └── 2025/
│       ├── gul_bok_full.json   # Komplett hierarki (drill-down)
│       ├── gul_bok_aggregert.json # Forenklet (landingsside, <50 KB)
│       ├── gul_bok_endringer.json # Endring vs. saldert t-1
│       └── metadata.json
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # / → gjeldende budsjettår
│   │   ├── [aar]/
│   │   │   ├── page.tsx        # /2025
│   │   │   └── [omraade]/
│   │   │       └── page.tsx    # /2025/forsvar
│   │   └── historikk/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/             # Header, SectionNav, Footer, PageContainer
│   │   ├── hero/               # HeroSection
│   │   ├── plan/               # PlanSection, ThemeCard, ThemeDetail, QuoteBlock, AnalysisChart
│   │   ├── budget/             # StackedBarChart, BarSegment, SPUBridge, DrillDownPanel,
│   │   │                       # BreadcrumbNav, BudgetTable, ComparisonToggle, ChangeIndicator
│   │   ├── history/            # YearSelector, HistoryOverview
│   │   ├── shared/             # Tooltip, NumberFormat, LoadingState, ErrorBoundary
│   │   └── data/
│   │       ├── hooks/          # useBudgetData, useDrillDown, useComparison
│   │       └── types/
│   │           └── budget.ts   # Alle TypeScript-interfaces
│   └── styles/
│       └── tokens.css          # CSS-variabler (farger, typografi, breakpoints)
├── sanity/                     # Sanity Studio
│   └── schemas/                # budsjettaar, tema, modul, nokkeltall, sitat
├── Gul_bok_2025.xlsx           # Kildedata
├── UTVIKLINGSPLAN.md           # Oppgaveoversikt (28 oppgaver, 7 faser)
├── DATA.md                     # Spesifikasjon: datamodell og pipeline
├── DESIGN.md                   # Spesifikasjon: frontend og komponenter
├── CMS.md                      # Spesifikasjon: publikasjonsverktøy
└── ARCHITECTURE.md             # Spesifikasjon: overordnet arkitektur
```

## Fargepalett (CSS-variabler)

**Regjeringspaletten (budsjettgrafer):**
```css
--reg-marine: #181C62;    /* Mørk marineblå (primær) */
--reg-blaa: #4156A6;      /* Mellomblå */
--reg-lyseblaa: #5B91CC;  /* Lys mellomblå */
--reg-korall: #F15D61;    /* Korallrød */
--reg-lysgraa: #EDEDEE;   /* Lys grå (kun restkategorier) */
--reg-lilla: #97499C;     /* Lilla */
--reg-teal: #008286;      /* Mørk teal */
--reg-mint: #60C3AD;      /* Lys mint */
--reg-gul: #FFDF4F;       /* Gul (KUN for SPU-overføringer) */
--bg-sand: #F7F4EF;       /* Bakgrunn */
```

**Plan for Norge (temaaksentfarger):**
```css
--tema-1: #2A7F7F;  /* Trygghet for økonomien */
--tema-2: #7B5EA7;  /* Trygghet for arbeids- og næringslivet */
--tema-3: #C99A2E;  /* Trygghet for barn og unge */
--tema-4: #B84C3C;  /* Trygghet for helsa */
--tema-5: #8B7530;  /* Trygghet for landet */
```

## Datareferansemekanisme

CMS-moduler kan peke på budsjettdata via strengreferanser som oppløses ved byggetidspunktet:
```
"utgifter.total"                                    → 2 970 900 000 000
"utgifter.omraader[omr_nr=4].total"                 → totalbeløp for Forsvar
"spu.overfoering_fra_fond"                           → 413 600 000 000
"endringer.utgifter.omraader[omr_nr=10].endring_prosent" → prosentvis endring
```

## Tallformatering (norsk standard)

- Over 1 mrd.: "2 970,9 mrd. kr" (med `<abbr title="milliarder">mrd.</abbr>`)
- 1 mill.--1 mrd.: "413,6 mill. kr"
- Under 1 mill.: "850 000 kr" (mellomrom som tusenskilletegn)
- Tabular lining figures i grafer og tabeller

## Spesifikasjonsdokumenter

Les alltid relevant spesifikasjonsdokument FØR du implementerer en oppgave:
- **DATA.md** for alt som gjelder datapipeline, JSON-struktur, hierarki og validering
- **DESIGN.md** for komponentspesifikasjoner, interaksjonsdesign, fargetildeling og WCAG-krav
- **CMS.md** for modultyper, redaksjonell arbeidsflyt, datareferanser og Sanity-skjemaer
- **ARCHITECTURE.md** for integrasjonspunkter, systemarkitektur og deploy

## Oppgavestruktur

Prosjektet følger en utviklingsplan med 28 oppgaver i 7 faser. Se UTVIKLINGSPLAN.md for full oversikt. Start med Fase 0 (prosjektoppsett) og Fase 1 (datapipeline) parallelt.

## Viktige regler

- Skriv all kode og kommentarer på **norsk** (variabelnavn kan være engelske der det er TypeScript/Python-konvensjon, men bruk norske navn der det gir mening: `utgifter`, `omraader`, `beløp`, `hierarki`).
- Bruk **norske bokstaver** (æ, ø, å) i strenger, kommentarer og brukervendt tekst.
- Bruk Python for datapipeline, TypeScript for alt frontend.
- Test alltid mot de kjente totalene: utgifter 2 970,9 mrd., inntekter 2 796,8 mrd.
- Aldri hardkod budsjettall i frontend -- de skal alltid komme fra JSON-data eller CMS via datareferanser.
