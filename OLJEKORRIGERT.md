# Oljekorrigert budsjett og strukturelt underskudd

Denne filen dokumenterer logikken bak det **oljekorrigerte budsjettet** og det **strukturelle oljekorrigerte underskuddet** slik det er implementert i datapipelinen og presentert på statsbudsjettet.no.

## Grunntanken: «Uten olje og gass»

Vi later som om petroleumsinntektene ikke finnes, og ser bare på den «normale» statsøkonomien. I praksis betyr det to ting:

1. **Fjerne finanstransaksjoner** (utlån, avdrag, aksjetegning — postnummer 90–99) fra beregningen
2. **Trekke fra alle poster direkte knyttet til petroleum** (SPU-overføringer, petroleumsskatter, SDØE, Equinor-utbytte)

---

## Utgiftssiden

Ta alle utgifter med kapittelkoder 1–2999 og postnummer under 90, og trekk fra to petroleumskapitler:

| Komponent | Beløp (2026) | Forklaring |
|-----------|-------------|------------|
| Alle utgifter (kap 1–2999, post 1–89) | 2 721,9 mrd. kr | Drifts- og overføringsutgifter, uten finanstransaksjoner |
| − kap 2800 Innbetaling til SPU | −521,3 mrd. kr | Der petroleumsinntektene parkeres |
| − kap 2440 SDØE-driftsutgifter | −36,1 mrd. kr | Statens egne driftskostnader på sokkelen |
| **= Utgifter uten olje og gass** | **2 164,5 mrd. kr** | |

### Implementasjon (pipeline)

```python
PETRO_KAP_UTGIFT = {2800, 2440}

utg_uten_olje = df[
    (df["side"] == "utgift") &
    (df["post_nr"] < 90) &
    (~df["kap_nr"].isin(PETRO_KAP_UTGIFT))
]
```

---

## Inntektssiden

Ta alle inntekter med kapittelkode 3000 og høyere (inkludert kap 3xxx etatsinntekter), postnummer under 90, og trekk fra seks petroleumskapitler:

| Komponent | Beløp (2026) | Forklaring |
|-----------|-------------|------------|
| Alle inntekter (kap 3000+, post 1–89) | 2 721,9 mrd. kr | Skatter, avgifter og etatsinntekter |
| − kap 5800 SPU-uttaket | −452,2 mrd. kr | Finansieringen fra oljefondet |
| − kap 5507+5508+5509 Petroskatter | −302,5 mrd. kr | Skatt på utvinning + CO₂-avgift + NOx-avgift |
| − kap 5440 SDØE-inntekter | −229,1 mrd. kr | Statens andel av produksjonsinntekter |
| − kap 5685 Equinor-utbytte | −25,8 mrd. kr | Utbytte fra statens Equinor-aksjer |
| **= Inntekter uten olje og gass** | **1 712,2 mrd. kr** | |

### Hvorfor ekskluderes Equinor-utbyttet?

Kap 5685 (Equinor-utbytte) ekskluderes fordi Equinor er en petroleumsbedrift. Utbyttet er reelt sett en forsinket petroleumsinntekt, og å inkludere det ville bryte med prinsippet om å isolere olje og gass fullstendig. Utbytte fra andre statlige selskaper beholdes.

### Implementasjon (pipeline)

```python
PETRO_KAP_INNTEKT = {5800, 5507, 5508, 5509, 5440, 5685}

inn_uten_olje = df[
    (df["side"] == "inntekt") &
    (df["post_nr"] < 90) &
    (~df["kap_nr"].isin(PETRO_KAP_INNTEKT))
]
```

---

## Postnummerregelen: post < 90

Post 90–99 er **finanstransaksjoner** — utlån til Husbanken, avdrag på statens lånekasse, aksjetegning osv. Disse gir ingen reell budsjettmessig belastning fordi de motsvares av en fordring. Finansdepartementet holder dem utenfor det oljekorrigerte underskuddet av samme grunn som de holdes utenfor det strukturelle underskuddet.

---

## Oljekorrigert underskudd

```
Inntekter uten olje og gass   −   Utgifter uten olje og gass   =   Oljekorrigert underskudd
        1 712,2 mrd.           −          2 164,5 mrd.          =        −452,2 mrd.
```

Det oljekorrigerte underskuddet tilsvarer uttaket fra SPU (kap 5800). Dette er en innebygd kontroll: når budsjettet er i balanse (totale utgifter = totale inntekter), vil underskuddet eksakt tilsvare fondstilbakeføringen.

---

## Strukturelt oljekorrigert underskudd

Det **strukturelle oljekorrigerte underskuddet** (579,4 mrd. kr for 2026) kan **ikke** beregnes fra Gul bok alene. Det fremkommer ved at Finansdepartementets økonomer gjør korreksjoner på toppen av det oljekorrigerte underskuddet:

| Begrep | Beløp (2026) |
|--------|-------------|
| Oljekorrigert underskudd (fra Gul bok) | −452,2 mrd. kr |
| Strukturelt oljekorrigert underskudd | −579,4 mrd. kr |
| Differanse (korreksjoner) | −127,2 mrd. kr |

### Korreksjoner som gjøres

1. **Konjunkturkorreksjoner** — Skatteinntektene svinger med konjunkturene. Departementet beregner hva skattenivået ville vært ved normalt aktivitetsnivå i fastlandsøkonomien.

2. **Dagpenger** — I lavkonjunktur stiger dagpengeutgiftene automatisk. Disse konjunkturkomponentene korrigeres bort.

3. **Regnskapsmessige omlegginger** — For 2026 er avvikene rekordhøye fordi Stortinget avviklet skattetrekkskontoordningen. Det gir en kunstig høy skatteinngang i overgangsåret som «forstyrrer» det oljekorrigerte underskuddet. Korreksjonen på 127,2 mrd. kr er i stor grad denne effekten.

Beregningene gjøres i makroøkonomiske modeller (bl.a. MODAG) og publiseres i Nasjonalbudsjettet og Perspektivmeldingen — ikke i Gul bok.

### Implementasjon

Strukturelt underskudd og uttaksprosent må **innputtes manuelt** i pipelinen per budsjettår, via `MANUELLE_TALL` i `berikelse.py`. De eksporteres til JSON og refereres fra CMS via datareferanser:

```
oljekorrigert.strukturelt_underskudd  →  579 400 000 000
oljekorrigert.uttaksprosent           →  3.1
```

---

## Uttaksprosent (handlingsregelen)

Uttaksprosenten beregnes ut fra det **strukturelle** oljekorrigerte underskuddet delt på fondsverdien ved inngangen til budsjettåret:

```
Uttaksprosent = Strukturelt underskudd / Fondsverdi × 100
```

Handlingsregelen tilsier at uttaket over tid ikke skal overstige 3 % av fondskapitalen (forventet realavkastning).

---

## Oppsummering av nøkkeltall (2026)

| Begrep | Verdi |
|--------|-------|
| Totale utgifter (alle poster) | 2 955,2 mrd. kr |
| Totale inntekter (alle poster) | 2 859,7 mrd. kr |
| Utgifter uten olje og gass | 2 164,5 mrd. kr |
| Inntekter uten olje og gass | 1 712,2 mrd. kr |
| Oljekorrigert underskudd | −452,2 mrd. kr |
| Strukturelt oljekorrigert underskudd | −579,4 mrd. kr |
| Overføring fra SPU (kap 5800) | 452,2 mrd. kr |
| Netto kontantstrøm petroleum | 548,0 mrd. kr |

---

## Filtreringskapitler per side

### Utgifter — ekskluderte kapitler
| Kap | Navn | Begrunnelse |
|-----|------|-------------|
| 2800 | Statens pensjonsfond utland | Innbetaling til fondet, ren bokføringspost |
| 2440 | Statens direkte økonomiske engasjement i petroleumsvirksomheten | Statens driftskostnader på sokkelen |

### Inntekter — ekskluderte kapitler
| Kap | Navn | Begrunnelse |
|-----|------|-------------|
| 5800 | Statens pensjonsfond utland | Uttak fra fondet til å dekke underskuddet |
| 5507 | Skatt og avgift på utvinning av petroleum | Petroleumsskatt |
| 5508 | Avgift på utslipp av CO₂ i petroleumsvirksomhet | Petroleumsrelatert CO₂-avgift |
| 5509 | Avgift på NOx-utslipp i petroleumsvirksomhet | Petroleumsrelatert NOx-avgift |
| 5440 | Statens direkte økonomiske engasjement i petroleumsvirksomheten | SDØE-inntekter |
| 5685 | Aksjer i Equinor ASA | Utbytte fra petroleumsselskap |
