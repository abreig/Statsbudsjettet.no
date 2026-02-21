# ENDRINGSVISNING.md — Visning av endringer fra saldert budsjett t

## 1. Bakgrunn og datagrunnlag

Regjeringens budsjettforslag (Gul bok t+1) tar alltid utgangspunkt i saldert budsjett t — det er altså de **foreslåtte endringene fra vedtatt budsjett** som er det politisk interessante, ikke absolutte beløp i seg selv. Visning av disse endringene er derfor en kjernefortelling på statsbudsjettet.no.

### 1.1 Filstruktur og nøkler

| Fil | Innhold | Rader (2025) | Nøkkelfelter |
|---|---|---|---|
| `Gul_bok_2025.xlsx` | Forslaget, med hierarki | 1 761 | `kap_nr`, `post_nr`, `upost_nr` |
| `Saldert_budsjett_2025.xlsx` | Vedtatt budsjett | 1 608 | `Kap. nr`, `Postnr.` (uten underposter) |

Den viktigste observasjonen om filene: **saldert budsjett er på post-nivå** (`kap_nr` + `post_nr`), mens Gul bok har underposter (`upost_nr`). Koblingen skjer derfor alltid på aggregert post-nivå — underposter i Gul bok summeres før sammenligning.

Saldert budsjett mangler hierarkikolonnene `fdep_nr`, `omr_nr`, `kat_nr` og tilhørende navn. Disse hentes fra Gul bok ved kobling, og hierarki-konteksten tas alltid fra Gul bok (nye/endrede departementstrukturer reflekteres der).

### 1.2 Match-statistikk (2025-data)

Analyse av sammenkobling mellom Gul bok 2025 og saldert budsjett 2025 (som proxy for å illustrere strukturen):

- **1 588 av 1 591** poster i saldert budsjett matcher en post i Gul bok (99,8 %)
- **3 poster** i saldert uten match i Gul bok = poster som er fjernet i forslaget
- **0 poster** i Gul bok uten match i saldert = alle nye poster identifiseres enkelt

For reell bruk (Gul bok 2026 mot saldert 2025) vil antall avvik typisk være større da budsjettprofiler endres mellom år.

### 1.3 Håndtering av kanttilfeller

| Situasjon | Identifikasjon | Visning |
|---|---|---|
| Ny post i Gul bok | `saldert_belop IS NULL` | Vises med etikett «Ny post», ingen prosentendring |
| Fjernet post (kun i saldert) | Etter kobling, `gb_belop IS NULL` | Tas ikke med i Gul bok-visning; kan vises i egen liste |
| Post med beløp 0 i saldert | `saldert_belop == 0` | Absolutt endring vises, prosentvis settes til `null` (divisjon med 0) |
| Negativ endring (inntektsøkning) | `endring < 0` på inntektsside | Kontekstuelt: inntektsøkning er positivt |

---

## 2. Datapipeline — nødvendige endringer

### 2.1 Nytt prosesseringssteg i `process_gul_bok.py`

Saldert budsjett legges til som en ny datakilde i pipelinen. Steget kjøres etter at Gul bok er prosessert til post-nivå.

```python
# scripts/process_gul_bok.py — nytt steg

import pandas as pd

def les_saldert(saldert_path: str) -> pd.DataFrame:
    """
    Leser saldert budsjett t og returnerer en tabell på post-nivå.
    Saldert har ingen underposter, så ingen aggregering trengs.
    """
    df = pd.read_excel(saldert_path)
    df = df.rename(columns={
        'Kap. nr':       'kap_nr',
        'Postnr.':       'post_nr',
        'Underpostnr.':  'upost_nr',
        'Postsum':       'saldert_belop',
    })
    # Behold kun poster uten underpost (saldert bruker ikke underposter)
    df = df[df['upost_nr'].isna()][['kap_nr', 'post_nr', 'saldert_belop']].copy()
    return df


def beregn_endringsdata(gul_bok_post: pd.DataFrame,
                         saldert: pd.DataFrame) -> pd.DataFrame:
    """
    Kobler Gul bok (aggregert til post-nivå) mot saldert budsjett t.
    Returnerer Gul bok-tabellen beriket med endringsfelter.

    Gul bok må først aggregeres til post-nivå:
        gul_post = gul_bok.groupby(['kap_nr','post_nr'])['GB'].sum().reset_index()
    """
    merged = gul_bok_post.merge(
        saldert,
        on=['kap_nr', 'post_nr'],
        how='left',   # Behold alle Gul bok-poster; saldert_belop=NaN for nye poster
    )

    merged['endring_absolut'] = merged['GB'] - merged['saldert_belop']

    # Unngå divisjon med 0 og NaN
    merged['endring_prosent'] = merged.apply(
        lambda r: (
            None if pd.isna(r['saldert_belop']) or r['saldert_belop'] == 0
            else round(r['endring_absolut'] / abs(r['saldert_belop']) * 100, 1)
        ),
        axis=1,
    )

    merged['er_ny_post'] = merged['saldert_belop'].isna()

    return merged
```

### 2.2 Aggregering til alle hierarkinivåer

Endringsdata beregnes på post-nivå og aggregeres oppover. Prosenttallet på høyere nivåer beregnes alltid fra de aggregerte beløpene — aldri som gjennomsnitt av lavere nivåers prosenttall.

```python
def aggreger_endringer(merged_post: pd.DataFrame, nivaa: str) -> pd.DataFrame:
    """
    nivaa: 'omr_nr' | 'kat_nr' | 'kap_nr'
    """
    grp = merged_post.groupby([nivaa]).agg(
        gb_sum=('GB', 'sum'),
        saldert_sum=('saldert_belop', 'sum'),
    ).reset_index()

    grp['endring_absolut'] = grp['gb_sum'] - grp['saldert_sum']
    grp['endring_prosent'] = (
        grp['endring_absolut'] / grp['saldert_sum'].abs() * 100
    ).round(1)

    return grp
```

### 2.3 JSON-struktur

Endringsdata legges direkte inn som felter på hvert objekt i alle JSON-filer — både `gul_bok_full.json` og `gul_bok_aggregert.json`. En separat `gul_bok_endringer.json` er ikke nødvendig.

**Eksempel — post-nivå:**
```json
{
  "kap_nr": 1352,
  "post_nr": 73,
  "kap_navn": "Jernbanedirektoratet",
  "post_navn": "Kjøp av infrastrukturtjenester",
  "belop": 11667200000,
  "saldert_belop": 11106200000,
  "endring_absolut": 561000000,
  "endring_prosent": 5.1,
  "er_ny_post": false
}
```

**Eksempel — programområde-nivå (aggregert):**
```json
{
  "omr_nr": 21,
  "omr_navn": "Innenlands transport",
  "belop": 95891650000,
  "saldert_belop": 95330650000,
  "endring_absolut": 561000000,
  "endring_prosent": 0.6
}
```

**Ny post (ingen match i saldert):**
```json
{
  "kap_nr": 999,
  "post_nr": 1,
  "belop": 150000000,
  "saldert_belop": null,
  "endring_absolut": null,
  "endring_prosent": null,
  "er_ny_post": true
}
```

### 2.4 Validering

Legg til i valideringssteget:

```python
# Andel poster uten saldert-match bør ikke overstige 10 %
# (mer enn det indikerer feil i kobling eller strukturell endring som krever mapping)
andel_nye = (merged['saldert_belop'].isna().sum() / len(merged))
assert andel_nye < 0.10, f"For mange poster uten saldert-match: {andel_nye:.1%}"

# Totalt saldert-beløp skal stemme med kjent verdi
# (for 2025: ca. 2 970 mrd utgifter + 2 796 mrd inntekter)
```

---

## 3. Visuelle alternativer — analyse

For de to plasseringene (hero og drill-down) finnes ulike presentasjonsmønstre. Her er en systematisk vurdering.

### 3.1 Alternativ A — Inline endringspil (ChangeIndicator)

Den enkleste løsningen: et tall vises normalt, og en liten pil+tall vises ved siden av.

```
110,1 mrd. kr  ↑ +12,9 mrd. (+13,3 %)
```

**Egnet for:** Nøkkeltall i hero, drill-down tabeller på post-nivå.
**Fordel:** Krever ingen ekstra plass. Fungerer godt for enkelttall.
**Ulempe:** Gir ikke romlig forståelse av endringens størrelse relativt til totalbudsjettet. Piler opp/ned kan misforstås på inntektssiden (↑ inntekt er positivt, ↑ utgift kan være negativt).

### 3.2 Alternativ B — Komparativ barplot (side om side)

To barplot ved siden av hverandre: saldert t venstre, forslag t+1 høyre. Samme fargekoding. Brukes i drill-down-panelet.

```
Saldert 2025    Forslag 2026
████████████    █████████████  +8%
██████          ███████        +12%
████            ████           +2%
```

**Egnet for:** Programområde- og programkategori-nivå i drill-down.
**Fordel:** Tydelig romlig sammenligning. Viser hele bildet, ikke bare endringen.
**Ulempe:** Dobler plassen som kreves. Krever at begge bars tegnes i D3. Kan virke overlesset på høye nivåer med mange kategorier.

### 3.3 Alternativ C — Waterfall (fossefallsdiagram)

Viser endringene som positive/negative søyler fra en startverdi.

```
Saldert        +Forsvar  +Helse  -Kommuner  Forslag
2025 total  →  [+12,9]  [+8,2]  [-3,1]  →  2026 total
```

**Egnet for:** Hero-seksjonen for å vise totale utgifter/inntekter og de viktigste driverne.
**Fordel:** Kommuniserer historien om *hva som endret seg* og *hvorfor totalen er annerledes*.
**Ulempe:** Mer kompleks å lese for ikke-økonomer. Krever mer implementasjonstid.

### 3.4 Alternativ D — Avviksbar (lollipop/dot plot)

En horisontal liste der hvert element viser kun endringen som en bar fra 0. Positive og negative på samme akse.

```
Forsvar         ████████████ +12,9 mrd
Helse           █████ +8,2 mrd
Kommuner        ██ +2,1 mrd
Utdanning       | 0
Justis          ▐ -0,4 mrd
```

**Egnet for:** Drill-down på programkategori- og kapittel-nivå. Sortert etter endringens størrelse.
**Fordel:** Meget effektiv visuelt. Tydelig hvilke poster som er endret og hvilke som er uendret.
**Ulempe:** Viser ikke absoluttbeløp — brukeren mister kontekst for om en stor prosentendring er en stor eller liten krone-endring.

### 3.5 Alternativ E — Delta-marker i eksisterende barplot

Den eksisterende stacked barplot beholdes. En tynn horisontal strek legges til inne i hvert segment som markerer fjorårsnivået. Differansen mellom streken og toppen av segmentet viser endringen.

```
████████████████████|  ← endring fra saldert
████████████████████
████████████████████
        (segment)
```

**Egnet for:** Hoveddvisning i budsjettgrafene uten å bryte eksisterende layout.
**Fordel:** Krever ingen ny plass. Legges over eksisterende grafer som et lag.
**Ulempe:** Vanskelig å lese på små segmenter. Fungerer best på de 3–4 største segmentene.

---

## 4. Anbefalt løsning

### 4.1 Hero — nøkkeltall under overskriften

**Valg: Alternativ A (ChangeIndicator) kombinert med C (waterfall) for totaltall**

Hero-seksjonen viser allerede 3–5 nøkkeltallkort. Hvert kort utvides med en `ChangeIndicator`:

```
┌─────────────────────────────┐
│  Totale utgifter            │
│  2 970,9 mrd. kr            │
│  ↑ +82,3 mrd. (+2,9 %)      │
│  fra saldert budsjett 2025  │
└─────────────────────────────┘
```

For de aller viktigste endringstallene (total utgifter, total inntekter, oljekorrigert underskudd) legges i tillegg et lite **waterfall-diagram** inn i hero under nøkkeltallene. Det viser de 3–4 programområdene med størst kronemessig endring som søyler fra 0. Dette gir journalister og interesserte et umiddelbart svar på «hva er annerledes i år» uten å måtte åpne drill-down.

### 4.2 Budsjettgrafer — stacked barplot

**Valg: Alternativ E (delta-marker) som standard, Alternativ B (side-om-side) i drill-down**

I den primære visningen av stacked barplots legges saldert-nivået inn som en hvit strek inne i hvert segment. Denne markøren er synlig som standard — brukeren trenger ikke toggle for å se den. Tooltip ved hover på segmentet viser alltid begge tall.

`ComparisonToggle` beholdes som UX-element, men endrer nå funksjon: den slår av/på `ChangeIndicator`-etikettene (pil + tall) som vises ved siden av segmentnavnene, ikke markøren i seg selv.

### 4.3 Drill-down-panelet — alle nivåer

**Valg: Kombiner alternativ D (avviksbar) og A (ChangeIndicator) avhengig av nivå**

| Nivå | Primærvisualisering | Endringsvisning |
|---|---|---|
| Programområde | Horisontal barplot (eksisterende) | Delta-marker + ChangeIndicator i etikett |
| Programkategori | Horisontal barplot (eksisterende) | Delta-marker + ChangeIndicator i etikett |
| Kapittel | Horisontal barplot (eksisterende) | Delta-marker + ChangeIndicator i etikett |
| Post | BudgetTable | Kolonne «Endring» med absolutt + prosent, sorterbar |
| Post (ny post) | BudgetTable | Kolonne viser «Ny post», ingen tall |

---

## 5. Komponentspesifikasjon

### 5.1 ChangeIndicator (eksisterende, utvidet)

Eksisterende komponent utvides med støtte for inntektsside-kontekst og `er_ny_post`:

```typescript
interface ChangeIndicatorProps {
  endring_absolut: number | null;
  endring_prosent: number | null;
  er_ny_post?: boolean;
  side?: 'utgift' | 'inntekt';  // ny: justerer semantikk av pil-farge
  compact?: boolean;
}
```

For `side='inntekt'`: grønn pil betyr ↑ inntekter (positivt), rød pil betyr ↓ inntekter (negativt) — motsatt av utgiftssiden.

Ny visning for `er_ny_post`:
```
  [NY]  150,0 mill. kr
```

### 5.2 DeltaMarker (ny SVG-komponent)

En enkel SVG-komponent som rendres inne i et barplot-segment og tegner en horisontal strek for saldert-nivå:

```typescript
interface DeltaMarkerProps {
  saldert_belop: number;
  gb_belop: number;
  segment_hoyde_px: number;  // høyden til segmentet i piksler
  segment_bredde_px: number;
  farge?: string;             // standard: hvit med 80% opacity
}
```

Streken plasseres på `(saldert_belop / gb_belop) * segment_hoyde_px` fra bunnen av segmentet. Hvis `saldert_belop > gb_belop` (nedgang), plasseres streken over toppen av segmentet — da vises en liten «overheng»-markør som signaliserer at posten er redusert.

### 5.3 HeroWaterfall (ny komponent)

Et minimalistisk waterfall-diagram under nøkkeltallene i hero-seksjonen:

```typescript
interface HeroWaterfallProps {
  saldert_total: number;
  gb_total: number;
  // De 3–4 programområdene med størst absolutt endring
  drivere: {
    navn: string;
    endring_absolut: number;
  }[];
  side: 'utgift' | 'inntekt';
}
```

Visuell struktur:
```
  Saldert 2025                              Forslag 2026
  2 888,6 mrd.  [+Forsvar] [+Helse] [-Kom]  2 970,9 mrd.
                [+82,3]    [+8,2]   [-3,1]
```

Komponenten er valgfri — redaktøren slår den av/på i CMS-et per budsjettår.

### 5.4 BudgetTable — utvidet med endringskolonner

Tabellen på post-nivå får to nye kolonner:

```typescript
// Nye kolonner i BudgetTableProps
interface BudgetTableKolonne {
  // Eksisterende: postnr, postnavn, belop, postgruppe, stikkord
  // Nye:
  saldert_belop: number | null;
  endring_absolut: number | null;
  endring_prosent: number | null;
  er_ny_post: boolean;
}
```

Kolonnene er synlige som standard og sorterbare. Kolonnen «Endring» sorterer på `endring_absolut`. Nye poster vises med en lys gul bakgrunn (`--reg-gul` med lav opacity) og teksten «Ny» i endringskolonnen.

---

## 6. TypeScript-typer — oppdatert datamodell

Alle beløpsfelter i `budget.ts` utvides:

```typescript
// Eksisterende
interface Post {
  kap_nr: number;
  post_nr: number;
  post_navn: string;
  belop: number;
  // ...
}

// Utvidet
interface Post {
  kap_nr: number;
  post_nr: number;
  post_navn: string;
  belop: number;
  saldert_belop: number | null;
  endring_absolut: number | null;
  endring_prosent: number | null;
  er_ny_post: boolean;
}

// Samme mønster for Kapittel, Programkategori, Programomraade
interface Programomraade {
  omr_nr: number;
  omr_navn: string;
  belop: number;
  saldert_belop: number | null;
  endring_absolut: number | null;
  endring_prosent: number | null;
}
```

---

## 7. CMS-konfigurasjon

Budsjettgrafer-modulen (`budsjettgrafer`) i Sanity utvides med to nye felt:

```typescript
// Ny i NasjonalbudsjettetKonfigurasjon
interface BudsjettgraferKonfigurasjon {
  // Eksisterende
  visEndringDefault: boolean;
  overskrift?: string;
  forklaringstekst?: string;
  spuForklaring?: string;

  // Nye
  vis_waterfall_i_hero: boolean;       // standard: true
  saldert_aar: number;                 // f.eks. 2025 — vises i etiketter
  endring_etikett: string;             // f.eks. «fra saldert budsjett 2025»
}
```

Redaktøren angir `saldert_aar` og `endring_etikett` slik at alle `ChangeIndicator`-komponenter bruker korrekt tekstlig referanse uten hardkoding.

---

## 8. Implementasjonsplan for Claude Code

Fire avgrensede steg som bygger på hverandre:

**Steg 1 — Datapipeline (½ dag)**
Legg til `les_saldert()` og `beregn_endringsdata()` i `scripts/process_gul_bok.py`. Kjør mot `Saldert_budsjett_2025.xlsx` og `Gul_bok_2025.xlsx`. Verifiser at 1 588+ poster matcher og at valideringssjekker passerer. Skriv endringsfelter inn i alle JSON-filer.

**Steg 2 — ChangeIndicator og BudgetTable (½ dag)**
Utvid `ChangeIndicator` med `side`- og `er_ny_post`-props. Legg til endringskolonner i `BudgetTable`. Koble mot `endring_absolut`/`endring_prosent` fra JSON. Test at nye poster vises korrekt.

**Steg 3 — DeltaMarker i StackedBarChart (1 dag)**
Implementer `DeltaMarker`-komponenten og integrer i `BarSegment`. Test at markøren plasseres korrekt for økning, nedgang og ny post. Oppdater `ComparisonToggle` til å styre `ChangeIndicator`-etiketter, ikke markøren.

**Steg 4 — HeroWaterfall (½ dag)**
Implementer `HeroWaterfall` og legg til i `HeroSection`. Legg til CMS-felt `vis_waterfall_i_hero` i Sanity-skjema. Populer med de 3–4 driverne med størst kronemessig endring, beregnet automatisk fra pipeline-dataene.

---

## 9. Åpne spørsmål

- **Fargesemantikk for utgiftsøkninger:** Økte forsvarsutgifter er politisk positivt for gjeldende regjering — men skal alle utgiftsøkninger vises rødt (vanlig konvensjon) eller nøytralt? Anbefaling: bruk nøytralt blå/grønn for økning og grå for nedgang, ikke rød/grønn. Da unngår man politisk konnotasjon.
- **Strukturelle endringer mellom år:** Hvis et kapittel er lagt ned og erstattet av et nytt, vil enkel kap+post-kobling gi mange falske «nye poster». DATA.md nevner `departement_mapping.json` for dette formålet — denne må utvides til å dekke kapittel-restrukturering.
- **Inflasjonsjustering:** Nominelle endringer overvurderer reell vekst i år med høy KPI. Bør tilbys som valgfritt toggle? Krever kun KPI-tall per år og enkel beregning, men kommunikasjonsansvar er krevende.
- **Prosenttall på inntektssiden:** En stor økning i petroleumsskatter er positivt, men kan se «rød» ut med nåværende ChangeIndicator-logikk. `side`-propen håndterer dette, men redaktøren bør bekrefte korrekt konfigurasjon.
