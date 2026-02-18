# CMS.md -- Publikasjonsverktøy for statsbudsjettet.no

## 1. Innledning og formål

Statsbudsjettet.no er en publikasjonsplattform der regjeringens politiske prosjekt og budsjettallene presenteres for allmennheten. Kommunikasjonsprosessen rundt budsjettet involverer mange aktører som må bli enige om innhold, vinkling og presentasjon -- ofte under tidspress i ukene før budsjettfremleggelsen. Publikasjonsverktøyet (CMS) må derfor være enkelt nok til at ikke-tekniske redaktører kan endre innhold, moduler og datagrunnlag uten å involvere utviklere, men samtidig fleksibelt nok til å tilpasse sidene mellom budsjettår.

Dokumentet beskriver modultyper og konfigurasjon, redaksjonell arbeidsflyt, kobling mellom datagrunnlag og moduler, krav til brukervennlighet, og versjonshåndtering mellom budsjettår. Det bygger på spesifikasjonene i DATA.md (datamodell og pipeline) og DESIGN.md (frontend-arkitektur), og er forankret i brukerbehovene beskrevet i prosjektets grunnlagsdokumenter.


## 2. Arkitekturvalg: headless CMS

Plattformen bygges med et headless CMS (Sanity anbefales, med Strapi som alternativ) som datakilde for alt redaksjonelt innhold. Budsjettdataene lever i et separat datalag bestående av statiske JSON-filer generert av datapipelinen (jf. DATA.md avsnitt 6). Denne todelingen er et bevisst arkitekturvalg: redaktørene eier tekst, bilder, sitater, rekkefølge og synlighet gjennom CMS-et, mens tallgrunnlaget forblir uforanderlig og konsistent gjennom pipelinen.

Frontend-applikasjonen (Next.js) henter innhold fra begge kilder ved byggetidspunktet (SSG) og kombinerer dem til den ferdige siden. Dette betyr at en innholdsendring i CMS-et utløser en ny bygg- og deploysyklus, men aldri krever kodeendringer.

### 2.1 Ansvarsfordeling mellom CMS og datapipeline

Redaktører styrer gjennom CMS-et alt redaksjonelt innhold: hero-tekster og nøkkeltall, innholdet i «Plan for Norge»-temaene (problembeskrivelser, prioriteringer, sitater, bilder), rekkefølge og synlighet på alle moduler på landingssiden, metadata som publiseringsdato og kildehenvisninger, samt egendefinerte tekstblokker.

Datapipelinen styrer alt tallmateriale: budsjettall og det hierarkiske treet (fra Gul bok), endringsdata mot saldert budsjett t-1, SPU-beregninger (overføringer til og fra fondet), og aggregerte datasett for barplottene på landingssiden.

Denne grensedragningen sikrer at redaktører aldri kan overskrive verifiserte budsjettall ved et uhell, samtidig som de har full kontroll over den politiske innrammingen og kommunikasjonen.


## 3. Modultyper og konfigurasjon

Landingssiden er bygget opp av moduler som kan skjules, omorganiseres og konfigureres i CMS-et. Hver modul har en type-identifikator, et synlighetsflagg, et rekkefølgenummer og et modulspesifikt konfigurasjonsobjekt. Modularkitekturen gjør det mulig å tilpasse siden mellom budsjettår uten kodeendringer.

### 3.1 Hero-modul (`hero`)

Hero-modulen er det første brukeren ser og setter rammen for hele budsjettfremleggelsen. Den inneholder årstall, en hovedtittel, en undertittel og et sett med nøkkeltall.

Konfigurerbare felter i CMS-et:

- **Årstall** (`aar`): Heltall, f.eks. 2025. Brukes i overskriften og som nøkkel for å koble til riktig datagrunnlag.
- **Hovedtittel** (`tittel`): Kort, slagkraftig tekst, f.eks. «Statsbudsjettet 2025».
- **Undertittel** (`undertittel`): Valgfri utdypende tekst som gir politisk kontekst.
- **Nøkkeltall** (`nokkeltall`): En liste med 3--5 nøkkeltall som redaktøren definerer. Hvert nøkkeltall har en etikett (f.eks. «Totale utgifter»), en verdi (f.eks. «2 970,9 mrd. kr»), og en valgfri endringsindikator fra forrige år. Nøkkeltallene kan enten tastes inn manuelt eller hentes automatisk fra datapipelinen via en referansenøkkel (`datareferanse`), slik at redaktøren kan velge mellom manuell overstyring og automatisk oppdatering.
- **Bakgrunnsbilde** (`bakgrunnsbilde`): Valgfritt bilde som vises bak hero-teksten.

### 3.2 Plan for Norge-modul (`plan_for_norge`)

Denne modulen presenterer regjeringens fem temaområder og er den politiske innrammingen av budsjettet. Modulen rendres som et horisontalt rutenett av temakort (ThemeCard) som kan ekspanderes til detaljvisninger (ThemeDetail).

Konfigurerbare felter per tema:

- **Tittel** (`tittel`): Temaets navn, f.eks. «Trygghet for økonomien».
- **Ingress** (`ingress`): 1--2 setninger som vises på det kompakte kortet.
- **Aksentfarge** (`farge`): Hex-verdi for temaets visuelle identitet. Standardverdier er definert (se DESIGN.md seksjon 5.1), men kan overstyres for et nytt budsjettår dersom regjeringens visuelle profil endrer seg.
- **Ikon** (`ikon`): Referanse til et grafisk element som vises på kortet.
- **Problembeskrivelse** (`problembeskrivelse`): Rik tekst (Portable Text i Sanity) med analyse av utfordringsbildet. Støtter avsnitt, uthevinger og lenker.
- **Analysegraf** (`analysegraf`): Valgfritt konfigurasjonsobjekt for en enkel graf (linjegraf, barplot eller nøkkeltall) som illustrerer utfordringsbildet. Redaktøren kan peke på en ekstern datakilde eller taste inn verdier manuelt.
- **Prioriteringer** (`prioriteringer`): En ordnet liste der hvert element har en tittel og en beskrivelse.
- **Sitat** (`sitat`): Valgfritt sitatobjekt med tekst, person (statsrådens navn), tittel (departementstilhørighet) og bilde.
- **Budsjettlenker** (`budsjettlenker`): En liste med referanser til programområder i budsjettdataene. Hvert element inneholder et programområdenummer (`omr_nr`), et visningsnavn og et beløp. Beløpet kan hentes automatisk fra datapipelinen. Disse lenkene gjør det mulig å navigere direkte fra den politiske innrammingen til de relevante budsjettallene.

Modulen som helhet har i tillegg en konfigurasjon for **rekkefølge på temaene** (`temarekkefolge`), slik at redaktøren kan endre hvilke temaer som vises først uten å endre dataskjemaet.

### 3.3 Budsjettgrafer-modul (`budsjettgrafer`)

Denne modulen rendrer de to stacked barplottene (utgifter og inntekter) med SPU-broen mellom dem. Hoveddataene hentes fra datapipelinen (`gul_bok_aggregert.json`), men modulen har følgende redaksjonelle konfigurasjonsmuligheter:

- **Sammenligningsvisning som standard** (`visEndringDefault`): Boolean som avgjør om endringsdata fra saldert budsjett t-1 vises ved sidelasting, eller om brukeren må aktivere dette selv via ComparisonToggle.
- **Overskrift** (`overskrift`): Valgfri overskriftstekst over grafene.
- **Forklaringstekst** (`forklaringstekst`): Kort tekst som kontekstualiserer grafene for førstegangsbesøkende.
- **SPU-forklaring** (`spuForklaring`): Redaksjonell tekst som forklarer oljefondbroen. Standardtekst finnes, men kan overstyres for å tilpasse ordlyden til et gitt budsjettår.

Budsjettallene i seg selv (segmentstørrelser, farger, hierarki) er ikke redigerbare i CMS-et. De hentes utelukkende fra datapipelinen og sikrer at tallene på nettsiden til enhver tid stemmer med de offisielle budsjettdokumentene.

### 3.4 Nøkkeltall-modul (`nokkeltall`)

En fleksibel modul for å vise utvalgte nøkkeltall i en visuelt fremtredende layout. Denne modulen kan brukes til å trekke frem tall som redaksjonen ønsker ekstra oppmerksomhet rundt, f.eks. «Oljepengebruken som andel av BNP» eller «Vekst i forsvarsbudsjettet».

Konfigurerbare felter:

- **Tittel** (`tittel`): Overskrift for seksjonen.
- **Nøkkeltall** (`tall`): En ordnet liste med nøkkeltall. Hvert element har en etikett, en verdi, en valgfri enhet, en valgfri endringsindikator, og en valgfri `datareferanse` som kobler verdien til datapipelinen for automatisk oppdatering.
- **Layout** (`layout`): Valg mellom horisontal rad (standard), vertikal liste eller rutenett.

### 3.5 Egendefinert tekst-modul (`egendefinert_tekst`)

En generell innholdsmodul som gir redaktøren mulighet til å legge inn fri tekst med rik formatering. Denne brukes til innhold som ikke passer inn i de øvrige modultypene, f.eks. en forklarende boks om handlingsregelen, en oppsummering av budsjettforliket, eller en pressemelding fra finansministeren.

Konfigurerbare felter:

- **Tittel** (`tittel`): Overskrift.
- **Innhold** (`innhold`): Rik tekst (Portable Text) med støtte for avsnitt, overskrifter, uthevinger, lenker, bilder og innfelte nøkkeltall.
- **Bakgrunnsfarge** (`bakgrunnsfarge`): Valgfri fargeoverlagring for visuell differensiering.
- **Bredde** (`bredde`): Valg mellom smal (tekst-bredde), bred (full bredde med padding) og fullbredde (kant til kant).


## 4. Redaktørens arbeidsflyt

Arbeidsflyten er designet for å støtte den krevende prosessen der mange aktører skal bli enige om budsjettets kommunikasjon, under tidspress og med behov for kvalitetssikring.

### 4.1 Fase 1: Klargjøring (4--6 uker før fremleggelse)

I klargjøringsfasen oppretter CMS-administrator et nytt budsjettår i systemet. Dette innebærer å kopiere forrige års innholdsstruktur som utgangspunkt (temaer, moduloppsett, rekkefølge), opprette tomme eller forhåndsfylte innholdsfelt for det nye året, og sette opp tilgangskontroll slik at kun autoriserte redaktører kan redigere innholdet for det nye året. Budsjettdataene er normalt ikke tilgjengelige enda på dette tidspunktet, men innholdsstrukturen og de redaksjonelle tekstene kan begynne å ta form.

### 4.2 Fase 2: Innholdsproduksjon (2--4 uker før fremleggelse)

Redaktørene arbeider i CMS-ets redigeringsgrensesnitt og fyller inn innhold i de ulike modulene. CMS-et tilbyr sanntidsforhåndsvisning (preview) som viser hvordan innholdet vil se ut på den ferdige nettsiden, inkludert typografi, farger og layout. Forhåndsvisningen fungerer med plassholder-data for budsjettallene inntil de faktiske dataene er tilgjengelige.

Arbeidsoppgaver i denne fasen omfatter å skrive og redigere hero-tekst og undertittel, utarbeide innholdet i «Plan for Norge»-temaene (problembeskrivelser, prioriteringer, sitater fra statsråder), velge og konfigurere analysegrafene per tema, definere nøkkeltall som skal fremheves, og sette opp eventuelle egendefinerte tekstblokker.

### 4.3 Fase 3: Dataimport (dager før fremleggelse)

Når Gul bok og eventuelle saldert-data er klare, kjører datapipelinen og genererer JSON-filene (`gul_bok_full.json`, `gul_bok_aggregert.json`, `gul_bok_endringer.json`, `metadata.json`). Disse filene lastes opp til et definert filområde som frontend-applikasjonen leser fra. Valideringsskript (jf. DATA.md avsnitt 6.7) kjøres automatisk for å sikre at tallene stemmer med kjente totaler.

Etter dataimport kan redaktørene verifisere budsjettallene i forhåndsvisningen, justere nøkkeltall i hero-modulen og nøkkeltall-modulen basert på de faktiske tallene, koble budsjettlenker i temamodulene til de riktige programområdene, og justere forklaringstekster og SPU-forklaring i budsjettgrafer-modulen.

### 4.4 Fase 4: Kvalitetssikring og godkjenning

CMS-et støtter en enkel godkjenningsflyt der innholdet for et budsjettår har tre statusnivåer:

- **Utkast** (`draft`): Innholdet er under arbeid og kun synlig i forhåndsvisningen.
- **Til godkjenning** (`pending_review`): Innholdet er klart for gjennomgang av ansvarlig redaktør eller kommunikasjonssjef.
- **Godkjent** (`approved`): Innholdet er klart for publisering.

Statusoverganger logges med tidsstempel og brukeridentitet. Det er kun brukere med godkjenningsrettigheter som kan flytte innhold fra «til godkjenning» til «godkjent».

### 4.5 Fase 5: Publisering

Publisering skjer ved at innholdet merkes som «godkjent» og en manuell publiseringshandling utløses. Dette triggerer et nytt bygg av frontend-applikasjonen med det godkjente innholdet og de aktuelle budsjettdataene. Publisering kan tidsstyres (scheduled publish) slik at innholdet går live på et forhåndsdefinert tidspunkt, typisk klokken 10:00 på fremleggelsesdagen.

Etter publisering kan redaktørene fortsette å gjøre justeringer (f.eks. rette skrivefeil eller oppdatere sitater), som krever ny godkjenning og re-publisering. Historikk over alle publiseringer bevares.

### 4.6 Fase 6: Etterarbeid

Etter budsjettfremleggelsen kan det oppstå behov for oppdateringer, f.eks. etter budsjettforliket eller nysaldert budsjett. CMS-et støtter dette ved at nye JSON-filer fra datapipelinen kan importeres og kobles til samme budsjettår, og at redaksjonelle tekstblokker kan legges til (f.eks. en egendefinert tekst-modul med informasjon om forliket).


## 5. Kobling mellom datagrunnlag og moduler

### 5.1 Datareferanser

Flere moduler støtter en `datareferanse`-mekanisme som gjør det mulig å koble et redaksjonelt felt direkte til en verdi i datapipelinen. En datareferanse er en streng som peker på en spesifikk verdi i JSON-strukturen, f.eks.:

- `utgifter.total` -- totalbeløpet for alle utgifter
- `utgifter.omraader[omr_nr=4].total` -- totalbeløpet for programområde 4 (Forsvar)
- `spu.overfoering_fra_fond` -- overføringen fra oljefondet
- `endringer.utgifter.omraader[omr_nr=10].endring_prosent` -- prosentvis endring for Helse og omsorg

Når en datareferanse er satt, hentes verdien automatisk fra datapipelinen ved byggetidspunktet. Redaktøren kan overstyre verdien manuelt dersom det er behov for det (f.eks. for å vise et avrundet tall eller et tall som ikke finnes direkte i pipelinen).

### 5.2 Dataflyt mellom lag

Dataflyten fra kilde til ferdig side følger denne sekvensen: Gul bok (Excel-fil) prosesseres av datapipelinen (Python-skript) som genererer JSON-filer. JSON-filene lastes opp til et definert filområde. Frontend-applikasjonen (Next.js) henter redaksjonelt innhold fra CMS-et og budsjettdata fra JSON-filene ved byggetidspunktet. Modulene rendres med kombinert data der datareferanser er oppløst til konkrete verdier.

### 5.3 Budsjettlenker i temamoduler

Et spesielt viktig koblingspunkt er budsjettlenkene i «Plan for Norge»-modulen. Disse lenkene skaper en direkte forbindelse mellom det politiske narrativet og budsjettallene. Redaktøren definerer hvilke programområder som er relevante for hvert tema ved å oppgi `omr_nr`. Beløpet hentes automatisk fra datapipelinen, og lenken genererer en scroll- og navigasjonshandling som åpner riktig drill-down-panel i budsjettgrafer-modulen.


## 6. Krav til fleksibilitet og brukervennlighet

### 6.1 Krav til ikke-tekniske brukere

CMS-et skal kunne brukes av kommunikasjonsrådgivere og politiske rådgivere uten teknisk bakgrunn. Dette stiller følgende krav.

Redigeringsgrensesnittet skal være norskspråklig, med feltbeskrivelser, hjelpetekster og feilmeldinger på norsk bokmål. Alle felter skal ha tydelige etiketter og forklaringer som beskriver hva feltet brukes til og hvordan det påvirker den ferdige siden.

Modulhåndtering skal være visuell og intuitiv. Redaktøren skal kunne dra og slippe moduler for å endre rekkefølge, skjule moduler med et enkelt synlighets-ikon, og legge til nye moduler fra en meny med forhåndsdefinerte typer. Det skal aldri være nødvendig å redigere kode, JSON eller konfigurasjonsfiler direkte.

Forhåndsvisning skal være tilgjengelig med ett klikk og vise en tro kopi av den ferdige siden med faktisk styling, layout og responsive oppførsel. Redaktøren skal kunne veksle mellom desktop-, nettbrett- og mobilvisning i forhåndsvisningen.

Feilforebygging skal bygges inn i skjemavalideringen. Obligatoriske felt skal markeres tydelig, datareferanser skal valideres mot tilgjengelige datanøkler, og fargeverdier skal ha en fargevelger (ikke fritekst). CMS-et skal advare dersom en modul er synlig men mangler påkrevd innhold.

### 6.2 Krav til fleksibilitet mellom budsjettår

Hvert budsjettår kan kreve en unik kommunikasjonsstrategi. Modularkitekturen sikrer at følgende tilpasninger er mulige uten kodeendringer: endre antall og rekkefølge på «Plan for Norge»-temaene dersom en ny regjering har en annen politisk plattform, legge til eller fjerne nøkkeltall som fremheves, introdusere nye egendefinerte tekstblokker (f.eks. for en ekstraordinær krisepakke), endre hero-tekst og visuell profil, og justere SPU-forklaringen dersom overføringsmekanismen endres.

Dersom det er behov for en helt ny modultype (noe som ikke dekkes av de fem eksisterende typene), krever dette en utvidelse av kodebasen. Modularkitekturen er imidlertid designet slik at nye moduler kan legges til med relativt lav innsats: det innebærer å definere et nytt Sanity-skjema, lage en React-komponent, og registrere typen i modulrendreren.

### 6.3 Tilgangsstyring

CMS-et skal støtte rollebasert tilgangskontroll med minst følgende roller:

- **Administrator**: Full tilgang, inkludert opprettelse av nye budsjettår, tilgangsstyring og konfigurasjon av datapipeline-kobling.
- **Redaktør**: Kan opprette, redigere og sende innhold til godkjenning for tildelte budsjettår.
- **Godkjenner**: Kan godkjenne innhold og utløse publisering.
- **Leser**: Kan se innhold og forhåndsvisning, men ikke redigere.


## 7. Versjonshåndtering mellom budsjettår

### 7.1 Årsbasert innholdsstruktur

Hvert budsjettår representeres som et selvstendig innholdsdokument i CMS-et, med sin egen samling av moduler, konfigurasjoner og datareferanser. URL-strukturen (jf. DESIGN.md seksjon 2.3) speiler dette: `/2025` viser innhold og data for 2025-budsjettet, `/2024` for 2024-budsjettet, og så videre. Roten (`/`) peker alltid til gjeldende budsjettår.

Denne separasjonen sikrer at endringer i innholdet for et nytt budsjettår aldri påvirker historiske sider. Hvert år er en fryst representasjon av budsjettet slik det ble kommunisert ved fremleggelsen.

### 7.2 Kopiering mellom år

Når et nytt budsjettår opprettes, kopieres forrige års innholdsstruktur som utgangspunkt. Redaktøren får dermed et ferdig oppsett med alle moduler på plass, og kan fokusere på å oppdatere innholdet i stedet for å bygge opp strukturen fra grunnen av. Kopieringen inkluderer modultyper, rekkefølge og synlighet, temastrukturen (men med tomme innholdsfelt), og konfigurasjonsinnstillinger. Den inkluderer ikke budsjettdata (disse genereres av pipelinen for det nye året) og heller ikke godkjenningsstatus (alt starter som utkast).

### 7.3 Historiske budsjetter og datagrunnlag

Historiske budsjetter har sitt eget datagrunnlag lagret i en årsbasert mappestruktur (jf. DATA.md avsnitt 5.3). Når en bruker navigerer til et historisk budsjettår via årsvelgeren, henter frontend-applikasjonen redaksjonelt innhold for det aktuelle året fra CMS-et og budsjettdata fra de korresponderende JSON-filene.

Redaksjonelt innhold for historiske år er i utgangspunktet låst for redigering etter publisering. Dersom det er behov for å korrigere feil i historisk innhold, krever dette en eksplisitt opplåsing av administratorrollen.

### 7.4 Strukturendringer mellom år

Et åpent spørsmål (jf. DESIGN.md seksjon 9) er hvordan strukturendringer mellom budsjettår skal håndteres. Departements- og programområdestrukturen kan endre seg mellom regjeringer, noe som påvirker både datapipelinen (som krever mappingtabeller, jf. DATA.md avsnitt 5.2) og det redaksjonelle innholdet (f.eks. kan et tema i «Plan for Norge» referere til programområder som ikke fantes i forrige regjerings budsjett).

CMS-et håndterer dette ved at hvert budsjettår har sin egen uavhengige innholdsstruktur. Budsjettlenker i temamoduler peker på programområdenumre som er gyldige for det aktuelle året. Sammenligningsvisningen (endring fra saldert t-1) støtter seg på mappingtabeller i datapipelinen for å koble poster på tvers av strukturendringer. Dersom en ny regjering har en annen politisk plattform, kan «Plan for Norge»-modulen konfigureres med nye temaer, nye farger og nytt innhold uten å berøre tidligere års sider.


## 8. Innholdsskjema i Sanity

Følgende er en oversikt over de sentrale skjemaene i Sanity (eller tilsvarende CMS). Skjemaene er dokumenttyper som representerer innholdsmodellen.

### 8.1 Dokumenttyper

**`budsjettaar`** er toppnivådokumentet som representerer ett budsjettår. Det inneholder felter for årstall, publiseringsstatus, publiseringsdato, og en ordnet liste med modulreferanser.

**`modul`** er et polymorfisk dokument som representerer en modul på landingssiden. Feltet `type` bestemmer hvilke konfigurasjonsfelt som er tilgjengelige. Hver modul har et synlighetsflagg og et rekkefølgenummer.

**`tema`** representerer ett tema i «Plan for Norge»-modulen, med alle feltene beskrevet i seksjon 3.2.

**`nokkeltall`** er et gjenbrukbart objekt som representerer ett nøkkeltall, med etikett, verdi, enhet, endringsindikator og datareferanse.

**`sitat`** er et gjenbrukbart objekt med sitattekst, personnavn, tittel og bildereferanse.

### 8.2 Eksempel: Sanity-skjema for tema

```javascript
export default {
  name: 'tema',
  title: 'Tema (Plan for Norge)',
  type: 'document',
  fields: [
    { name: 'nr', title: 'Temanummer', type: 'number' },
    { name: 'tittel', title: 'Tittel', type: 'string' },
    { name: 'ingress', title: 'Ingress', type: 'text', rows: 3 },
    { name: 'farge', title: 'Aksentfarge', type: 'color' },
    { name: 'ikon', title: 'Ikon', type: 'image' },
    {
      name: 'problembeskrivelse',
      title: 'Problembeskrivelse',
      type: 'blockContent'  // Portable Text
    },
    {
      name: 'analysegraf',
      title: 'Analysegraf',
      type: 'object',
      fields: [
        { name: 'type', title: 'Graftype', type: 'string',
          options: { list: ['linjegraf', 'barplot', 'nokkeltall'] } },
        { name: 'data', title: 'Dataverdier', type: 'array', of: [{ type: 'object',
          fields: [
            { name: 'etikett', type: 'string' },
            { name: 'verdi', type: 'number' }
          ]}]
        }
      ]
    },
    {
      name: 'prioriteringer',
      title: 'Prioriteringer',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'tittel', title: 'Tittel', type: 'string' },
          { name: 'beskrivelse', title: 'Beskrivelse', type: 'blockContent' }
        ]
      }]
    },
    {
      name: 'sitat',
      title: 'Sitat fra statsråd',
      type: 'sitat'
    },
    {
      name: 'budsjettlenker',
      title: 'Kobling til budsjettet',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'omr_nr', title: 'Programområdenummer', type: 'number' },
          { name: 'visningsnavn', title: 'Visningsnavn', type: 'string' },
          { name: 'datareferanse', title: 'Datareferanse (beløp)', type: 'string' }
        ]
      }]
    }
  ]
}
```


## 9. Oppsummering og avhengigheter

Publikasjonsverktøyet er designet rundt tre grunnprinsipper: separasjon mellom redaksjonelt innhold og talldata, modulbasert fleksibilitet som ikke krever kodeendringer, og en arbeidsflyt med tydelige faser og godkjenningsmekanismer.

Dokumentet har følgende avhengigheter til øvrige prosjektdokumenter:

- **DATA.md**: Datapipelinen (avsnitt 6) genererer JSON-filene som modulene refererer til. Datareferanse-mekanismen (seksjon 5.1 i dette dokumentet) forutsetter den hierarkiske JSON-strukturen beskrevet i DATA.md avsnitt 4.1. Historiske data lagres i henhold til filnavnkonvensjonen i DATA.md avsnitt 5.3.
- **DESIGN.md**: Modultyper (seksjon 3 i dette dokumentet) korresponderer med komponentene i DESIGN.md seksjon 3.1. CMS-konfigurasjon eksponeres som props til React-komponentene (jf. DESIGN.md seksjon 7.2). URL-strukturen for årsbasert navigasjon følger DESIGN.md seksjon 2.3.
- **Brukerbehov**: Kravet om at det skal være mulig å endre «deler av nettsiden (moduler), innholdet i disse modulene og datagrunnlaget for modulene» er det styrende designprinsippet for hele arkitekturen.
