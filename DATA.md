# DATA.md — Datamodell og datapipeline for statsbudsjettet.no

## 1. Oversikt over kildedataene

Primærkilden for budsjettdataene er Gul bok, som publiseres årlig som en del av statsbudsjettet. Filen inneholder en flat tabell med 1761 rader (for 2025-budsjettet) og 13 kolonner. Hver rad representerer en budsjettpost på laveste nivå — enten en utgifts- eller inntektspost.

### 1.1 Kolonnestruktur i Gul bok

| Kolonne | Feltnavn | Type | Beskrivelse |
|---------|----------|------|-------------|
| A | `fdep_nr` | int | Fagdepartementets nummer (1–23) |
| B | `fdep_navn` | str | Fagdepartementets navn |
| C | `omr_nr` | int | Programområdenummer (0–34) |
| D | `kat_nr` | int | Programkategorinummer |
| E | `omr_navn` | str | Programområdenavn |
| F | `kat_navn` | str | Programkategorinavn |
| G | `kap_nr` | int | Kapittelnummer |
| H | `post_nr` | int | Postnummer (1–98) |
| I | `upost_nr` | int | Underpostnummer (0, 1 eller 2) |
| J | `kap_navn` | str | Kapittelnavn |
| K | `post_navn` | str | Postnavn |
| L | `stikkord` | str | Stikkord (f.eks. «kan overføres», «overslagsbevilgning») |
| M | `GB` | int | Beløp i kroner (Gul bok-forslaget) |

### 1.2 Skillet mellom utgifter og inntekter

Statsbudsjettet følger en konvensjon der kapittelnummeret avgjør om posten er en utgift eller inntekt. Kapitler under 3000 er utgifter, kapitler fra 3000 og oppover er inntekter. Inntektskapitlet korresponderer med utgiftskapitlet ved at kap. 3XXX er inntektskapitlet til utgiftskap. XXX (f.eks. kap. 1400 Klima- og miljødepartementet har inntektskap. 4400). Unntak er skatte- og avgiftskapitlene (5500-serien) og Statens pensjonsfond utland (5800), som ikke har korresponderende utgiftskapitler på samme måte.

For 2025-budsjettet gir dette følgende hoveddeling:

- **Utgiftssiden:** 1346 poster, totalt 2 970,9 mrd. kr
- **Inntektssiden:** 415 poster, totalt 2 796,8 mrd. kr


## 2. Hierarkisk datamodell

Budsjettet har en naturlig hierarkisk struktur med seks nivåer. Denne strukturen er sentral for drill-down-funksjonaliteten i frontend.

### 2.1 Hierarkinivåer

```
Nivå 1: Side (Utgifter / Inntekter)
  └── Nivå 2: Fagdepartement (fdep_nr + fdep_navn)
        └── Nivå 3: Programområde (omr_nr + omr_navn)
              └── Nivå 4: Programkategori (kat_nr + kat_navn)
                    └── Nivå 5: Kapittel (kap_nr + kap_navn)
                          └── Nivå 6: Post / Underpost (post_nr + upost_nr + post_navn)
```

### 2.2 Fagdepartementer (nivå 2)

Budsjettet er fordelt på 17 fagdepartementer pluss kategorien «Ymse»:

| Nr | Departement |
|----|-------------|
| 1 | Utenriksdepartementet |
| 2 | Kunnskapsdepartementet |
| 3 | Kultur- og likestillingsdepartementet |
| 4 | Justis- og beredskapsdepartementet |
| 5 | Kommunal- og distriktsdepartementet |
| 6 | Arbeids- og inkluderingsdepartementet |
| 7 | Helse- og omsorgsdepartementet |
| 8 | Barne- og familiedepartementet |
| 9 | Nærings- og fiskeridepartementet |
| 11 | Landbruks- og matdepartementet |
| 13 | Samferdselsdepartementet |
| 14 | Klima- og miljødepartementet |
| 15 | Digitaliserings- og forvaltningsdepartementet |
| 16 | Finansdepartementet |
| 17 | Forsvarsdepartementet |
| 18 | Energidepartementet |
| 23 | Ymse |

### 2.3 Programområder (nivå 3)

Det finnes 27 programområder. Merk at nummereringen ikke er sammenhengende (det finnes hull, f.eks. mangler 5, 14, 16, 19, 20, 27). De viktigste programområdene etter størrelse på utgiftssiden:

| Omr. | Navn | Utgifter (mrd. kr) |
|------|------|---------------------|
| 34 | Statens pensjonsfond utland | 724,9 |
| 29 | Sosiale formål, folketrygden | 610,9 |
| 13 | Kommunal- og distriktsdepartementet | 290,5 |
| 10 | Helse og omsorg | 248,1 |
| 7 | Kunnskapsformål | 144,7 |
| 17 | Nærings- og fiskeriformål | 134,3 |
| 4 | Militært forsvar | 110,1 |
| 21 | Innenlands transport | 94,2 |
| 24 | Statlig gjeld og fordringer | 80,2 |
| 9 | Arbeid og sosiale formål | 76,3 |

### 2.4 Postgrupper — en viktig tverrgående dimensjon

Postnummeret har en semantisk betydning som går på tvers av hierarkiet. Denne grupperingen er viktig for å klassifisere bevilgninger etter type:

| Postgruppe | Postnumre | Beskrivelse | Sum (mrd. kr) |
|------------|-----------|-------------|----------------|
| Driftsutgifter | 01–29 | Lønn, varer, tjenester, spesielle driftsutgifter | 522,6 |
| Investeringer | 30–49 | Større utstyrsanskaffelser, bygninger, anlegg | 139,9 |
| Overføringer til statsregnskaper | 50–69 | Overføringer til fond, statlige virksomheter | 1 475,9 |
| Overføringer til private | 70–89 | Tilskudd til kommuner, organisasjoner, næringsliv | 3 188,9 |
| Utlån og statsgjeld | 90–99 | Utlån, avdrag, aksjekjøp | 440,5 |

Denne dimensjonen muliggjør at brukeren f.eks. kan se hvor mye av forsvarsbudsjettet som går til drift versus investeringer.

### 2.5 Stikkord

Stikkord-feltet angir budsjettfullmakter knyttet til posten. De viktigste er:

- **«kan overføres»** — ubrukte midler kan overføres til neste budsjettår
- **«overslagsbevilgning»** — bevilgningen er et anslag og kan overskrides ved behov (typisk for folketrygden)
- **«kan nyttes under ...»** — midler kan omdisponeres mellom poster/kapitler


## 3. Spesielle datastrukturer

### 3.1 Statens pensjonsfond utland (oljefondet)

SPU krever særskilt håndtering i visualiseringen. Området (omr_nr 34) inneholder tre poster:

| Post | Beskrivelse | Beløp (mrd. kr) | Retning |
|------|-------------|------------------|---------|
| Kap. 2800, post 50 | Overføring til fondet | 642,8 | Utgift |
| Kap. 2800, post 96 | Finansposter overført til fondet | 82,1 | Utgift |
| Kap. 5800, post 50 | Overføring fra fondet | 413,6 | Inntekt |

Netto overføring til fondet er 311,3 mrd. kr. I visualiseringen bør SPU behandles som en separat mekanisme. Overføringen fra fondet (413,6 mrd. kr) er det som finansierer det oljekorrigerte underskuddet, og bør vises som en tydelig bro mellom inntekts- og utgiftssiden i stacked barplots.

### 3.2 Folketrygden

Folketrygdens utgifter er fordelt på fire programområder (28, 29, 30 og 33) og utgjør til sammen ca. 702 mrd. kr. Disse er i stor grad «overslagsbevilgninger» og representerer den største enkeltkomponenten i budsjettet. De bør kunne vises både som del av helheten og som en egen fordypningsdel.

### 3.3 Skatter og avgifter

Inntektssiden domineres av skatte- og avgiftskapitlene (omr. 25), som til sammen utgjør 1 807,1 mrd. kr. Disse har en naturlig underkategorisering:

- Inntektsskatt og formuesskatt (personlig og selskap): ca. 430 mrd. kr
- Petroleumsskatter: ca. 381 mrd. kr
- Merverdiavgift: 409,3 mrd. kr
- Trygdeavgift: 197,3 mrd. kr
- Arbeidsgiveravgift: 269,4 mrd. kr
- Øvrige avgifter (tobakk, alkohol, motorvogn, miljø m.m.): ca. 120 mrd. kr


## 4. Datamodell for frontend (JSON)

### 4.1 Anbefalt JSON-struktur

Frontend-dataene bør struktureres som et tre som speiler hierarkiet, med aggregerte summer på hvert nivå. Nedenfor er den anbefalte JSON-strukturen:

```json
{
  "budsjettaar": 2025,
  "publisert": "2024-10-07",
  "valuta": "NOK",
  "utgifter": {
    "total": 2970900000000,
    "omraader": [
      {
        "omr_nr": 10,
        "navn": "Helse og omsorg",
        "total": 248100000000,
        "kategorier": [
          {
            "kat_nr": 710,
            "navn": "Spesialisthelsetjenester",
            "total": 198000000000,
            "kapitler": [
              {
                "kap_nr": 732,
                "navn": "Regionale helseforetak",
                "total": 195000000000,
                "poster": [
                  {
                    "post_nr": 70,
                    "upost_nr": 0,
                    "navn": "Basisbevilgning",
                    "belop": 120000000000,
                    "postgruppe": "overforinger_private",
                    "stikkord": ["kan overføres"],
                    "endring_fra_saldert": null
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "inntekter": {
    "total": 2796800000000,
    "omraader": [...]
  },
  "spu": {
    "overfoering_til_fond": 642800000000,
    "finansposter_til_fond": 82100000000,
    "overfoering_fra_fond": 413600000000,
    "netto_overfoering": 311300000000
  },
  "metadata": {
    "kilde": "Gul bok 2025",
    "saldert_budsjett_forrige": "2024"
  }
}
```

### 4.2 Aggregeringsvisning for stacked barplots

For de to stacked barplots (inntekter og utgifter) på landingssiden trengs en forenklet, aggregert visning. Anbefalingen er å gruppere på programområdenivå, men med SPU-overføringer som et eget visuelt element:

```json
{
  "utgifter_aggregert": [
    { "id": "folketrygden", "navn": "Folketrygden", "belop": 702000000000, "farge": "#..." },
    { "id": "kommuner", "navn": "Kommuner og distrikter", "belop": 290500000000, "farge": "#..." },
    { "id": "helse", "navn": "Helse og omsorg", "belop": 248100000000, "farge": "#..." },
    { "id": "forsvar", "navn": "Forsvar", "belop": 110100000000, "farge": "#..." },
    { "id": "spu_ut", "navn": "Overføring til SPU", "belop": 724900000000, "farge": "#...", "type": "spu" }
  ],
  "inntekter_aggregert": [
    { "id": "skatt_person", "navn": "Skatt på inntekt og formue", "belop": 430000000000, "farge": "#..." },
    { "id": "mva", "navn": "Merverdiavgift", "belop": 409300000000, "farge": "#..." },
    { "id": "petroleum", "navn": "Petroleumsskatter", "belop": 381000000000, "farge": "#..." },
    { "id": "arbeidsgiveravgift", "navn": "Arbeidsgiveravgift", "belop": 269400000000, "farge": "#..." },
    { "id": "trygdeavgift", "navn": "Trygdeavgift", "belop": 197300000000, "farge": "#..." },
    { "id": "spu_inn", "navn": "Overføring fra SPU", "belop": 413600000000, "farge": "#...", "type": "spu" }
  ]
}
```

### 4.3 Endringsdata (sammenligning med saldert budsjett t-1)

For å vise endring fra foregående års salderte budsjett må hvert beløpsfelt utvides med en referanseverdi:

```json
{
  "belop": 110100000000,
  "saldert_forrige": 97200000000,
  "endring_absolut": 12900000000,
  "endring_prosent": 13.3
}
```

Dette krever at saldert budsjett for foregående år også importeres og kobles på samme hierarkiske nøkkel (omr_nr + kat_nr + kap_nr + post_nr + upost_nr).


## 5. Krav til historiske data

### 5.1 Minimumsomfang

For å støtte historiske faner bør følgende årlige datasett lagres:

- **Gul bok (forslaget)** — det opprinnelige budsjettforslaget, fremlagt i oktober
- **Saldert budsjett** — vedtatt budsjett etter Stortingets behandling, typisk i desember
- **Nysaldert budsjett** (valgfritt) — revidert budsjett høsten etter budsjettåret

### 5.2 Utfordringer med historiske data

Departements- og områdestrukturen endres mellom regjeringer. For eksempel ble Digitaliserings- og forvaltningsdepartementet opprettet i 2024. Historiske data må derfor inkludere et mappinglag som gjør det mulig å sammenligne på tvers av strukturendringer. En anbefalt tilnærming er å lagre rådata med den opprinnelige strukturen, og vedlikeholde en egen mappingtabell som definerer ekvivalenser mellom gammel og ny struktur.

### 5.3 Lagringsformat

Historiske data bør lagres som én JSON-fil per budsjettår og budsjetttype (forslag, saldert), med identisk struktur som beskrevet i avsnitt 4.1. Filnavnkonvensjon:

```
data/
  2025/
    gul_bok.json
    saldert.json
  2024/
    gul_bok.json
    saldert.json
    nysaldert.json
  mapping/
    departement_mapping.json
    omraade_mapping.json
```


## 6. Datapipeline

### 6.1 Overordnet flyt

```
[Kilde: Excel/CSV]
       │
       ▼
[Steg 1: Innlesing og validering] ──── Python-skript
       │
       ▼
[Steg 2: Normalisering] ──────────── Trimming, typesetting, nullhåndtering
       │
       ▼
[Steg 3: Hierarkisk aggregering] ──── Bygger trenoden fra bunn og opp
       │
       ▼
[Steg 4: Berikelse] ──────────────── SPU-beregninger, postgruppering, endringsdata
       │
       ▼
[Steg 5: Eksport] ────────────────── JSON-filer (full + aggregert)
       │
       ▼
[Steg 6: Validering] ─────────────── Kontrollsummer, avvik fra forventet total
```

### 6.2 Steg 1 — Innlesing og validering

Bruk `openpyxl` eller `pandas` for innlesing av Excel-filer. Valider at alle forventede kolonner finnes, at beløpsfeltet (GB) er numerisk, og at det ikke finnes uventede null-verdier i nøkkelfeltene (fdep_nr, omr_nr, kap_nr, post_nr).

```python
import pandas as pd

KOLONNER = {
    'fdep_nr': int, 'fdep_navn': str, 'omr_nr': int, 'kat_nr': int,
    'omr_navn': str, 'kat_navn': str, 'kap_nr': int, 'post_nr': int,
    'upost_nr': int, 'kap_navn': str, 'post_navn': str, 'stikkord': str,
    'GB': float
}

def les_gul_bok(filsti: str) -> pd.DataFrame:
    df = pd.read_excel(filsti, dtype={'stikkord': str})
    df.columns = list(KOLONNER.keys())
    for kol in ['fdep_navn', 'omr_navn', 'kat_navn', 'kap_navn', 'post_navn']:
        df[kol] = df[kol].str.strip()
    df['stikkord'] = df['stikkord'].fillna('').str.strip()
    df['side'] = df['kap_nr'].apply(lambda x: 'inntekt' if x >= 3000 else 'utgift')
    return df
```

### 6.3 Steg 2 — Normalisering

Kildefilen har enkelte særtrekk som må håndteres. Tekstverdier har ledende mellomrom som må trimmes. Stikkord-feltet er tomt (NaN) for de fleste poster og må fylles med tom streng. Underpostnummer 0 indikerer at posten ikke har underposter.

### 6.4 Steg 3 — Hierarkisk aggregering

Bygg trestrukturen ved å gruppere nedenfra og opp. Start med poster, aggreger til kapitler, deretter kategorier, programområder, og til slutt totalene.

```python
def bygg_utgiftshierarki(df: pd.DataFrame) -> dict:
    utgifter = df[df['side'] == 'utgift']
    resultat = []

    for (omr_nr, omr_navn), omr_df in utgifter.groupby(['omr_nr', 'omr_navn']):
        kategorier = []
        for (kat_nr, kat_navn), kat_df in omr_df.groupby(['kat_nr', 'kat_navn']):
            kapitler = []
            for (kap_nr, kap_navn), kap_df in kat_df.groupby(['kap_nr', 'kap_navn']):
                poster = []
                for _, rad in kap_df.iterrows():
                    poster.append({
                        'post_nr': int(rad['post_nr']),
                        'upost_nr': int(rad['upost_nr']),
                        'navn': rad['post_navn'],
                        'belop': int(rad['GB']),
                        'postgruppe': klassifiser_postgruppe(rad['post_nr']),
                        'stikkord': parse_stikkord(rad['stikkord'])
                    })
                kapitler.append({
                    'kap_nr': int(kap_nr),
                    'navn': kap_navn,
                    'total': sum(p['belop'] for p in poster),
                    'poster': poster
                })
            kategorier.append({
                'kat_nr': int(kat_nr),
                'navn': kat_navn,
                'total': sum(k['total'] for k in kapitler),
                'kapitler': kapitler
            })
        resultat.append({
            'omr_nr': int(omr_nr),
            'navn': omr_navn,
            'total': sum(k['total'] for k in kategorier),
            'kategorier': kategorier
        })

    return {'total': sum(o['total'] for o in resultat), 'omraader': resultat}
```

### 6.5 Steg 4 — Berikelse

I dette steget legges til avledede felt:

- **SPU-beregninger:** Isoler og beregn netto overføring, brutto overføring begge veier
- **Postgruppering:** Klassifiser hver post i gruppene drift, investering, overføring etc. basert på postnummer
- **Endringsdata:** Koble med saldert budsjett t-1 og beregn absolutt og prosentvis endring
- **Aggregerte visninger:** Generer forenklede datasett for landingssiden

### 6.6 Steg 5 — Eksport

Eksporter til følgende JSON-filer:

| Fil | Innhold | Brukes av |
|-----|---------|-----------|
| `gul_bok_full.json` | Komplett hierarki | Drill-down-visning |
| `gul_bok_aggregert.json` | Aggregerte kategorier for barplots | Landingsside |
| `gul_bok_endringer.json` | Endringsdata mot saldert t-1 | Sammenligningsvisning |
| `metadata.json` | Budsjettår, publiseringsdato, kilder | Headere og faner |

### 6.7 Steg 6 — Validering

Automatiserte kontroller som kjøres etter eksport:

- Sum av alle utgiftsposter skal stemme med kjent total (2 970,9 mrd. kr for 2025)
- Sum av alle inntektsposter skal stemme med kjent total (2 796,8 mrd. kr for 2025)
- Ingen poster med beløp lik null skal mangle (med mindre de faktisk er null i kilden)
- Hierarkinøklene skal være unike på hvert nivå
- JSON-filene skal validere mot et definert JSON Schema


## 7. Datakvalitet og kjente utfordringer

Det er verdt å være oppmerksom på følgende egenskaper ved kildedataene. For det første inneholder Gul bok kun forslaget — saldert budsjett og reviderte budsjetter må hentes fra separate kilder (typisk Stortingets vedtak eller Finansdepartementets datasett). For det andre kan kapittelstrukturen endre seg mellom år, noe som krever mapping for tidsserieanalyser. For det tredje er beløpene i nominelle kroner, og historiske sammenligninger bør ideelt sett justeres for prisvekst. For det fjerde har enkelte poster beløp lik 0, noe som er korrekt — det indikerer at posten finnes men at det ikke bevilges midler.


## 8. Utvidelser

Følgende utvidelser bør vurderes for fremtidige versjoner:

- **Reallokering etter formål:** En alternativ gruppering der utgiftene klassifiseres etter formål (f.eks. COFOG-standarden) i tillegg til departements- og programstrukturen
- **Kobling til makroøkonomiske nøkkeltall:** BNP, oljepris, sysselsetting — for å sette budsjettet i kontekst
- **API-lag:** Et REST-API som gjør det mulig å spørre etter enkeltverdier, aggregeringer og tidsserier uten å laste hele JSON-filer
- **Automatisk innhenting:** Skript for å hente oppdaterte data fra Finansdepartementets nettsider eller data.regjeringen.no
