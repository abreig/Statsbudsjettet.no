# CMS Utviklingsplan for statsbudsjettet.no

> Denne planen er skrevet som instruksjoner til Claude Code. Hver fase inneholder konkrete oppgaver med avhengigheter, akseptansekriterier og referanser til prosjektdokumentasjonen. Fasene skal utføres sekvensielt -- ikke hopp over faser.

---

## Fase 0: Orientering og kartlegging

**Mål:** Forstå eksisterende kodebase, arkitektur og nåværende tilstand før du skriver en eneste linje kode.

### 0.1 Les prosjektdokumentasjonen

Les følgende filer grundig og lag en mental modell av systemet:

- `ARCHITECTURE.md` -- overordnet teknisk arkitektur, integrasjonspunkter, systemdiagrammer
- `CMS.md` -- modultyper, redaksjonell arbeidsflyt, datareferanser, innholdsskjemaer
- `DESIGN.md` -- frontend-komponentarkitektur, modulrendreren, URL-struktur
- `DATA.md` -- datamodell, hierarkisk budsjettstruktur, JSON-filformat, valideringsregler

### 0.2 Kartlegg eksisterende kodebase

Utfør en systematisk gjennomgang:

```
Oppgaver:
1. Kjør `tree -I node_modules -L 3` i prosjektroten og analyser mappestrukturen
2. Les package.json -- noter hvilke avhengigheter som allerede er installert
3. Identifiser hvilke komponenter som allerede eksisterer under components/
4. Sjekk om det finnes en data/-mappe med JSON-filer fra datapipelinen
5. Sjekk om det finnes eksisterende CMS-integrasjon (Sanity-konfig, skjemaer, etc.)
6. Les alle eksisterende TypeScript-typer i components/data/types/
7. Kjør `npm run build` og `npm run dev` for å verifisere at prosjektet bygger
8. Kartlegg hvilke sider/ruter som allerede finnes (app/-mappen)
```

### 0.3 Lag en statusrapport

Skriv en kort rapport (til terminalen) som oppsummerer:

- Hvilke av komponentene fra DESIGN.md seksjon 5.2 som allerede er implementert
- Om datapipelinen har generert JSON-filer, og om de følger skjemaet i DATA.md
- Om det finnes noen form for CMS-integrasjon allerede
- Eventuelle avvik mellom spesifikasjon og implementering
- Hvilke avhengigheter som mangler for CMS-arbeidet

**Akseptansekriterium:** Du har en klar oversikt over hva som finnes og hva som mangler, og kan begrunne hvor fase 1 bør starte.

---

## Fase 1: Datamodell og innholdstyper

**Mål:** Etablere den interne datamodellen for CMS-innhold -- TypeScript-typer, JSON-skjemaer og lagringsformat. Alt CMS-innhold lagres som JSON-filer på filsystemet (ikke i en ekstern tjeneste), i tråd med arkitekturens krav om full datasuverenitet.

**Referanse:** CMS.md seksjon 3 (modultyper), seksjon 5 (datareferanser), seksjon 7 (versjonshåndtering), seksjon 8 (innholdsskjema)

### 1.1 Definer TypeScript-typer for innholdsmodellen

Opprett `cms/types.ts` med følgende typer:

```
Typer som skal defineres:
- BudsjettAar          -- toppnivådokument for ett budsjettår
- ModulKonfigurasjon   -- polymorfisk modul med type-diskriminator
- HeroKonfigurasjon    -- hero-modul (tittel, undertittel, nøkkeltall, bilde)
- PlanForNorgeKonfig   -- tema-modul med liste av Tema-objekter
- Tema                 -- ett tema (tittel, ikon, farge, problembeskrivelse, 
                          prioriteringer, sitat, bilde, budsjettlenker, analysegrafer)
- BudsjettgraferKonfig -- konfig for budsjettvisualisering
- NokkeltallKonfig     -- liste med nøkkeltall (etikett, verdi, enhet, datareferanse)
- EgendefinertTekst    -- fri tekst-modul (tittel, innhold, bakgrunnsfarge, bredde)
- Datareferanse        -- strengbasert peker til JSON-datastruktur
- Sitat                -- sitattekst, personnavn, tittel, bilde
- PubliseringsStatus   -- 'draft' | 'pending_review' | 'approved'
- Nokkeltall           -- etikett, verdi, enhet, endringsindikator, datareferanse
- BudsjettLenke        -- omr_nr, etikett, automatisk beløp
- StatusLogg           -- tidsstempel, bruker, fra-status, til-status
```

### 1.2 Definer lagringsformat for CMS-innhold

Opprett JSON-skjema for CMS-innholdsfiler. Innholdet for hvert budsjettår lagres som:

```
cms/
├── content/
│   ├── 2026/
│   │   ├── budsjettaar.json      -- hovedinnholdsdokument
│   │   ├── moduler/
│   │   │   ├── hero.json
│   │   │   ├── plan_for_norge.json
│   │   │   ├── budsjettgrafer.json
│   │   │   ├── nokkeltall.json
│   │   │   └── egendefinert_tekst_1.json
│   │   └── metadata.json         -- status, endringslogg, publiseringshistorikk
│   └── 2025/
│       └── ...
└── schemas/
    └── budsjettaar.schema.json   -- JSON Schema for validering
```

### 1.3 Implementer datareferanseoppløser

Opprett `cms/lib/datareferanse.ts`:

```
Funksjonalitet:
- parseDatareferanse(ref: string) → strukturert sti-objekt
- resolveDatareferanse(ref: string, budsjettdata: BudsjettData) → number | string | null
- validerDatareferanse(ref: string, tilgjengeligeNøkler: string[]) → boolean

Eksempler som skal støttes:
- "utgifter.total"
- "utgifter.omraader[omr_nr=4].total"
- "spu.overfoering_fra_fond"
- "endringer.utgifter.omraader[omr_nr=10].endring_prosent"
```

### 1.4 Implementer innholdslasting og skriving

Opprett `cms/lib/storage.ts`:

```
Funksjonalitet:
- loadBudsjettaar(aar: number) → BudsjettAar
- saveBudsjettaar(aar: number, innhold: BudsjettAar) → void
- loadModul(aar: number, modulId: string) → ModulKonfigurasjon
- saveModul(aar: number, modulId: string, modul: ModulKonfigurasjon) → void
- listBudsjettaar() → number[]
- kopierBudsjettaar(fraAar: number, tilAar: number) → BudsjettAar
- lastStatusLogg(aar: number) → StatusLogg[]
- leggTilStatusLogg(aar: number, entry: StatusLogg) → void
```

**Akseptansekriterier:**
- Alle TypeScript-typer kompilerer uten feil
- Datareferanseoppløseren klarer alle fire eksemplene over
- Innhold kan lagres og leses tilbake identisk (round-trip)
- `kopierBudsjettaar` oppretter ny årsstruktur med tomme innholdsfelt men beholdt modulstruktur

---

## Fase 2: CMS Backend API

**Mål:** Bygge API-ruter (Next.js Route Handlers) som CMS-frontenden kan kalle for å lese, skrive og administrere innhold. Disse rutene kjører kun i utviklingsmiljø/admin-miljø, aldri i produksjonsbygget for den offentlige nettsiden.

**Referanse:** ARCHITECTURE.md seksjon 6 (API-design), CMS.md seksjon 4 (arbeidsflyt), seksjon 6.3 (tilgangsstyring)

### 2.1 Autentisering og autorisasjon

Opprett `cms/lib/auth.ts`:

```
Funksjonalitet:
- Enkel sesjonsbasert autentisering (for utvikling: JSON-fil med brukere)
- Fire roller: administrator, redaktør, godkjenner, leser
- Middleware-funksjon: requireRole(rolle: Rolle) → sjekker tilgang
- Alle CMS API-endepunkter skal autentiseres
```

### 2.2 API-ruter for innholdshåndtering

Opprett Next.js Route Handlers under `app/api/cms/`:

```
Ruter:
GET    /api/cms/budsjettaar              → list alle budsjettår
POST   /api/cms/budsjettaar              → opprett nytt budsjettår (kopiering)
GET    /api/cms/budsjettaar/[aar]        → hent innhold for ett år
PUT    /api/cms/budsjettaar/[aar]        → oppdater innhold for ett år

GET    /api/cms/budsjettaar/[aar]/moduler           → list moduler
GET    /api/cms/budsjettaar/[aar]/moduler/[id]      → hent én modul
PUT    /api/cms/budsjettaar/[aar]/moduler/[id]       → oppdater modul
POST   /api/cms/budsjettaar/[aar]/moduler            → legg til ny modul
DELETE /api/cms/budsjettaar/[aar]/moduler/[id]       → slett modul
PATCH  /api/cms/budsjettaar/[aar]/moduler/rekkefølge → endre rekkefølge

POST   /api/cms/budsjettaar/[aar]/status             → endre status (draft → pending_review → approved)
GET    /api/cms/budsjettaar/[aar]/logg               → hent endringslogg

GET    /api/cms/datareferanser/[aar]                 → list tilgjengelige datareferanser
POST   /api/cms/datareferanser/[aar]/resolve         → oppløs en datareferanse mot faktisk data
```

### 2.3 Validering og feilhåndtering

```
Krav:
- Alle PUT/POST-endepunkter validerer inndata mot TypeScript-typene
- Datareferanser valideres mot tilgjengelige nøkler i budsjettdataene
- Statusoverganger valideres (kun draft→pending_review→approved, ikke hopp)
- Kun godkjenner-rolle kan endre status til 'approved'
- Feilmeldinger på norsk bokmål
- Alle endringer logges med tidsstempel og brukeridentitet
```

**Akseptansekriterier:**
- Alle API-ruter returnerer korrekt data og statuskoder
- Uautentiserte forespørsler avvises med 401
- Feil rolle avvises med 403
- Ugyldig inndata avvises med 400 og beskrivende feilmelding
- Statusoverganger logges korrekt

---

## Fase 3: CMS Frontend -- redigeringsgrensesnitt

**Mål:** Bygge et norskspråklig redigeringsgrensesnitt der redaktører kan redigere innhold, organisere moduler og forhåndsvise resultatet. Grensesnittet kjører som en egen rute (`/admin`) i Next.js-applikasjonen.

**Referanse:** CMS.md seksjon 6 (brukervennlighet), seksjon 4 (arbeidsflyt), DESIGN.md seksjon 7.2 (modularkitektur)

### 3.1 Admin-layout og navigasjon

Opprett `app/admin/` med følgende sidestruktur:

```
app/admin/
├── layout.tsx                  -- admin-layout med sidemeny
├── page.tsx                    -- dashboard: oversikt over budsjettår og status
├── [aar]/
│   ├── page.tsx               -- moduloversikt for ett budsjettår
│   ├── moduler/
│   │   └── [modulId]/
│   │       └── page.tsx       -- redigering av én modul
│   ├── forhåndsvisning/
│   │   └── page.tsx           -- full forhåndsvisning
│   └── status/
│       └── page.tsx           -- statusflyt og godkjenning
└── innstillinger/
    └── page.tsx               -- brukeradministrasjon, systeminnstillinger
```

### 3.2 Dashboard (oversikt)

```
Funksjonalitet:
- Listevisning av alle budsjettår med publiseringsstatus
- Knapp: «Opprett nytt budsjettår» (kopierer forrige års struktur)
- Statusindikator per år: utkast / til godkjenning / godkjent / publisert
- Sist endret-tidsstempel og hvem som endret
- Norskspråklig grensesnitt gjennomgående
```

### 3.3 Moduloversikt og sortering

```
Funksjonalitet:
- Visuell liste over alle moduler for valgt budsjettår
- Dra-og-slipp for å endre rekkefølge (brukerhistorie C8)
- Synlighets-toggle (øye-ikon) per modul
- Forhåndsvisning-thumbnail per modul
- Knapp: «Legg til modul» med meny over tilgjengelige modultyper
- Advarselsikon dersom en synlig modul mangler påkrevd innhold (D14)
```

Teknisk: Bruk `@dnd-kit/core` for dra-og-slipp.

### 3.4 Modulredigerere

Implementer én redigeringskomponent per modultype:

**Hero-redigerer:**
```
Felter: tittel (tekst), undertittel (tekst), nøkkeltall (liste med NokkeltallEditor),
        bakgrunnsbilde (filopplasting)
Spesielt: Nøkkeltall-editoren skal ha mulighet for å velge datareferanse
          fra en dropdown med tilgjengelige nøkler, eller skrive inn manuell verdi.
```

**Plan for Norge-redigerer:**
```
Felter per tema: tittel, ikon (velger), farge (fargevelger), 
                 problembeskrivelse (rik tekst), prioriteringer (rik tekst),
                 sitat (SitatEditor), bilde (filopplasting),
                 budsjettlenker (liste med omr_nr-velger),
                 analysegrafer (konfigurasjon)
Spesielt: Temaer kan legges til, fjernes og omorganiseres.
          Budsjettlenker viser automatisk beløp fra datareferanse.
```

**Nøkkeltall-redigerer:**
```
Felter: tittel, layout-valg (horisontal/vertikal/rutenett),
        liste med nøkkeltall (etikett, verdi/datareferanse, enhet, endringsindikator)
```

**Egendefinert tekst-redigerer:**
```
Felter: tittel, innhold (TipTap rik tekst-editor), bakgrunnsfarge (fargevelger),
        bredde (smal/bred/fullbredde)
```

### 3.5 Rik tekst-editor

Integrer TipTap som rik tekst-editor:

```
Krav:
- Støtte for: avsnitt, overskrifter (h2, h3, h4), uthevinger (bold, italic),
  lenker, bilder, og innfelte nøkkeltall
- Lim inn fra Word: automatisk konvertering av formatering (brukerhistorie B4)
- Norsk stavekontroll (nettleserens innebygde)
- Verktøylinje med visuell formatering
```

Avhengigheter: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`

### 3.6 Datareferansevelger

Opprett en gjenbrukbar komponent `DatareferanseVelger`:

```
Funksjonalitet:
- Dropdown med trestruktur over tilgjengelige datanøkler
- Henter tilgjengelige nøkler fra /api/cms/datareferanser/[aar]
- Viser oppløst verdi i sanntid når en referanse velges
- Mulighet for manuell overstyring (brukerhistorie E18)
- Visuell indikator: blått felt = automatisk fra data, gult felt = manuell overstyring
```

**Akseptansekriterier:**
- Alle modultyper kan redigeres og lagres
- Dra-og-slipp endrer rekkefølge og persisteres
- Innliming fra Word beholder avsnitt, overskrifter og uthevinger (ikke Word-styling)
- Datareferanser oppløses korrekt og viser faktiske tall
- Alle feltetiketter, hjelpetekster og feilmeldinger er på norsk bokmål
- Grensesnittet fungerer responsivt (desktop-fokus, men ikke ødelagt på nettbrett)

---

## Fase 4: Forhåndsvisning og kvalitetssikring

**Mål:** Implementere sanntids forhåndsvisning, validering og delbare preview-lenker.

**Referanse:** CMS.md seksjon 4.2 (forhåndsvisning), seksjon 4.4 (kvalitetssikring)

### 4.1 Forhåndsvisning i CMS

```
Funksjonalitet:
- Forhåndsvisningsrute: /admin/[aar]/forhåndsvisning
- Rendrer den offentlige siden med CMS-innhold (ikke-publisert)
- Veksling mellom desktop, nettbrett og mobil (brukerhistorie D13)
- Plassholder-data for budsjettall dersom data ikke er importert enda (A3)
- Oppdateres automatisk når innhold lagres (uten full sideopplasting)
```

### 4.2 Delbar forhåndsvisningslenke

```
Funksjonalitet:
- Generer en tidsbegrenset forhåndsvisningslenke (brukerhistorie D15)
- Lenken krever ikke CMS-innlogging
- Lenken utløper etter 7 dager eller kan tilbakekalles
- URL-format: /preview/[aar]/[token]
- Viser et tydelig banner: «Dette er en forhåndsvisning -- ikke publisert innhold»
```

### 4.3 Innholdsvalidering

```
Valideringsregler:
- Sjekk alle synlige moduler for manglende påkrevd innhold
- Valider datareferanser mot tilgjengelige nøkler
- Sjekk at bilder har alt-tekst (WCAG)
- Sjekk at alle lenker har gyldig mål
- Vis valideringsresultat som en sjekkliste i admin-grensesnittet
- Blokkér statusovergang til «til godkjenning» dersom kritiske feil finnes
```

### 4.4 Sidestilt redigering og forhåndsvisning

```
Funksjonalitet:
- Valgfri split-view i modulredigereren: editor til venstre, forhåndsvisning til høyre
- Forhåndsvisningen oppdateres i sanntid mens redaktøren skriver
- Kan slås av for å gi editoren full bredde
```

**Akseptansekriterier:**
- Forhåndsvisningen er visuelt identisk med produksjonsnettsiden
- Responsiv veksling fungerer korrekt
- Delbar lenke fungerer uten innlogging
- Validering fanger opp manglende felt og ugyldige datareferanser

---

## Fase 5: Godkjenningsflyt og publisering

**Mål:** Implementere den redaksjonelle godkjenningsflyten fra utkast til tidsstyrt publisering.

**Referanse:** CMS.md seksjon 4.4 (godkjenning), seksjon 4.5 (publisering)

### 5.1 Statusflyt

```
Statusoverganger:
  draft → pending_review    (krever: redaktør-rolle, validering bestått)
  pending_review → draft    (krever: godkjenner-rolle, med kommentar)
  pending_review → approved (krever: godkjenner-rolle)
  approved → draft          (krever: godkjenner-rolle, med kommentar)

Alle overganger logges med: tidsstempel, bruker, fra-status, til-status, kommentar
```

### 5.2 Godkjenningsvisning

```
Funksjonalitet:
- Dedikert side for godkjenner: /admin/[aar]/status
- Samlet oversikt over alle moduler med innhold-preview
- Mulighet for å legge inn kommentarer per modul
- Godkjenn/avvis-knapper
- Endringslogg med tidslinje
```

### 5.3 Tidsstyrt publisering

```
Funksjonalitet:
- Planlegg publisering: dato og klokkeslett (brukerhistorie F21)
- Standard: første tirsdag i oktober kl. 10:00
- Cron-jobb eller scheduled task som trigger bygg på planlagt tidspunkt
- Visuell nedtelling i admin: «Publisering om 2 dager, 4 timer, 12 minutter»
- «Kill switch» -- avbryt planlagt publisering (brukerhistorie F22)
- Etter publisering: trigger Next.js-bygg med godkjent innhold + budsjettdata
```

### 5.4 Integrasjon med byggesystemet

```
Funksjonalitet:
- POST /api/cms/publiser/[aar] → trigger nytt Next.js-bygg
- Bygget kombinerer godkjent CMS-innhold med budsjettdata-JSON
- Datareferanser oppløses ved byggetidspunktet
- Etter vellykket bygg: oppdater status til «publisert» med tidsstempel
- Ved feil i bygg: varsle redaktør, hold på godkjent status
```

**Akseptansekriterier:**
- Statusoverganger følger reglene strengt
- Kun godkjenner kan godkjenne eller avvise
- Kommentarer ved avvisning er obligatoriske
- Tidsstyrt publisering fungerer korrekt
- Kill switch stopper planlagt publisering
- Hele endringsloggen er sporbar

---

## Fase 6: Samarbeid og import

**Mål:** Implementere samarbeidsfunksjonalitet og Word-import for å støtte den parallelle arbeidsflyten.

**Referanse:** Brukerhistorier G23-G25 (samarbeid), B4-B6 (Word-import)

### 6.1 Tilstedeværelsesindikator

```
Funksjonalitet:
- Vis hvem som redigerer samme budsjettår akkurat nå (brukerhistorie G23)
- Vis hvilken modul de jobber i
- Implementeres med Server-Sent Events (SSE) eller WebSocket
- Avatar/initialer + modulnavn i admin-headeren
```

### 6.2 Endringslogg og kommentarer

```
Funksjonalitet:
- Fullstendig endringslogg: hvem endret hva og når (brukerhistorie G24)
- Diff-visning for tekstendringer
- Interne kommentarer per modul og per felt (brukerhistorie G25)
- Kommentarer synlige kun i admin, aldri på offentlig nettside
- Mulighet for å merke kommentar som «løst»
```

### 6.3 Word-import

```
Funksjonalitet:
- Filopplastingskomponent som aksepterer .docx-filer (brukerhistorie B5)
- Konverter Word-formatering til TipTap-kompatibelt innhold
- Behold: overskrifter, avsnitt, bold, italic, lenker
- Fjern: Word-spesifikk styling, kommentarer, spor endringer
- Valgfritt: la redaktøren mappe seksjoner i Word-dokumentet til moduler
```

Avhengighet: `mammoth` (for .docx → HTML-konvertering)

### 6.4 Varsling ved dataimport

```
Funksjonalitet:
- Varsle redaktører når nye budsjettdata er importert (brukerhistorie E16)
- Vis en sammenstilling: «Nye data importert. 3 datareferanser har endrede verdier.»
- Liste over berørte moduler med gamle og nye verdier
```

**Akseptansekriterier:**
- Tilstedeværelse vises i sanntid (< 2 sekunder forsinkelse)
- Endringslogg lagrer alle endringer med bruker og tidsstempel
- Word-import beholder korrekt formatering og fjerner Word-søppel
- Varsling ved dataimport viser riktige endringer

---

## Fase 7: Integrasjon med eksisterende frontend

**Mål:** Koble CMS-innholdet til den eksisterende modulrendreren og sikre at datareferanser oppløses korrekt ved byggetidspunktet.

**Referanse:** ARCHITECTURE.md seksjon 5.1 (modulrendreren), seksjon 10.4 (datareferanser)

### 7.1 Oppdater getStaticProps / generateStaticParams

```
Funksjonalitet:
- Hent CMS-innhold fra lokale JSON-filer (ikke API-kall ved byggetid)
- Oppløs alle datareferanser til konkrete verdier
- Kombiner CMS-innhold med budsjettdata
- Generer statiske sider per budsjettår
```

### 7.2 Oppdater modulrendreren

```
Funksjonalitet:
- Modulrendreren leser CMS-konfigurasjon (type, synlighet, rekkefølge)
- Hver modulkomponent mottar sine CMS-konfigurerte props
- Støtte for egendefinerte tekstblokker med rik tekst-rendering
- Sikre at moduler uten påkrevd innhold ikke rendres (graceful fallback)
```

### 7.3 Bygg-hook for publisering

```
Funksjonalitet:
- Webhook-endepunkt: POST /api/revalidate
- Trigger ISR (Incremental Static Regeneration) for berørte sider
- Alternativt: trigger full re-bygg ved publisering
- Verifiser at bygget er vellykket før status endres til «publisert»
```

**Akseptansekriterier:**
- Offentlig nettside rendrer moduler i korrekt rekkefølge basert på CMS-konfig
- Datareferanser viser riktige budsjettall
- Skjulte moduler vises ikke
- Bygget feiler dersom en datareferanse ikke kan oppløses (fail fast)

---

## Fase 8: Etterarbeid og historikk

**Mål:** Støtte oppdateringer etter publisering og historiske budsjetter.

**Referanse:** CMS.md seksjon 4.6 (etterarbeid), seksjon 7 (versjonshåndtering)

### 8.1 Post-publisering redigering

```
Funksjonalitet:
- Etter publisering kan redaktører gjøre justeringer (brukerhistorie H26)
- Endringer krever ny godkjenning og re-publisering
- Publiseringshistorikk bevares (tidsstempel, hvem, hva)
```

### 8.2 Import av oppdaterte budsjettdata

```
Funksjonalitet:
- Støtte for import av nye JSON-filer (budsjettforlik, nysaldert) (brukerhistorie H27)
- Automatisk varsling til redaktører om hvilke verdier som er endret
- Mulighet for å legge til egendefinert tekstblokk om forliket
```

### 8.3 Historisk låsing

```
Funksjonalitet:
- Historiske budsjettår låses for redigering etter publisering (brukerhistorie H28)
- Administrator kan eksplisitt låse opp ved behov
- Visuell indikator: «Låst -- publisert [dato]»
```

**Akseptansekriterier:**
- Post-publisering-redigering krever ny godkjenning
- Dataimport varsler korrekt om endrede verdier
- Historiske år er låst med tydelig visuell indikator

---

## Tverrgående krav (gjelder alle faser)

### Tilgjengelighet
- Alle admin-sider skal tilfredsstille WCAG 2.1 AA
- Tastaturnavigasjon skal fungere i hele admin-grensesnittet
- Fokusindikatorer skal være synlige

### Norsk bokmål
- Alt grensesnitt, alle feltetiketter, hjelpetekster, feilmeldinger og systemtekster på norsk bokmål
- Bruk æ, ø, å korrekt

### Feilhåndtering
- Aldri vis rå feilmeldinger eller stack traces til brukeren
- Alle feil skal ha en forståelig norsk feilmelding
- Lagring skal ha autosave med visuell indikator

### Testing
- Skriv Vitest-tester for datareferanseoppløseren
- Skriv Vitest-tester for statusoverganger
- Skriv Vitest-tester for API-ruter (innholdshåndtering, validering)

---

## Faseoversikt og avhengigheter

```
Fase 0: Orientering          ──→  Fase 1: Datamodell
                                      │
                                      ▼
                                  Fase 2: Backend API
                                      │
                                      ▼
                                  Fase 3: CMS Frontend  ──→  Fase 6: Samarbeid/import
                                      │
                                      ▼
                                  Fase 4: Forhåndsvisning
                                      │
                                      ▼
                                  Fase 5: Godkjenning/publisering
                                      │
                                      ▼
                                  Fase 7: Frontend-integrasjon
                                      │
                                      ▼
                                  Fase 8: Etterarbeid/historikk
```

Fase 6 (samarbeid/import) kan utvikles parallelt med fase 4-5 da den har relativt uavhengig funksjonalitet.

---

## Tekniske avhengigheter (npm-pakker)

```
Nye avhengigheter som vil trengs:
- @tiptap/react, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-image
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- mammoth                        (Word .docx → HTML konvertering)
- zod                            (runtime-validering av API-inndata)
- date-fns                       (datoformatering, norsk locale)
- node-cron                      (tidsstyrt publisering)

Allerede forventet i prosjektet:
- next, react, typescript, d3
```
