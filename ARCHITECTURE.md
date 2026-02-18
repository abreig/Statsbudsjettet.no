# ARCHITECTURE.md -- Teknisk arkitektur for statsbudsjettet.no

## 1. Innledning

Dette dokumentet beskriver den overordnede tekniske arkitekturen for statsbudsjettet.no -- en publikasjonsplattform som presenterer regjeringens budsjettforslag og politiske prioriteringer for allmennheten. Arkitekturen er utformet for å oppfylle tre sentrale krav: separasjon mellom redaksjonelt innhold og verifiserte budsjettdata, modulbasert fleksibilitet som ikke krever kodeendringer mellom budsjettår, og en publiseringsflyt med tydelige faser og godkjenningsmekanismer.

Dokumentet bygger på og konsoliderer spesifikasjonene i DATA.md (datamodell og datapipeline), DESIGN.md (frontend-arkitektur og komponentdesign) og CMS.md (publikasjonsverktøy og redaksjonell arbeidsflyt). Det er ment som et grunnlag for tekniske beslutninger i utviklingsprosjektet, og dekker anbefalt teknisk stack, systemarkitektur, API-design, hosting og drift, sikkerhet, ytelse og integrasjon mellom de ulike delene.


## 2. Arkitekturprinsipper

Arkitekturen bygger på følgende prinsipper.

**Todelt datakilde.** Redaksjonelt innhold (tekst, bilder, sitater, modulkonfigurasjon) eies av CMS-et. Budsjettdata (tall, hierarki, endringsdata, SPU-beregninger) eies av datapipelinen. Disse to kildene kombineres ved byggetidspunktet, aldri ved kjøretid. Denne grensedragningen sikrer at redaktører aldri kan overskrive verifiserte budsjettall ved et uhell, samtidig som de har full kontroll over den politiske innrammingen.

**Statisk generering (SSG).** Nettstedet genereres som statiske HTML-sider ved byggetidspunktet. Dette gir optimal ytelse, enklere caching, høyere sikkerhet og uavhengighet fra kjøretidstjenester. Dynamisk innhold begrenses til klientside-interaksjoner som drill-down-navigasjon og animasjoner.

**Modulbasert komposisjon.** Landingssiden er bygget opp av selvstendige moduler (hero, plan_for_norge, budsjettgrafer, nokkeltall, egendefinert_tekst) som kan konfigureres, omorganiseres og skjules uten kodeendringer. Nye modultyper kan legges til med relativt lav innsats.

**Tilgjengelighet og universell utforming.** Alle komponenter tilfredsstiller WCAG 2.1 AA. Dette er et ufravikelig krav for offentlige nettsteder og påvirker teknologivalg og komponentdesign gjennomgående.

**Årsbasert innholdsstruktur.** Hvert budsjettår representeres som et selvstendig innholdsdokument med egne moduler, konfigurasjoner og datareferanser. Historiske budsjetter bevares og er tilgjengelige via dedikerte URL-er.


## 3. Anbefalt teknisk stack

### 3.1 Oversikt

| Lag | Teknologi | Begrunnelse |
|-----|-----------|-------------|
| **Frontend-rammeverk** | Next.js (App Router) | SSR/SSG for ytelse og SEO, filbasert routing, inkrementell statisk regenerering |
| **Språk** | TypeScript | Typesikkerhet for den komplekse hierarkiske datamodellen (6 nivåer) |
| **Datavisualisering** | D3.js + React | Fleksibel, tilgjengelig datavisualisering med full kontroll over SVG |
| **Styling** | CSS Modules + CSS-variabler | Scoped styling uten navnekollisjon, enkel temaendring mellom budsjettår |
| **CMS** | Sanity (Strapi som alternativ) | Norskspråklig støtte, fleksibelt innholdsskjema, Portable Text, sanntids forhåndsvisning |
| **Datapipeline** | Python (pandas, openpyxl) | Robust håndtering av Excel-filer, hierarkisk aggregering, validering |
| **Hosting** | Vercel eller sky.regjeringen.no | CDN-distribusjon, automatisk bygg ved innholdsendring, edge caching |
| **Testing** | Vitest + Testing Library + axe-core | Enhets-, integrasjons- og tilgjengelighetstesting |
| **Dokumentasjon** | Storybook | Visuell komponentdokumentasjon med interaktive eksempler |

### 3.2 Begrunnelse for nøkkelvalg

**Next.js med App Router** er valgt fordi plattformen krever en kombinasjon av statisk generering (for ytelse og SEO) og klientside-interaktivitet (for drill-down, animasjoner og sammenligningstoggle). App Router gir filbasert routing som mapper direkte til URL-strukturen (`/2025`, `/2025/forsvar`, `/historikk`), og støtter inkrementell statisk regenerering (ISR) som gjør det mulig å oppdatere enkeltider uten full re-bygging.

**Sanity** er foretrukket CMS fordi det tilbyr norskspråklig grensesnitt, Portable Text for rik innholdsredigering, sanntidssamarbeid, og et fleksibelt skjemasystem som kan modellere den polymorfiske modulstrukturen. Sanity har også god støtte for forhåndsvisning integrert med Next.js.

**D3.js pakket inn i React** gir full kontroll over SVG-rendering for de stacked barplottene og SPU-broen, samtidig som React håndterer DOM-oppdateringer. Dette er nødvendig for å oppnå de detaljerte interaksjonsmønstrene (hover, klikk, drill-down) og tilgjengelighetskravene (tastaturnavigasjon, aria-attributter) som er spesifisert i DESIGN.md.


## 4. Systemarkitektur

### 4.1 Overordnet systemdiagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KILDER                                      │
│                                                                     │
│  ┌──────────────┐       ┌──────────────────┐                        │
│  │  Gul bok     │       │  Saldert budsjett │                       │
│  │  (Excel)     │       │  t-1 (Excel/CSV)  │                       │
│  └──────┬───────┘       └────────┬──────────┘                       │
│         │                        │                                   │
│         └──────────┬─────────────┘                                   │
│                    ▼                                                 │
│  ┌─────────────────────────────────────────┐                        │
│  │        DATAPIPELINE (Python)            │                        │
│  │                                         │                        │
│  │  1. Innlesing og validering (pandas)    │                        │
│  │  2. Normalisering (trimming, typer)     │                        │
│  │  3. Hierarkisk aggregering (bunn → opp) │                        │
│  │  4. Berikelse (SPU, postgrupper, Δ)     │                        │
│  │  5. Eksport (JSON-filer)                │                        │
│  │  6. Validering (kontrollsummer)         │                        │
│  └──────────────────┬──────────────────────┘                        │
│                     ▼                                                │
│  ┌─────────────────────────────────────────┐                        │
│  │        JSON-FILER (statisk datalag)     │                        │
│  │                                         │                        │
│  │  data/2025/gul_bok_full.json            │                        │
│  │  data/2025/gul_bok_aggregert.json       │                        │
│  │  data/2025/gul_bok_endringer.json       │                        │
│  │  data/2025/metadata.json                │                        │
│  └──────────────────┬──────────────────────┘                        │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
                      │  Leses ved byggetidspunkt
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BYGGESTEG (Next.js SSG)                          │
│                                                                     │
│  ┌──────────────┐              ┌──────────────────┐                 │
│  │ JSON-data    │──────────────▶                   │                │
│  │ (budsjettall)│              │  getStaticProps   │                │
│  └──────────────┘              │  / generateStatic │                │
│                                │  Params           │                │
│  ┌──────────────┐              │                   │                │
│  │ Sanity CMS   │──(GROQ API)─▶  Kombinerer data  │                │
│  │ (redaksjon)  │              │  + innhold        │                │
│  └──────────────┘              └────────┬──────────┘                │
│                                         │                           │
│                                         ▼                           │
│                                ┌──────────────────┐                 │
│                                │  Statiske HTML/  │                 │
│                                │  JS/CSS-filer    │                 │
│                                └────────┬─────────┘                 │
└─────────────────────────────────────────┼───────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    HOSTING OG DISTRIBUSJON                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐           │
│  │                 CDN (edge caching)                    │           │
│  │                                                      │           │
│  │  statsbudsjettet.no                                  │           │
│  │  ├── /              → Gjeldende budsjettår           │           │
│  │  ├── /2025          → Budsjettår 2025                │           │
│  │  ├── /2025/forsvar  → Drill-down programområde       │           │
│  │  ├── /historikk     → Oversikt alle år               │           │
│  │  └── /api/revalidate → Webhook for re-bygging        │           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Dataflyt i detalj

Dataflyten fra kilde til ferdig side følger en sekvensiell pipeline med klart definerte ansvarsgrenser.

**Steg 1: Datapipeline (Python).** Gul bok (Excel-fil med 1761 rader og 13 kolonner for 2025-budsjettet) prosesseres av et Python-skript som leser inn, validerer, normaliserer og aggregerer dataene til en hierarkisk trestruktur med seks nivåer (side, programområde, programkategori, kapittel, post, underpost). Pipelinen beregner SPU-nøkkeltall, klassifiserer poster i postgrupper, og kobler endringsdata mot saldert budsjett t-1.

**Steg 2: JSON-eksport.** Pipelinen genererer fire JSON-filer: `gul_bok_full.json` (komplett hierarki for drill-down), `gul_bok_aggregert.json` (forenklede kategorier for landingssiden), `gul_bok_endringer.json` (endringsdata mot saldert), og `metadata.json` (budsjettår, publiseringsdato, kilder). Automatiserte valideringsskript verifiserer at totalsummene stemmer med kjente verdier (2 970,9 mrd. kr utgifter, 2 796,8 mrd. kr inntekter for 2025).

**Steg 3: Byggetidspunkt (Next.js).** Frontend-applikasjonen henter redaksjonelt innhold fra Sanity via GROQ-spørringer og budsjettdata fra JSON-filene. Datareferanser i CMS-et (f.eks. `utgifter.omraader[omr_nr=4].total`) oppløses til konkrete verdier. Moduler rendres i henhold til synlighet og rekkefølge konfigurert av redaktøren.

**Steg 4: Distribusjon.** De statiske filene deployes til CDN for global distribusjon. Klientside-JavaScript håndterer interaktive elementer som drill-down-navigasjon, animasjoner og sammenligningsvisning.


## 5. Komponentarkitektur

### 5.1 Modulrendreren

Modulrendreren er kjernen i den komposisjonsbaserte arkitekturen. Den mottar en sortert liste av modulkonfigurasjoner fra CMS-et og rendrer tilsvarende React-komponenter. Hver modul er definert av en type-identifikator, et synlighetsflagg, et rekkefølgenummer og et modulspesifikt konfigurasjonsobjekt.

```typescript
// Modultyper som støttes
type ModulType =
  | 'hero'
  | 'plan_for_norge'
  | 'budsjettgrafer'
  | 'nokkeltall'
  | 'egendefinert_tekst';

// Modulrendrer som mapper type til komponent
function ModulRendrer({ moduler, budsjettdata }: Props) {
  return moduler
    .filter(m => m.synlig)
    .sort((a, b) => a.rekkefølge - b.rekkefølge)
    .map(modul => {
      switch (modul.type) {
        case 'hero': return <HeroSection {...modul.konfigurasjon} />;
        case 'plan_for_norge': return <PlanSection {...modul.konfigurasjon} />;
        case 'budsjettgrafer': return <BudgetSection data={budsjettdata} />;
        case 'nokkeltall': return <KeyFigures {...modul.konfigurasjon} />;
        case 'egendefinert_tekst': return <CustomText {...modul.konfigurasjon} />;
      }
    });
}
```

### 5.2 Komponenthierarki

Komponentbiblioteket er organisert i fem hovedkategorier som speiler funksjonsområdene i nettstedet.

```
components/
├── layout/           → Header, SectionNav, Footer, PageContainer
├── hero/             → HeroSection (CMS-styrt)
├── plan/             → PlanSection, ThemeCard, ThemeDetail, QuoteBlock, AnalysisChart
├── budget/           → StackedBarChart, BarSegment, SPUBridge, DrillDownPanel,
│                       BreadcrumbNav, BudgetTable, ComparisonToggle, ChangeIndicator
├── history/          → YearSelector, HistoryOverview
├── shared/           → Tooltip, NumberFormat, LoadingState, ErrorBoundary
└── data/
    ├── hooks/        → useBudgetData, useDrillDown, useComparison
    └── types/        → budget.ts (TypeScript-grensesnitt for hele datamodellen)
```

### 5.3 Datareferansemekanismen

Datareferanser er en sentral integrasjonsmekanisme som kobler CMS-innhold til budsjettdata. En datareferanse er en strengbasert peker som oppløses ved byggetidspunktet.

```typescript
// Eksempler på datareferanser
type Datareferanse = string;
// "utgifter.total"                                    → 2 970 900 000 000
// "utgifter.omraader[omr_nr=4].total"                 → totalbeløp for Forsvar
// "spu.overfoering_fra_fond"                          → 413 600 000 000
// "endringer.utgifter.omraader[omr_nr=10].endring_prosent" → prosentvis endring

// Oppløsningsfunksjon
function oppløsDatareferanse(referanse: string, data: BudgetYear): number | null {
  // Parser referansestrengen og traverserer JSON-treet
  // Returnerer verdien eller null dersom referansen er ugyldig
}
```

Redaktøren kan sette en datareferanse i CMS-et for å hente verdier automatisk, men har også mulighet til å overstyre med en manuell verdi (f.eks. for å vise avrundede tall).


## 6. API-design

### 6.1 Datahenting ved byggetidspunkt

Plattformen bruker primært statisk generering, noe som betyr at det ikke finnes et tradisjonelt runtime API. All datahenting skjer ved byggetidspunktet gjennom to kanaler.

**Sanity GROQ API.** Redaksjonelt innhold hentes via Sanitys innebygde GROQ-spørrespråk. Spørringene defineres i Next.js sine `getStaticProps`-funksjoner.

```groq
// Hent alle moduler for et gitt budsjettår, sortert etter rekkefølge
*[_type == "budsjettaar" && aar == $aar][0] {
  aar,
  moduler[] | order(rekkefølge asc) {
    type,
    synlig,
    rekkefølge,
    konfigurasjon {
      ...,
      temaer[]-> {
        nr,
        tittel,
        ingress,
        farge,
        problembeskrivelse,
        prioriteringer,
        sitat->,
        budsjettlenker
      }
    }
  }
}
```

**JSON-filer (filsystem).** Budsjettdata leses direkte fra filsystemet ved byggetidspunktet. Next.js sin `getStaticProps` leser JSON-filene fra `data/{aar}/`-katalogen.

```typescript
// I getStaticProps for landingssiden
export async function getStaticProps({ params }: { params: { aar: string } }) {
  const aar = params.aar || gjeldendeBudsjettaar;

  // Hent redaksjonelt innhold fra Sanity
  const cmsInnhold = await sanityClient.fetch(LANDINGSSIDE_QUERY, { aar });

  // Hent budsjettdata fra JSON-filer
  const aggregertData = JSON.parse(
    await fs.readFile(`data/${aar}/gul_bok_aggregert.json`, 'utf-8')
  );
  const metadata = JSON.parse(
    await fs.readFile(`data/${aar}/metadata.json`, 'utf-8')
  );

  // Oppløs datareferanser
  const oppløstInnhold = oppløsDatareferanser(cmsInnhold, aggregertData);

  return { props: { innhold: oppløstInnhold, data: aggregertData, metadata } };
}
```

### 6.2 Klientside-datahenting (lazy loading)

For drill-down-visningen lastes den fullstendige hierarkiske JSON-filen on-demand for å unngå å laste hele datasettet ved sideinnlasting.

```typescript
// Custom hook for drill-down-data
function useDrillDown(aar: number, omrNr: number) {
  const [data, setData] = useState<Programomraade | null>(null);

  useEffect(() => {
    fetch(`/data/${aar}/gul_bok_full.json`)
      .then(res => res.json())
      .then(fullData => {
        const omraade = fullData.utgifter.omraader.find(
          (o: Programomraade) => o.omr_nr === omrNr
        );
        setData(omraade);
      });
  }, [aar, omrNr]);

  return data;
}
```

### 6.3 Webhook for re-bygging

Når innhold endres i Sanity eller nye JSON-filer lastes opp, utløses en ny byggesyklus via en webhook.

```
POST /api/revalidate
Headers:
  x-sanity-webhook-secret: <hemmelighet>
Body:
  { "_type": "budsjettaar", "aar": 2025 }
```

Webhookens ansvar er å invalidere de statiske sidene for det aktuelle budsjettåret og utløse re-generering. På Vercel skjer dette via on-demand ISR (Incremental Static Regeneration).

### 6.4 Fremtidig REST API (utvidelse)

DATA.md peker på et fremtidig REST API som en mulig utvidelse. Et slikt API ville gjøre det mulig å spørre etter enkeltverdier, aggregeringer og tidsserier uten å laste hele JSON-filer, og kan være relevant for tredjeparter som ønsker å bygge egne visualiseringer eller analyser.

```
GET /api/v1/budsjett/{aar}/utgifter
GET /api/v1/budsjett/{aar}/utgifter/omraade/{omr_nr}
GET /api/v1/budsjett/{aar}/utgifter/omraade/{omr_nr}/kategori/{kat_nr}
GET /api/v1/budsjett/{aar}/spu
GET /api/v1/budsjett/{aar}/endringer
GET /api/v1/budsjett/tidsserie?omr_nr=4&fra=2020&til=2025
```

Dersom dette API-et realiseres, bør det bygges som et tynt lag over de eksisterende JSON-filene (f.eks. som Next.js API Routes eller en separat mikrotjeneste) og caches aggressivt, da budsjettdataene er uforanderlige innenfor et budsjettår.


## 7. Hosting og drift

### 7.1 Anbefalte alternativer

To hostingalternativer er aktuelle, med ulike styrker.

**Alternativ A: Vercel.** Vercel er den naturlige hostingpartneren for Next.js og tilbyr automatisk CDN-distribusjon, edge caching, ISR-støtte, preview deployments for forhåndsvisning, og en enkel integrasjon med Sanity-webhooks for automatisk re-bygging. Vercel er det raskeste alternativet å komme i gang med og gir svært god ytelse.

**Alternativ B: sky.regjeringen.no / egenstyrt infrastruktur.** Dersom det stilles krav til at all infrastruktur skal ligge innenfor regjeringens egen sky, kan nettstedet hostes som en statisk site bak en CDN-tjeneste (f.eks. Azure CDN eller CloudFront). Next.js-bygget kjøres som en del av en CI/CD-pipeline (GitHub Actions, Azure DevOps e.l.), og de statiske filene deployes til en lagringskonto eller et containermiljø. Denne løsningen gir full kontroll over infrastruktur og dataplassering, men krever mer oppsett og vedlikehold.

### 7.2 CI/CD-pipeline

Uavhengig av hostingvalg bør prosjektet ha en automatisert CI/CD-pipeline med følgende steg.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Kodeendring │     │    Bygg      │     │    Test      │     │   Deploy     │
│  (Git push)  │────▶│  (Next.js    │────▶│  (Vitest,    │────▶│  (Vercel /   │
│  eller CMS-  │     │   build)     │     │   axe-core,  │     │   statisk    │
│  webhook     │     │              │     │   Lighthouse)│     │   hosting)   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

Tester som kjøres automatisk i pipelinen inkluderer enhetstester for datapipeline og komponentlogikk (Vitest), tilgjengelighetstester med axe-core, Lighthouse CI for å verifisere ytelsesmål (score > 90), og validering av JSON-data mot JSON Schema.

### 7.3 Publisering og miljøer

Plattformen bør operere med tre miljøer: et utviklingsmiljø (automatisk deploy ved push til `develop`-gren), et forhåndsvisningsmiljø (preview deploy per pull request, brukes også for CMS-forhåndsvisning), og et produksjonsmiljø (deploy ved merge til `main`, med mulighet for tidsstyrt publisering).

Tidsstyrt publisering er særlig viktig fordi budsjettet typisk fremlegges klokken 10:00 på en bestemt dag. CMS-et og CI/CD-pipelinen må støtte at innhold kan klargjøres, godkjennes og settes i kø for publisering på et forhåndsdefinert tidspunkt.


## 8. Sikkerhet

### 8.1 Angrepsflate

Fordi nettstedet primært er statisk generert, er angrepsflaten vesentlig redusert sammenlignet med en tradisjonell dynamisk webapplikasjon. Det finnes ingen database som kan utsettes for SQL-injeksjon, ingen brukerinndata som prosesseres på serveren, og ingen autentiseringsflyt for sluttbrukere.

### 8.2 Sikkerhetstiltak

**CMS-tilgang.** Sanity har innebygd autentisering og rollebasert tilgangskontroll. Prosjektet konfigureres med fire roller: administrator (full tilgang), redaktør (opprette/redigere innhold), godkjenner (godkjenne og utløse publisering), og leser (kun visning og forhåndsvisning). Alle innlogginger bør kreve tofaktorautentisering.

**Webhook-sikkerhet.** Revalideringswebhookens endepunkt (`/api/revalidate`) beskyttes med en delt hemmelighet som verifiseres i headeren (`x-sanity-webhook-secret`). Kun gyldige forespørsler fra Sanity utløser re-bygging.

**Innholdssikkerhet.** HTTP-headere konfigureres med Content Security Policy (CSP) som begrenser tillatte kilder for skript, stiler og bilder. `X-Frame-Options: DENY` forhindrer embedding i iframes. `Strict-Transport-Security` sikrer at all trafikk går over HTTPS.

**Datapipeline.** Datapipelinen kjøres i et kontrollert miljø (ikke eksponert mot internett) og prosesserer kun kjente kildefiler (Excel fra Finansdepartementet). Valideringsstegene i pipelinen fungerer som en sikkerhetsmekanisme mot korrupte eller manipulerte kildedata ved å verifisere totalsummer mot kjente verdier.

**Avhengigheter.** Tredjepartsbiblioteker overvåkes med automatisk sårbarhetsskanning (f.eks. `npm audit`, Dependabot eller Snyk) som del av CI/CD-pipelinen.


## 9. Ytelse

### 9.1 Ytelsesmål

Nettstedet skal oppnå en Lighthouse-score over 90 for Performance, Accessibility og Best Practices. Spesifikke ytelsesmål er definert i DESIGN.md.

### 9.2 Ytelsesstrategi

**Statisk generering.** All innhold genereres ved byggetidspunkt og serveres fra CDN. Ingen kjøretidsberegning er nødvendig for sidevisning.

**Kodedeling.** Next.js håndterer automatisk kodedeling per rute. Drill-down-komponentene og D3.js lastes kun når de trengs (dynamisk import).

**Datadeling.** Budsjettdata deles i to nivåer. Det aggregerte datasettet for landingssiden (`gul_bok_aggregert.json`) er lite (< 50 KB) og lastes ved sideinnlasting. Det fullstendige hierarkiske datasettet (`gul_bok_full.json`) lastes on-demand ved drill-down (lazy loading per programområde).

**Bildeoptimalisering.** Bilder bruker `<picture>`-elementet med WebP og fallback til JPEG. Next.js sin innebygde bildeoptimalisering (`next/image`) håndterer responsive størrelser og lazy loading.

**SVG-rendering.** Grafer rendres med SVG for skarphet på alle oppløsninger, uten behov for bitmap-bilder i ulike størrelser.

**Animasjonsytelse.** Alle animasjoner (staggered reveal, count-up, drill-down-overganger) bruker CSS transforms og opacity for å unngå layout-reflow. Animasjoner respekterer `prefers-reduced-motion`.

### 9.3 Caching-strategi

| Ressurs | Cache-strategi | TTL |
|---------|---------------|-----|
| HTML-sider | CDN edge cache, invalideres ved re-bygging | Til neste bygg |
| JSON-data (aggregert) | Innbakt i HTML via `getStaticProps` | Til neste bygg |
| JSON-data (full) | CDN med lang TTL + immutable fingerprint | 1 år (versionert filnavn) |
| JS/CSS-bundles | Immutable med contenthash | 1 år |
| Bilder (CMS) | Sanity CDN med automatisk transformasjon | 1 år |
| Fonter | Self-hosted med `font-display: swap` | 1 år |


## 10. Integrasjon mellom delene

### 10.1 Integrasjonskart

```
┌─────────────────┐         ┌─────────────────┐
│   Gul bok       │         │   Saldert t-1   │
│   (Excel)       │         │   (Excel/CSV)   │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └─────────┬─────────────────┘
                   ▼
         ┌─────────────────┐
         │  Datapipeline   │ ──── Integrasjonspunkt 1:
         │  (Python)       │      Excel → JSON
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  JSON-filer     │ ──── Integrasjonspunkt 2:
         │  (statisk data) │      Filsystem → Next.js getStaticProps
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌─────────┐  ┌──────────────┐
│ Sanity │  │ Next.js │  │ Datareferanse│ ── Integrasjonspunkt 3:
│ CMS    │──│ bygg    │──│ -oppløser    │    CMS-felt → JSON-verdi
└────────┘  └────┬────┘  └──────────────┘
                 │
                 ▼
         ┌─────────────────┐
         │  Statisk site   │ ──── Integrasjonspunkt 4:
         │  (CDN)          │      Bygg → Deploy (webhook / CI/CD)
         └─────────────────┘
```

### 10.2 Integrasjonspunkt 1: Datapipeline → JSON

Datapipelinen (Python) leser Excel-filer og produserer fire JSON-filer med et definert skjema. Kontrakten mellom pipeline og frontend er JSON Schema-definisjoner som valideres automatisk etter eksport. Filnavnkonvensjonen (`data/{aar}/{type}.json`) er fast og forutsigbar.

### 10.3 Integrasjonspunkt 2: JSON-filer → Next.js

Next.js leser JSON-filene fra filsystemet i `getStaticProps`. Filene ligger enten i repositoriet (for historiske data) eller lastes opp til et definert filområde (for nye budsjettår). TypeScript-grensesnittene i `components/data/types/budget.ts` sikrer typesikkerhet mellom JSON-strukturen og komponentene.

### 10.4 Integrasjonspunkt 3: CMS → Frontend via datareferanser

Datareferansemekanismen er limet mellom CMS-innhold og budsjettdata. Når en redaktør setter en datareferanse (f.eks. `utgifter.omraader[omr_nr=4].total`) i et CMS-felt, oppløses denne til en konkret tallverdi ved byggetidspunktet. Budsjettlenker i «Plan for Norge»-modulene bruker tilsvarende referanser for å generere scroll- og navigasjonshandlinger som åpner riktig drill-down-panel.

### 10.5 Integrasjonspunkt 4: CMS/Pipeline → Deploy

Endringer i CMS-et utløser en webhook til hostingplattformen som trigger et nytt bygg. Nye JSON-filer fra datapipelinen lastes opp og inkluderes i neste bygg. Publisering kan tidsstyres slik at innholdet går live på et forhåndsdefinert tidspunkt (typisk kl. 10:00 på fremleggelsesdagen).


## 11. Lagringsstruktur for historiske data

Hvert budsjettår har sin egen datakatalog og sitt eget CMS-dokument. Filstrukturen er som følger.

```
data/
├── 2025/
│   ├── gul_bok_full.json
│   ├── gul_bok_aggregert.json
│   ├── gul_bok_endringer.json
│   ├── metadata.json
│   └── saldert.json          (når tilgjengelig)
├── 2024/
│   ├── gul_bok_full.json
│   ├── gul_bok_aggregert.json
│   ├── gul_bok_endringer.json
│   ├── metadata.json
│   ├── saldert.json
│   └── nysaldert.json
└── mapping/
    ├── departement_mapping.json
    └── omraade_mapping.json
```

Mappingfiler håndterer strukturendringer mellom år (f.eks. når departementer slås sammen eller programområder omdefineres) og er nødvendige for tidsserieanalyser.


## 12. Åpne spørsmål og avhengigheter

Følgende spørsmål bør avklares før detaljert implementering starter.

**Domene og plassering.** Skal statsbudsjettet.no være en frittstående plattform, eller en del av regjeringen.no? Dette påvirker hosting, autentisering, designsystem og domenearkitektur.

**Hostingkrav.** Stilles det krav til at infrastrukturen ligger innenfor regjeringens egen sky (sky.regjeringen.no), eller kan en tredjepart som Vercel benyttes? Dette påvirker CI/CD-oppsett, CDN-konfigurasjon og kostnad.

**Historiske budsjetter.** Skal historiske budsjetter ha samme temamoduler som gjeldende budsjett, eller kun tallvisningene? Dette påvirker CMS-arbeidsmengde og lagringsstruktur.

**Datanedlasting.** Skal det tilbys nedlasting av data i CSV/Excel-format fra drill-down-visningene? Dette krever en enkel eksportfunksjon på klientsiden.

**REST API.** Skal det utvikles et offentlig API for budsjettdata? Dersom ja, bør dette planlegges som en egen leveranse med egen dokumentasjon, autentisering og ratebegrensning.

**Søkefunksjon.** Skal det utvikles en egen søkefunksjon for å finne spesifikke kapitler eller poster? Dette kan implementeres som klientside-søk over JSON-dataene eller som en dedikert søkeindeks.


## 13. Avhengigheter til øvrige dokumenter

| Dokument | Avhengighet |
|----------|-------------|
| **DATA.md** | Definerer kildedataene (Gul bok), den hierarkiske datamodellen (6 nivåer), JSON-strukturen (avsnitt 4.1), aggregeringsvisningen (avsnitt 4.2), datapipelinen (avsnitt 6) og valideringsreglene (avsnitt 6.7). Alle dataflyter og integrasjonspunkter i denne arkitekturen forutsetter strukturene definert i DATA.md. |
| **DESIGN.md** | Definerer komponentbiblioteket (seksjon 3), TypeScript-typene (seksjon 3.2), komponentspesifikasjoner for StackedBarChart, SPUBridge og DrillDownPanel (seksjon 4), WCAG-kravene (seksjon 6.2), ytelsesmålene (seksjon 6.3), modularkitekturen (seksjon 7.2) og den tekniske stacken (seksjon 8). |
| **CMS.md** | Definerer ansvarsfordelingen mellom CMS og datapipeline (seksjon 2.1), modultyper og konfigurasjon (seksjon 3), den redaksjonelle arbeidsflyten med seks faser (seksjon 4), datareferansemekanismen (seksjon 5.1), krav til fleksibilitet og tilgangsstyring (seksjon 6), og versjonshåndtering mellom budsjettår (seksjon 7). |
