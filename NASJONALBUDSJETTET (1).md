# NASJONALBUDSJETTET.md — Modul for nasjonalbudsjettet på statsbudsjettet.no

## 1. Innledning og formål

Nasjonalbudsjettet er et eget stortingsdokument (Meld. St. 1) som skiller seg fra selve statsbudsjettet (Gul bok). Der Gul bok er en detaljert oversikt over statens bevilgninger, er Nasjonalbudsjettet regjeringens helhetlige fremstilling av den **makroøkonomiske situasjonen** — norsk og internasjonal konjunkturutvikling, finanspolitikken i et langsiktig perspektiv, arbeidsmarked, prisvekst, oljefondet og større strukturelle utfordringer.

For publikum er dette den delen av budsjettfremleggelsen som svarer på: *Hvordan går det egentlig med norsk økonomi?* Modulen skal gjøre dette tilgjengelig uten at brukeren trenger å lese 185 sider PDF.

### 1.1 Plassering i sidehierarkiet

Modulen vises på landingssiden som en kompakt boks mellom `plan_for_norge`-seksjonen og `budsjettgrafer`-seksjonen. Når brukeren klikker på boksen, åpnes et sidepanel — tilsvarende drill-down-panelet i budsjettgrafene — som presenterer det fulle innholdet.

```
┌─────────────────────────────────────────┐
│  Hero                                   │
├─────────────────────────────────────────┤
│  Regjeringens plan for Norge (temaer)   │
├─────────────────────────────────────────┤
│  NASJONALBUDSJETTET (ingressboks)       │  ← klikk åpner panel
├─────────────────────────────────────────┤
│  Budsjettgrafer                         │
└─────────────────────────────────────────┘
```

---

## 2. Innholdsstruktur

Meld. St. 1 (2025–2026) er organisert i seks kapitler. Denne modulen prioriterer kapittel 1–3:

| Kapittel | Tittel | Prioritet |
|---|---|---|
| 1 | Hovedlinjer i den økonomiske politikken | Høy — oppsummeres i ingressboksen |
| 2 | De økonomiske utsiktene | Høy — BNP, inflasjon, arbeidsmarked |
| 3 | Budsjettpolitikken | Høy — handlingsregelen, fondsbruk |
| 4 | Andre deler av den økonomiske politikken | Middels — pengepolitikk, SPU, klima |
| 5 | Bedre bruk av samfunnets ressurser | Lav — lenke til PDF |
| 6 | Velferd, fordeling og ulikhet | Lav — lenke til PDF |

---

## 3. Ingressboksen på landingssiden

Ingressboksen er startpunktet for brukeren. Den er kompakt og viser akkurat nok til å trigge nysgjerrighet, og inviterer til å åpne panelet.

### 3.1 Innhold

- **Tittel:** «Nasjonalbudsjettet — tilstanden i norsk økonomi»
- **Badge:** «Meld. St. 1» (øverst til høyre)
- **Ingress:** En redaksjonell setning som oppsummerer årets overordnede budskap
- **3–4 nøkkeltall** i en horisontal rad (se seksjon 5.2 for anbefalte tall)
- **«Les mer»-knapp** som åpner panelet
- **Sekundær lenke:** «Last ned PDF» (rett til Meld. St. 1 på regjeringen.no)

### 3.2 Visuell identitet

Boksen skiller seg visuelt fra de øvrige modulene for å signalisere at dette er et annet dokument enn selve statsbudsjettet:

- Bakgrunnsfarge: lys grå (`--reg-lysgraa`) med venstre-border i marineblå (`--reg-marine`)
- Overskriften bruker samme typografi som øvrige seksjonsoverskrifter
- Nøkkeltallene brukes i samme `nokkeltall`-komponent som resten av siden

---

## 4. Sidepanelet

### 4.1 Åpningsmekanikk

Panelet bruker samme tekniske mekanisme som `DrillDownPanel` i budsjettgrafene: det glir inn fra høyre og dekker deler av landingssiden. På desktop tar det 55–65 % av skjermbredden, på mobil tar det full bredde.

Bakgrunnen dimmeres med en semi-transparent overlay, og fokus flyttes inn i panelet (`focus trap`). Brukeren kan lukke panelet ved å klikke på overlay-en, trykke Escape, eller bruke «Lukk»-knappen øverst i panelet.

URL-en oppdateres til `/2026?panel=nasjonalbudsjettet` slik at panelet kan deles som en direkte lenke.

```typescript
interface NasjonalbudsjettetPanelProps {
  konfigurasjon: NasjonalbudsjettetKonfigurasjon;
  aapen: boolean;
  onLukk: () => void;
}
```

### 4.2 Panelens layout

```
┌─────────────────────────────────────────────────┐
│  [←  Tilbake]          NASJONALBUDSJETTET 2026  │  ← sticky header
│  ─────────────────────────────────────────────  │
│                                                 │
│  Norsk økonomi                                  │
│  [Redaksjonell tekst, 3–5 setninger]            │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  BNP-vekst Fastlands-Norge              │   │
│  │  [Highcharts-graf]                      │   │
│  │  Kilde: Finansdepartementet 2026        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Prisvekst og renter                            │
│  [Redaksjonell tekst]                           │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  [Graf under produksjon — plassholder]  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ... (øvrige seksjoner) ...                     │
│                                                 │
│  [Last ned hele Nasjonalbudsjettet (PDF) →]     │
└─────────────────────────────────────────────────┘
```

Panelet er scrollbart internt. Den sticky headeren øverst viser alltid tittel og «Tilbake»/«Lukk»-knapp.

---

## 5. Innholdsseksjoner og redaksjonelt ansvar

All tekst skrives av redaksjonen i CMS-et. Det er ingen datapipeline — nøkkeltall tastes inn manuelt, og grafer embeddes som Highcharts-kode av admin.

### 5.1 Seksjonstyper i CMS-et

Panelet konfigureres som en fri sekvens av seksjoner:

| Seksjonstype | Innhold | Redigerbart i CMS |
|---|---|---|
| `tekst` | Redaksjonell brødtekst med overskrift (Portable Text) | Rik tekst |
| `highcharts` | Innebygd Highcharts-graf via embed-kode eller iframe | Embed-kode + tittel + kilde |
| `graf_placeholder` | Plassholder mens grafen er under produksjon | Tittel + beskrivelse |
| `nokkeltall_rad` | En horisontal rad med 2–5 nøkkeltall | Etikett + verdi + enhet |

### 5.2 Typisk seksjonssekvens for Nasjonalbudsjettet 2026

```
1. tekst            → «Norsk økonomi» — sammendrag kap. 1
2. highcharts       → BNP-vekst Fastlands-Norge (linjediagram)
3. tekst            → «Prisvekst og renter» — sammendrag kap. 2
4. highcharts       → KPI og inflasjonsmål
5. tekst            → «Arbeidsmarkedet» — sammendrag kap. 2.4
6. highcharts       → Arbeidsledighet
7. tekst            → «Finanspolitikken og handlingsregelen» — sammendrag kap. 3
8. highcharts       → Fondsbruk som % av trend-BNP
9. tekst            → «Oljefondet (SPU)» — sammendrag kap. 4.4
10. highcharts      → Fondsverdien over tid
11. tekst           → «Risikobildet» — kun tekst, ingen graf (sammendrag kap. 2.3)
```

### 5.3 Nøkkeltall i ingressboksen

Anbefalte nøkkeltall for 2026 (tastes inn manuelt):

| Nøkkeltall | Verdi | Enhet | Endring | Positivt er |
|---|---|---|---|---|
| BNP-vekst Fastlands-Norge | 2,1 | % | +0,1 pp | opp |
| Konsumprisvekst (KPI) | 2,2 | % | −0,6 pp | ned |
| Registrert arbeidsledighet | 2,1 | % | 0,0 pp | ned |
| Strukturell fondsbruk | 13,1 | % av trend-BNP | +0,5 pp | nøytral |

---

## 6. Grafintegrasjon med Highcharts

### 6.1 Prinsipp

Grafer produseres av Finansdepartementet/redaksjonen i Highcharts og embeddes av admin i CMS-et. Frontend-applikasjonen gjengir disse uten å kjenne til dataene bak — Nasjonalbudsjettet-grafene er fullstendig redaksjonelt styrte og har ingen kobling til Gul bok-pipelinen.

### 6.2 Embedding

To alternativer støttes:

**Alternativ A — iframe-URL** (enklest for admin): Admin limer inn URL fra Highcharts Cloud. Frontend gjengir en responsiv iframe-wrapper med korrekt høyde og `title`-attributt for tilgjengelighet.

**Alternativ B — Highcharts JSON-konfigurasjon**: Admin limer inn selve Highcharts-konfigurasjonsobjektet som JSON. Frontend-komponenten `<HighchartsEmbed>` instansierer grafen direkte i DOM-en. Gir bedre responsivitet og tilgjengelighet, men krever tilgang til konfigurasjonen.

```typescript
interface HighchartsEmbedProps {
  type: 'iframe' | 'config';
  iframe_url?: string;
  config?: object;
  tittel: string;        // alltid påkrevd — settes som aria-label og figurtekst
  kilde?: string;        // f.eks. «Finansdepartementet / Nasjonalbudsjettet 2026»
  hoyde?: number;        // standard: 380px
}
```

### 6.3 Plassholdere

Mens en graf er under produksjon vises en `graf_placeholder`. Plassholderen har samme dimensjoner som den ferdige grafen, og viser tittel, valgfri beskrivelse og teksten «Graf under produksjon». Admin bytter ut plassholderen med en `highcharts`-seksjon når grafen er klar. Plassholdere er nyttige gjennom hele utviklings- og redaksjonsprosessen.

---

## 7. CMS-konfigurasjon

### 7.1 Ny modultype

```typescript
type ModulType =
  | 'hero'
  | 'plan_for_norge'
  | 'nasjonalbudsjettet'    // ny
  | 'budsjettgrafer'
  | 'nokkeltall'
  | 'egendefinert_tekst';
```

### 7.2 Skjema

```typescript
interface NasjonalbudsjettetKonfigurasjon {
  // Metadata og ingressboks
  tittel: string;
  ingress: string;                   // 1–2 setninger, overordnet budskap
  pdf_lenke: string;                 // URL til Meld. St. 1 på regjeringen.no
  vis_paa_landingsside: boolean;

  // Nøkkeltall i ingressboksen
  nokkeltall: {
    etikett: string;
    verdi: string;            // fritekst, f.eks. «2,1 %»
    endring?: string;         // f.eks. «+0,1 pp»
    retning?: 'opp' | 'ned' | 'nøytral';
    positivt_er?: 'opp' | 'ned';
  }[];

  // Fri seksjonssekvens i panelet
  seksjoner: (
    | { type: 'tekst'; overskrift?: string; innhold: PortableText }
    | { type: 'highcharts'; tittel: string; kilde?: string; iframe_url?: string; config?: object; hoyde?: number }
    | { type: 'graf_placeholder'; tittel: string; beskrivelse?: string; hoyde?: number }
    | { type: 'nokkeltall_rad'; tall: { etikett: string; verdi: string; enhet?: string }[] }
  )[];
}
```

### 7.3 Modulrendrer og panel-state

```typescript
// Modulrendrer utvides:
case 'nasjonalbudsjettet':
  return (
    <NasjonalbudsjettetIngressBoks
      konfigurasjon={modul.konfigurasjon}
      onAapne={() => setAapenPanel('nasjonalbudsjettet')}
    />
  );

// Panel-state håndteres på landingssiden, tilsvarende DrillDownPanel:
{aapenPanel === 'nasjonalbudsjettet' && (
  <NasjonalbudsjettetPanel
    konfigurasjon={...}
    onLukk={() => setAapenPanel(null)}
  />
)}
```

---

## 8. Tilgjengelighet

- Ingressboksen bruker `<section>` med `aria-label`
- «Les mer»-knappen setter `aria-expanded` og `aria-controls` korrekt
- Panelet bruker `role="dialog"` med `aria-modal="true"` og `aria-labelledby`, identisk med `DrillDownPanel`
- Fokus flyttes til panelet ved åpning og returneres til «Les mer»-knappen ved lukking
- Highcharts iframe-grafer får `title`-attributt fra `HighchartsEmbedProps.tittel`
- Plassholdere merkes `aria-hidden="true"`

---

## 9. Redaksjonell arbeidsflyt

| Oppgave | Tidspunkt | Ansvarlig |
|---|---|---|
| Sette opp seksjonsskjelett med `graf_placeholder` for alle grafer | Tidlig, under embargo | Redaktør |
| Skrive redaksjonelle sammendrag per seksjon | Under embargo | Redaktør |
| Taste inn nøkkeltall til ingressboksen | Under embargo | Redaktør |
| Produsere Highcharts-grafer | Under embargo | Grafiker |
| Bytte ut plassholdere med ferdige Highcharts-embeds | Etter at grafer er klare | Admin |
| Godkjenne og aktivere modulen | Rett før publisering | Ansvarlig redaktør |

---

## 10. Avhengigheter til øvrige dokumenter

| Dokument | Avhengighet |
|---|---|
| **DESIGN.md** | Panel-mekanikken (åpning, animasjon, fokushåndtering, overlay) gjenbruker eksakt samme mønster og CSS som `DrillDownPanel`. Fargepalett, typografi og nøkkeltall-komponent gjenbrukes. |
| **CMS.md** | `nasjonalbudsjettet` legges til som ny modultype. `graf_placeholder` er et nytt innholdselement som dokumenteres i CMS.md. |
| **ARCHITECTURE.md** | Modulrendreren utvides med ny case. Panel-state administreres på landingssiden, tilsvarende drill-down. Ingen ny datapipeline. |
| **DATA.md** | Ingen avhengighet — modulen bruker ikke budsjettdatapipelinen. |
