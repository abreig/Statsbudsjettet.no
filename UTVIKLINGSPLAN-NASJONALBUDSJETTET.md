# UTVIKLINGSPLAN-NASJONALBUDSJETTET.md
## Implementasjonsplan for Claude Code

Denne planen dekker kun nasjonalbudsjettet-modulen. Resten av applikasjonen (datapipeline, budsjettgrafer, Plan for Norge, CMS-integrasjon) er allerede implementert og kan gjenbrukes direkte.

Planen er delt i fire steg. Hvert steg er avgrenset til én Claude Code-sesjon og skal avsluttes i kjørbar tilstand. Gi Claude Code steg-nummeret og de relevante filreferansene — ikke mer.

---

## Forutsetninger

Følgende er på plass og kan gjenbrukes uten endringer:

- `DrillDownPanel` med panel-mekanikk (overlay, slide-in, focus trap, Escape-lukking, URL-oppdatering via `?drill=`)
- `FocusTrap`-hjelpekomponent (eller tilsvarende, brukt av DrillDownPanel)
- Panel-state på landingssiden (`aapenPanel`-state / `setAapenPanel`)
- `NumberFormat`-komponent
- CSS-variabler for hele designsystemet (`--reg-marine`, `--reg-lysgraa` osv.)
- Sanity-klient og eksisterende skjemastruktur
- `ModulRendrer` med switch-statement

---

## Steg 1 — Ingressboks og panel-skjelett (½–1 dag)

**Mål:** Modulen vises på landingssiden med en ingressboks. Klikk åpner et tomt panel med sticky header.

### Oppgaver

**1a. TypeScript-typer**

Opprett `components/nasjonalbudsjettet/types.ts` med typene fra NASJONALBUDSJETTET.md seksjon 7.2:

```typescript
// Alle seksjonstyper
type NasjonalbudsjettetSeksjon =
  | { type: 'tekst'; overskrift?: string; innhold: PortableTextBlock[] }
  | { type: 'highcharts'; tittel: string; kilde?: string; iframe_url?: string; config?: object; hoyde?: number }
  | { type: 'graf_placeholder'; tittel: string; beskrivelse?: string; hoyde?: number }
  | { type: 'nokkeltall_rad'; tall: { etikett: string; verdi: string; enhet?: string }[] }

interface NasjonalbudsjettetKonfigurasjon {
  tittel: string;
  ingress: string;
  pdf_lenke: string;
  vis_paa_landingsside: boolean;
  nokkeltall: {
    etikett: string;
    verdi: string;
    endring?: string;
    retning?: 'opp' | 'ned' | 'nøytral';
    positivt_er?: 'opp' | 'ned';
  }[];
  seksjoner: NasjonalbudsjettetSeksjon[];
}
```

**1b. Mock-data**

Opprett `lib/mock-data/nasjonalbudsjettet-2026.ts` med hardkodet innhold:
- `ingress`: én setning om tilstanden i norsk økonomi
- `nokkeltall`: BNP 2,1 %, KPI 2,2 %, Ledighet 2,1 %, Fondsbruk 13,1 % av trend-BNP
- `seksjoner`: 11 seksjoner der alle er `graf_placeholder` (titler fra NASJONALBUDSJETTET.md seksjon 5.2)

**1c. NasjonalbudsjettetIngressBoks**

Opprett `components/nasjonalbudsjettet/NasjonalbudsjettetIngressBoks.tsx`:

```
Visuell identitet (NASJONALBUDSJETTET.md seksjon 3.2):
  - Bakgrunn: var(--reg-lysgraa)
  - Venstre border: 4px solid var(--reg-marine)
  - Badge øverst til høyre: «Meld. St. 1»

Innhold:
  - Tittel («Nasjonalbudsjettet — tilstanden i norsk økonomi»)
  - Ingress (én setning)
  - Nøkkeltall-rad (gjenbruk eksisterende nøkkeltall-komponent)
  - «Les mer»-knapp: aria-expanded, aria-controls="nasjonalbudsjettet-panel", kaller onAapne()
  - «Last ned PDF»-lenke (sekundær, åpner i ny fane)
```

**1d. NasjonalbudsjettetPanel — skjelett**

Opprett `components/nasjonalbudsjettet/NasjonalbudsjettetPanel.tsx`.

Kopier panel-mekanikken direkte fra `DrillDownPanel`:
- Samme CSS-klasser og animasjon (slide in fra høyre)
- Samme overlay
- Samme `FocusTrap`
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="nasjonalbudsjettet-panel-tittel"`
- Escape-lukking og overlay-klikk
- URL oppdateres til `?panel=nasjonalbudsjettet` ved åpning, fjernes ved lukking

Sticky header i panelet:
- «← Lukk»-knapp til venstre
- Tittel til høyre: «Nasjonalbudsjettet 2026»

Innholdsområdet under headeren er tomt (fylles i steg 2).

**1e. Registrering i ModulRendrer og landingsside**

Legg til i `ModulRendrer`:
```typescript
case 'nasjonalbudsjettet':
  return (
    <NasjonalbudsjettetIngressBoks
      konfigurasjon={modul.konfigurasjon}
      onAapne={() => setAapenPanel('nasjonalbudsjettet')}
    />
  );
```

Legg til i landingssidens panel-state (samme sted som DrillDownPanel håndteres):
```typescript
{aapenPanel === 'nasjonalbudsjettet' && (
  <NasjonalbudsjettetPanel
    konfigurasjon={nasjonalbudsjettetData}
    onLukk={() => setAapenPanel(null)}
  />
)}
```

Sikre at de to panelene ikke kan være åpne samtidig — `setAapenPanel` erstatter eventuell annen verdi.

Plasser modulen mellom `plan_for_norge` og `budsjettgrafer` i mock-modulkonfigurasjonen.

### Leveranse

Landingssiden viser ingressboksen med nøkkeltall. Klikk åpner et panel med sticky header. Panelet lukkes med Escape, overlay-klikk og «Lukk»-knapp. URL oppdateres korrekt.

---

## Steg 2 — SeksjonsRenderer og plassholdere (½–1 dag)

**Mål:** Panelet viser alle 11 seksjoner med tekstblokker og plassholdere.

### Oppgaver

**2a. GrafPlaceholder**

Opprett `components/nasjonalbudsjettet/GrafPlaceholder.tsx`:

```
Props: tittel, beskrivelse?, hoyde? (standard: 380px)

Visuell utforming:
  - Ramme med stiplet border (2px dashed var(--reg-lysgraa))
  - Bakgrunn: svakt grå (#F8F8F9)
  - Sentrert innhold: ikon + «Graf under produksjon» + tittel + beskrivelse
  - Høyde styres av hoyde-prop

Tilgjengelighet:
  - aria-hidden="true" — plassholderen formidler ingen reell informasjon
```

**2b. HighchartsEmbed**

Opprett `components/nasjonalbudsjettet/HighchartsEmbed.tsx`:

```
Props: type ('iframe' | 'config'), iframe_url?, config?, tittel, kilde?, hoyde?

For type 'iframe':
  - <iframe src={iframe_url} title={tittel} width="100%" height={hoyde ?? 380} />
  - Innpakket i responsiv container (aspect-ratio eller fast høyde)
  - Lazy-loading: laster kun når komponenten er i viewport (IntersectionObserver)
  - Figurtekst under med kilde dersom kilde er satt

For type 'config':
  - Instansierer Highcharts via useEffect (krever highcharts som npm-avhengighet)
  - Samme responsive wrapper og figurtekst
```

**2c. SeksjonsRenderer**

Opprett `components/nasjonalbudsjettet/SeksjonsRenderer.tsx`:

```typescript
function SeksjonsRenderer({ seksjoner }: { seksjoner: NasjonalbudsjettetSeksjon[] }) {
  return seksjoner.map((seksjon, i) => {
    switch (seksjon.type) {
      case 'tekst':
        return <TekstSeksjon key={i} {...seksjon} />;
      case 'highcharts':
        return <HighchartsEmbed key={i} {...seksjon} />;
      case 'graf_placeholder':
        return <GrafPlaceholder key={i} {...seksjon} />;
      case 'nokkeltall_rad':
        return <NokkeltallRad key={i} tall={seksjon.tall} />;
    }
  });
}
```

`TekstSeksjon` rendrer overskrift (hvis satt) og Portable Text via `@portabletext/react`.

For mock-dataene i steg 1 er alle seksjoner `graf_placeholder`. Legg til 2–3 `tekst`-seksjoner i mock-dataene som eksempel på redaksjonelt innhold.

**2d. Koble SeksjonsRenderer til panelet**

Legg `<SeksjonsRenderer seksjoner={konfigurasjon.seksjoner} />` inn i panelet under sticky header. Panelet er scrollbart — sett `overflow-y: auto` på innholdsområdet.

Legg til «Last ned hele Nasjonalbudsjettet (PDF)»-lenke nederst i panelet.

### Leveranse

Panelet viser en scrollbar liste med tekst-seksjoner og plassholdere. Plassholdere har korrekte dimensjoner og titler.

---

## Steg 3 — Sanity-skjema og CMS-integrasjon (1–1½ dag)

**Mål:** Innhold hentes fra Sanity i stedet for mock-data. Admin kan redigere alle felt i CMS-et.

### Oppgaver

**3a. Sanity-skjema**

Opprett `studio/schemas/nasjonalbudsjettet.ts`.

Dokumenttypen legges til under `budsjettaar`-dokumentet som en ny modul av typen `nasjonalbudsjettet`, på lik linje med eksisterende modultyper.

Felter som speiler `NasjonalbudsjettetKonfigurasjon`:

```javascript
// Nøkkeltall (array av objekter)
{
  name: 'nokkeltall',
  title: 'Nøkkeltall (vises i lukket boks)',
  type: 'array',
  of: [{
    type: 'object',
    fields: [
      { name: 'etikett', type: 'string', title: 'Etikett' },
      { name: 'verdi',   type: 'string', title: 'Verdi (f.eks. «2,1 %»)' },
      { name: 'endring', type: 'string', title: 'Endring (f.eks. «+0,1 pp»)' },
      { name: 'retning', type: 'string', title: 'Retning',
        options: { list: ['opp', 'ned', 'nøytral'] } },
      { name: 'positivt_er', type: 'string', title: 'Positiv retning',
        options: { list: ['opp', 'ned'] } }
    ]
  }]
}

// Seksjoner (polymorfisk array)
{
  name: 'seksjoner',
  title: 'Seksjoner i panelet',
  type: 'array',
  of: [
    {
      type: 'object', name: 'tekst', title: 'Tekst',
      fields: [
        { name: 'overskrift', type: 'string', title: 'Overskrift (valgfri)' },
        { name: 'innhold', type: 'blockContent', title: 'Innhold' }
      ]
    },
    {
      type: 'object', name: 'highcharts', title: 'Highcharts-graf',
      fields: [
        { name: 'tittel',    type: 'string', title: 'Tittel (for tilgjengelighet)' },
        { name: 'kilde',     type: 'string', title: 'Kilde (valgfri)' },
        { name: 'iframe_url',type: 'url',    title: 'iframe-URL (Highcharts Cloud)' },
        { name: 'hoyde',     type: 'number', title: 'Høyde i px (standard: 380)' }
      ]
    },
    {
      type: 'object', name: 'graf_placeholder', title: 'Grafplass­holder',
      fields: [
        { name: 'tittel',      type: 'string', title: 'Tittel' },
        { name: 'beskrivelse', type: 'string', title: 'Beskrivelse (valgfri)' },
        { name: 'hoyde',       type: 'number', title: 'Høyde i px (standard: 380)' }
      ]
    }
  ]
}
```

Alle feltetiketter og hjelpetekster på norsk bokmål. Legg til helpText på `iframe_url`: «Lim inn embed-URL fra Highcharts Cloud. Bytt ut denne seksjonen med en Highcharts-seksjon når grafen er klar.»

**3b. GROQ-spørring**

Utvid eksisterende GROQ-spørring for `budsjettaar` til å inkludere moduler av typen `nasjonalbudsjettet` med alle felt.

**3c. Erstatt mock-data med CMS-data**

Oppdater `getStaticProps` på landingssiden til å lese `nasjonalbudsjettet`-modulkonfigurasjon fra Sanity på lik linje med øvrige moduler.

Fjern `lib/mock-data/nasjonalbudsjettet-2026.ts` når CMS-data er koblet til.

**3d. Skriv innhold i Sanity Studio**

Fyll inn det faktiske innholdet for Nasjonalbudsjettet 2026:
- Ingress og nøkkeltall
- 11 seksjoner som beskrevet i NASJONALBUDSJETTET.md seksjon 5.2: alle som `graf_placeholder` initialt, med korrekte titler

### Leveranse

`npm run build` produserer en statisk side der nasjonalbudsjettet-modulen henter innhold fra Sanity. Redaktør kan oppdatere alle felt i Studio og se endringene etter rebuild.

---

## Steg 4 — Highcharts-grafer og tilgjengelighetstesting (½–1 dag)

**Mål:** Minst én ekte Highcharts-graf er embeddet. Tilgjengelighet er verifisert.

### Oppgaver

**4a. Bytt ut én plassholder med iframe-embed**

Test at `HighchartsEmbed` med `type: 'iframe'` fungerer i praksis. Bruk en testgraf fra Highcharts Cloud eller en eksisterende graf Finansdepartementet har produsert. Redaktøren gjør dette i Sanity Studio ved å endre seksjonstypen fra `graf_placeholder` til `highcharts` og lime inn iframe-URL.

Verifiser:
- Grafen vises korrekt på desktop og mobil
- Riktig høyde
- `title`-attributt er satt på iframe-elementet
- Lazy-loading fungerer (grafen lastes ikke ved sideinnlasting, kun når panelet åpnes)

**4b. Tilgjengelighetstesting**

Kjør axe-core på landingssiden med panelet åpent:
```bash
npx axe http://localhost:3000/2026 --include="#nasjonalbudsjettet-panel"
```

Rett alle avvik. Minimum som må verifiseres manuelt:

| Test | Forventet |
|---|---|
| Tab fra «Les mer»-knappen | Fokus flyttes inn i panelet |
| Tab gjennom panelet | Kun elementer inne i panelet nås |
| Escape | Panelet lukkes, fokus returnerer til «Les mer» |
| `aria-expanded` på «Les mer» | `true` når panelet er åpent, `false` ellers |
| `role="dialog"` på panelet | Tilstede |
| `aria-modal="true"` | Tilstede |
| iframe `title`-attributt | Inneholder grafens tittel |
| Plassholder `aria-hidden` | `true` |
| `prefers-reduced-motion` | Panel åpnes umiddelbart uten animasjon |

**4c. Responsiv gjennomgang**

Verifiser på tre breakpoints:

| Bredde | Forventet panelbredde | Nøkkeltall-rad |
|---|---|---|
| > 1024px (desktop) | 60% av skjermbredde | Horisontal rad |
| 640–1024px (nettbrett) | 80% av skjermbredde | Horisontal rad, komprimert |
| < 640px (mobil) | 100% av skjermbredde | 2×2-rutenett eller stablet |

### Leveranse

Minst én ekte Highcharts-graf vises i panelet. Alle WCAG AA-krav er oppfylt. Panelet fungerer korrekt på alle tre breakpoints.

---

## Filstruktur etter implementasjon

```
components/
└── nasjonalbudsjettet/
    ├── types.ts
    ├── NasjonalbudsjettetIngressBoks.tsx
    ├── NasjonalbudsjettetIngressBoks.module.css
    ├── NasjonalbudsjettetPanel.tsx
    ├── NasjonalbudsjettetPanel.module.css
    ├── SeksjonsRenderer.tsx
    ├── TekstSeksjon.tsx
    ├── HighchartsEmbed.tsx
    └── GrafPlaceholder.tsx

studio/schemas/
└── nasjonalbudsjettet.ts   (nytt)
```

Eksisterende filer som endres:
- `components/ModulRendrer.tsx` — ny case `'nasjonalbudsjettet'`
- `app/[aar]/page.tsx` — panel-state og GROQ-spørring
- `studio/schemas/index.ts` — registrer nytt skjema

---

## Estimert tidsbruk

| Steg | Beskrivelse | Estimat |
|---|---|---|
| 1 | Ingressboks og panel-skjelett | ½–1 dag |
| 2 | SeksjonsRenderer og plassholdere | ½–1 dag |
| 3 | Sanity-skjema og CMS-integrasjon | 1–1½ dag |
| 4 | Highcharts-grafer og tilgjengelighet | ½–1 dag |
| **Totalt** | | **2½–4½ dager** |

---

## Instruksjonsmal for Claude Code

Bruk denne malen for hvert steg:

```
Gjennomfør steg [N] fra UTVIKLINGSPLAN-NASJONALBUDSJETTET.md.

Kontekst:
- DrillDownPanel er allerede implementert i components/budget/DrillDownPanel.tsx.
  Gjenbruk dens panel-mekanikk (overlay, slide-in CSS, FocusTrap, URL-håndtering) direkte.
- ModulRendrer er i components/ModulRendrer.tsx.
- Panel-state på landingssiden håndteres via [sett inn faktisk variabelnavn].
- Sanity-klient er konfigurert i lib/sanity.ts.

Avslutt i kjørbar tilstand. Kjør `npm run build` og verifiser ingen TypeScript-feil.
```
