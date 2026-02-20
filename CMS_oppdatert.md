# CMS.md -- Publikasjonsverktøy for statsbudsjettet.no

## 1. Innledning og formål

Statsbudsjettet.no er en publikasjonsplattform der regjeringens politiske prosjekt og budsjettallene presenteres for allmennheten. Kommunikasjonsprosessen involverer mange aktører som må bli enige om innhold, vinkling og presentasjon -- ofte under tidspress i ukene før budsjettfremleggelsen. I denne perioden håndteres sensitiv, embargert informasjon som ikke kan eksponeres mot tredjeparts infrastruktur.

Denne revisjonen tar utgangspunkt i en systematisk gjennomgang av Sanitys funksjonalitet. For hvert kjerneelement vurderes det eksplisitt om funksjonen kan bygges selv og med hvilken innsats. Konklusjonen er at Sanity ikke er et helhetlig valg eller avvisning: det er en plattform med en delt arkitektur der Sanity Studio (editoren) er åpen kildekode og kan selvhostes, men Content Lake (databasen der innhold lagres) alltid driftes av Sanity og ikke kan flyttes til egne servere. Denne distinksjonen styrer hele arkitekturvalget.

Dokumentet beskriver arkitekturvalget og begrunnelsen, funksjonalitetskartleggingen som grunnlag for valget, teknisk design, modultyper og konfigurasjon, redaksjonell arbeidsflyt, versjonshåndtering mellom budsjettår, og en trinnvis utviklingsplan for Claude Code.


## 2. Sanity: funksjonalitetskartlegging og gjennombyggbarhet

### 2.1 Sanitys to separate komponenter

Sanity er i dag mer enn et headless CMS -- plattformen definerer seg som et Content Operating System. Kjernen består av to separate komponenter med vesentlig forskjellig arkitektur og tilgjengelighet for selvhosting.

**Content Lake** er Sanitys skybaserte database der alt innhold lagres som strukturert JSON. Den støtter sanntidsoppdateringer, dokumentnivå tilgangskontroll og versjonering. Content Lake kan ikke selvhostes -- dette er en arkitektonisk beslutning fra Sanity, og det finnes ingen enterprise- eller on-premise-plan som endrer dette. Alle skriveoperasjoner fra Sanity Studio går til Sanitys servere.

**Sanity Studio** er selve editoren -- det grafiske grensesnittet der redaktørene arbeider. Den er åpen kildekode (MIT-lisens), bygget i React, og kan distribueres på hvilken som helst server som kan serve en SPA. Innholdsmodellen defineres i TypeScript og lever i kodebasen. Studio er fullt selvhostbar på sky.regjeringen.no. Det Studio imidlertid ikke kan gjøre uten Content Lake er å lagre innhold: å bytte ut dette datalaget ville kreve en fullstendig omskriving som ikke er en støttet konfigurasjon.

**Vurdering for statsbudsjettet.no:** Content Lake er ekskluderende. Embargert budsjetttekst kan ikke lagres på Sanitys infrastruktur i ukene før fremleggelse. Selvhosting av Studio alene gir ingen reell sikkerhetsgevinst -- problemet er datalaget, ikke UI-laget. Dette alene avgjør at Sanity i sin standardkonfigurasjon ikke kan brukes.

### 2.2 Kjernefunksjoner: kan vi bygge dem selv?

| Funksjon | Sanity-implementasjon | Gjennombyggbar? | Estimert innsats |
|---|---|---|---|
| Skjemabasert redigering | Autogenerert fra TypeScript-skjema | Ja | Medium -- 3--5 dagers grunnarbeid |
| Rik tekst (Portable Text) | JSON-basert blokkspesifikasjon | Ja -- TipTap er funksjonelt ekvivalent | Lav -- ferdig bibliotek |
| Modulsortering (drag-and-drop) | Innebygd i Studio for array-felter | Ja -- `@dnd-kit/core` | Lav -- 1--2 dager |
| Sanntids forhåndsvisning | Presentation-verktøy med side-ved-side visning via WebSocket | Ja -- Next.js Draft Mode + Server-Sent Events | Medium -- 3--4 dager |
| Visuell redigering (klikk-til-felt) | Content Source Maps + steganografisk DOM-annotasjon | Ja -- kan implementeres med data-attributter og postMessage | Medium-høy -- 5--7 dager |
| Sanntids flerbrukerssamarbeid | Operasjonell transformasjon mot Content Lake | Ja -- Yjs med WebSocket-provider | Høy -- 7--10 dager |
| Rollebasert tilgangskontroll | Innebygd med fire roller | Ja | Lav -- 1--2 dager med NextAuth |
| Bildebehandling (opplasting) | Sanity Assets + CDN | Ja -- fillagring på sky.regjeringen.no | Lav -- 2 dager |
| Revisjonshistorikk | Innebygd per dokument i Content Lake | Ja -- append-only logg i Postgres | Lav -- 1 dag |
| Draft / published-modell | Dobbelt dokument-system | Ja -- statusfelt i Postgres | Lav |
| Tidsstyrt publisering | Plugin (`sanity-plugin-scheduled-publishing`) | Ja -- cron-jobb mot Postgres | Lav -- 1 dag |
| Godkjenningsflyt | Plugin (`sanity-plugin-workflow`) | Ja -- statusmaskin i Postgres | Lav -- 1--2 dager |
| Skjemavalidering | Innebygd via TypeScript-regler | Ja -- server-side validering i Server Actions | Lav |
| Mediebibliotek | Sanity Assets + CDN | Ja | Lav |
| Kommentarer og @mentions | Innebygd i Studio | Utelates -- ikke nødvendig | -- |

**Om sanntidsfunksjonalitet:** I motsetning til hva som kan fremstå som en stor teknisk barriere, er sanntids forhåndsvisning og samarbeid gjennombyggbart med eksisterende åpen kildekode-verktøy. Next.js Draft Mode gir infrastruktur for å serve forhåndsvisninger direkte fra Postgres. Server-Sent Events (SSE) er tilstrekkelig for sanntidsoppdatering av forhåndsvisning -- det krever ikke full WebSocket-implementasjon. For flerbrukerssamarbeid gir Yjs (et battle-tested CRDT-bibliotek brukt av blant annet Notion og Linear) konflikthåndtering uten at vi trenger å implementere operasjonell transformasjon fra scratch. Disse komponentene er ambisiøse men realistiske innenfor prosjektets ressursramme.

### 2.3 Konklusjon: selveid løsning

Valget er bestemt av to faktorer i kombinasjon: Content Lake kan ikke selvhostes, og funksjonene vi faktisk trenger kan bygges med akseptabel innsats. En selvutviklet løsning basert på Postgres og et Next.js admin-panel er riktig valg. Løsningen henter arkitektonisk inspirasjon fra Sanity -- skjemabasert modell, klart skille mellom draft og publisert, modulkomposisjon, revisjonslogg -- men eier hele datastakken selv.


## 3. Arkitekturvalg: selveid CMS i Next.js

### 3.1 Overordnet design

Plattformen bygges med et selvutviklet admin-panel som en integrert del av Next.js-applikasjonen. Alt redaksjonelt innhold lagres i en Postgres-database på sky.regjeringen.no. Budsjettdataene lever i et separat datalag bestående av statiske JSON-filer generert av datapipelinen (jf. DATA.md avsnitt 6).

Ansvarsfordeling: redaktørene styrer alt redaksjonelt innhold gjennom admin-panelet -- hero-tekster, nøkkeltall, tema-innhold for «Plan for Norge», rekkefølge og synlighet på moduler, drill-down-sidetekst, metadata og egendefinerte tekstblokker. Datapipelinen styrer alt tallmateriale -- budsjettall, hierarki, endringsdata og SPU-beregninger.

### 3.2 Hva vi adopterer fra Sanity-arkitekturen

**Dobbelt dokument-modell (draft / published).** Hvert budsjettår og hver redaktørbar side finnes i to tilstander: et utkast som redaktørene arbeider i, og en publisert tilstand. Bygget henter alltid fra den publiserte tilstanden.

**Skjema som kode.** Innholdsmodellen er definert i TypeScript-typer som er kilden til sannhet for både Prisma-databaseskjema og admin-UI-validering.

**Modularkitektur med polymorf konfigurasjon.** Moduler lagres med en `type`-identifikator og et `konfigurasjon`-objekt (JSONB).

**Revisjonslogg.** Alle skriveoperasjoner loggføres i en append-only tabell.

### 3.3 Applikasjonsstruktur

Admin-panelet er tilgjengelig under `/admin` og rendres server-side ved hvert kall. Den offentlige siden genereres som statiske sider ved byggetidspunktet. Drill-down-sider for programområder er delvis statisk genererte med redaktørbart innholdslag.

```
/app
  /admin
    /budsjettaar                    ← Oversikt og opprettelse av budsjettår
    /moduler/[aarstall]             ← Moduleditor per år
    /temaer/[aarstall]              ← Temaeditor (Plan for Norge)
    /nokkeltall/[aarstall]          ← Nøkkeltall-editor
    /programomraader/[aarstall]     ← Drill-down-sideredaktør
    /media                          ← Bildebibliotek
    /publisering/[aarstall]         ← Godkjenning og publiseringsflyt
    /brukere                        ← Tilgangsstyring (kun administrator)
  /(public)
    /[aarstall]                     ← Landingsside per år (statisk)
    /[aarstall]/[omr_slug]          ← Drill-down programområde (statisk + redaktørtekst)
    /historikk                      ← Årsvelger
  /preview/[aarstall]               ← Autentisert forhåndsvisning (henter fra Postgres)
  /preview/[aarstall]/[omr_slug]    ← Forhåndsvisning drill-down-side
```


## 4. Databasemodell

```sql
-- Toppnivå: ett budsjettår
CREATE TABLE budsjettaar (
  id               SERIAL PRIMARY KEY,
  aarstall         INTEGER NOT NULL UNIQUE,
  status           TEXT NOT NULL DEFAULT 'kladd',
  -- status: kladd | til_godkjenning | godkjent | publisert
  publisering_tid  TIMESTAMPTZ,
  opprettet_av     INTEGER REFERENCES brukere(id),
  opprettet_tid    TIMESTAMPTZ DEFAULT now(),
  sist_endret      TIMESTAMPTZ DEFAULT now()
);

-- Moduler knyttet til landingssiden for et budsjettår
CREATE TABLE moduler (
  id               SERIAL PRIMARY KEY,
  budsjettaar_id   INTEGER NOT NULL REFERENCES budsjettaar(id),
  type             TEXT NOT NULL,
  -- type: hero | plan_for_norge | budsjettgrafer | nokkeltall | egendefinert_tekst
  rekkefoelge      INTEGER NOT NULL,
  synlig           BOOLEAN NOT NULL DEFAULT true,
  konfigurasjon    JSONB NOT NULL DEFAULT '{}'
);

-- Temaer for Plan for Norge
CREATE TABLE temaer (
  id                   SERIAL PRIMARY KEY,
  budsjettaar_id       INTEGER NOT NULL REFERENCES budsjettaar(id),
  rekkefoelge          INTEGER NOT NULL,
  tittel               TEXT NOT NULL,
  ingress              TEXT,
  farge                TEXT,
  ikon_url             TEXT,
  problembeskrivelse   JSONB,   -- TipTap JSON
  analysegraf          JSONB,   -- {type, data: [{etikett, verdi}]}
  prioriteringer       JSONB,   -- [{tittel, beskrivelse (TipTap JSON)}]
  sitat_tekst          TEXT,
  sitat_person         TEXT,
  sitat_tittel         TEXT,
  sitat_bilde_url      TEXT,
  budsjettlenker       JSONB    -- [{omr_nr, visningsnavn, datareferanse}]
);

-- Nøkkeltall
CREATE TABLE nokkeltall (
  id                   SERIAL PRIMARY KEY,
  budsjettaar_id       INTEGER NOT NULL REFERENCES budsjettaar(id),
  etikett              TEXT NOT NULL,
  verdi                TEXT NOT NULL,
  enhet                TEXT,
  endringsindikator    TEXT,    -- opp | ned | nøytral
  datareferanse        TEXT
);

-- Redaktørbart innholdslag for drill-down programområdesider.
-- Talldata (hierarki, beløp, endringer) hentes fra JSON-pipeline.
-- Denne tabellen legger et valgfritt redaksjonelt lag på toppen.
CREATE TABLE programomraade_innhold (
  id                   SERIAL PRIMARY KEY,
  budsjettaar_id       INTEGER NOT NULL REFERENCES budsjettaar(id),
  omr_nr               INTEGER NOT NULL,   -- peker mot omr_nr i JSON-dataene
  ingress              TEXT,               -- kort redaksjonell intro (valgfri)
  brødtekst            JSONB,              -- TipTap JSON (valgfri)
  grafer               JSONB,              -- [{type, tittel, datareferanse, manuell_data}]
  nokkeltall_ids       INTEGER[],          -- referanser til nokkeltall-tabellen
  sist_endret_av       INTEGER REFERENCES brukere(id),
  sist_endret          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (budsjettaar_id, omr_nr)
);

-- Bildebibliotek
CREATE TABLE media (
  id               SERIAL PRIMARY KEY,
  budsjettaar_id   INTEGER REFERENCES budsjettaar(id),
  filnavn          TEXT NOT NULL,
  lagringsbane     TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  storrelse_bytes  INTEGER,
  alt_tekst        TEXT,
  lastet_opp_av    INTEGER REFERENCES brukere(id),
  lastet_opp_tid   TIMESTAMPTZ DEFAULT now()
);

-- Revisjonslogg (append-only)
CREATE TABLE revisjoner (
  id               SERIAL PRIMARY KEY,
  tabell           TEXT NOT NULL,
  rad_id           INTEGER NOT NULL,
  handling         TEXT NOT NULL,   -- opprett | endre | slett | statusendring
  snapshot_json    JSONB NOT NULL,
  endret_av        INTEGER REFERENCES brukere(id),
  endret_tid       TIMESTAMPTZ DEFAULT now()
);

-- Brukere
CREATE TABLE brukere (
  id               SERIAL PRIMARY KEY,
  epost            TEXT NOT NULL UNIQUE,
  navn             TEXT NOT NULL,
  entra_id         TEXT UNIQUE,
  rolle            TEXT NOT NULL DEFAULT 'redaktor',
  -- rolle: administrator | redaktor | godkjenner | leser
  aktiv            BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_moduler_aar        ON moduler(budsjettaar_id, rekkefoelge);
CREATE INDEX idx_temaer_aar         ON temaer(budsjettaar_id, rekkefoelge);
CREATE INDEX idx_programomr_aar_nr  ON programomraade_innhold(budsjettaar_id, omr_nr);
CREATE INDEX idx_revisjoner         ON revisjoner(tabell, rad_id);
```


## 5. Modultyper og konfigurasjon

### 5.1 Hero-modul (`hero`)

Konfigurerbare felter i `moduler.konfigurasjon`:

- **Årstall** (`aar`): Heltall, brukes i overskriften og som nøkkel for datagrunnlag.
- **Hovedtittel** (`tittel`): Kort tekst.
- **Undertittel** (`undertittel`): Valgfri utdypende tekst.
- **Nøkkeltall** (`nokkeltall_ids`): Liste med referanser til `nokkeltall`-tabellen.
- **Bakgrunnsbilde** (`bakgrunnsbilde_url`): Referanse til bildebiblioteket.

### 5.2 Plan for Norge-modul (`plan_for_norge`)

Presenterer regjeringens temaområder som temakort med ekspanderbar detaljvisning. Temaene administreres i `temaer`-tabellen. Konfigurasjon i `moduler.konfigurasjon` inneholder overskrift og en ordnet liste over tema-IDer.

### 5.3 Budsjettgrafer-modul (`budsjettgrafer`)

Rendrer stacked barplottene med SPU-broen. Hoveddataene hentes fra datapipelinen. Konfigurasjon i `moduler.konfigurasjon`:

- **Sammenligningsvisning som standard** (`visEndringDefault`): Boolean.
- **Overskrift** (`overskrift`): Valgfri tekst.
- **Forklaringstekst** (`forklaringstekst`): Kontekstualiserende tekst.
- **SPU-forklaring** (`spuForklaring`): Redaksjonell tekst om oljefondbroen, kan overstyres per år.

### 5.4 Nøkkeltall-modul (`nokkeltall`)

- **Tittel** (`tittel`): Overskrift.
- **Nøkkeltall** (`nokkeltall_ids`): Ordnet liste med referanser til `nokkeltall`-tabellen.
- **Layout** (`layout`): `rad` | `liste` | `rutenett`.

### 5.5 Egendefinert tekst-modul (`egendefinert_tekst`)

- **Tittel** (`tittel`): Overskrift.
- **Innhold** (`innhold`): TipTap JSON.
- **Bakgrunnsfarge** (`bakgrunnsfarge`): Hex-verdi.
- **Bredde** (`bredde`): `smal` | `bred` | `fullbredde`.

### 5.6 Drill-down programområdesider (nytt)

Når en bruker klikker på et segment i budsjettgrafen (f.eks. «Militært forsvar»), åpnes en dedikert side (`/2025/militaert-forsvar`) som kombinerer to innholdslag:

**Tallaget** (fra datapipelinen, ikke redigerbart): hierarkisk nedbrytning av bevilgninger på programkategori- og kapittelnivå, endringsdata fra saldert t-1, postgruppe-fordeling.

**Redaksjonslaget** (fra `programomraade_innhold`-tabellen, valgfritt redigerbart): en ingress-tekst som setter tallene i politisk kontekst, brødtekst med rik formatering, valgfrie grafer som illustrerer trender eller sammenligninger utover det datapipelinen direkte leverer, og fremhevede nøkkeltall.

Redaksjonslaget kan stå tomt for alle eller noen programområder. Dersom feltet er tomt, vises kun tallaget. Redaktøren velger selv hvilke programområder som fortjener redaksjonell oppmerksomhet -- typisk de store eller politisk prioriterte (forsvar, helse, klima).

```typescript
// Eksempel på datastruktur for en drill-down-side
interface ProgramomraadeSide {
  // Fra datapipelinen (JSON)
  omr_nr: number;
  omr_navn: string;
  total_belop: number;
  endring_fra_saldert: number;
  kategorier: Programkategori[];

  // Fra programomraade_innhold i Postgres (valgfritt)
  redaksjon?: {
    ingress: string | null;
    brodtekst: TipTapJSON | null;
    grafer: GrafKonfigurasjon[];
    nokkeltall: Nokkeltall[];
  };
}
```

Layouten på drill-down-siden er fast: redaksjonell intro øverst (dersom den finnes), deretter hierarkisk talloversikt, deretter videre drill-down til programkategori- og kapittelnivå.


## 6. Admin-panelet

### 6.1 Teknisk design

Admin-panelet implementeres med Next.js Server Components og Server Actions. All datauthenting skjer server-side mot Postgres via Prisma ORM.

```typescript
// Server Action for å oppdatere modulrekkefølge
'use server'

async function oppdaterModulRekkefoelge(
  oppdateringer: { id: number; rekkefoelge: number }[]
) {
  const session = await requireSession(['administrator', 'redaktor']);

  await prisma.$transaction([
    ...oppdateringer.map(m =>
      prisma.moduler.update({
        where: { id: m.id },
        data: { rekkefoelge: m.rekkefoelge }
      })
    ),
    prisma.revisjoner.create({
      data: {
        tabell: 'moduler',
        rad_id: 0,
        handling: 'endre',
        snapshot_json: oppdateringer,
        endret_av: session.bruker_id
      }
    })
  ]);

  revalidatePath('/admin/moduler');
}
```

### 6.2 Sanntids forhåndsvisning

I stedet for den enkle preview-route-tilnærmingen implementeres sanntids forhåndsvisning via Next.js Draft Mode kombinert med Server-Sent Events (SSE). Dette gir redaktøren en side-ved-side-opplevelse der forhåndsvisningen oppdaterer seg automatisk etter lagrede endringer -- uten å trigge et fullt statisk bygg.

**Mekanisme:** Forhåndsvisnings-URL-en aktiverer Next.js Draft Mode med en signert cookie, som gjør at Next.js henter innhold direkte fra Postgres i stedet for statiske JSON-filer. En SSE-endepunkt (`/api/preview-events`) sender en `refresh`-hendelse til forhåndsvisningens iFrame hver gang admin-panelet lagrer en endring. iFrame-siden lytter på hendelsen og kjører `router.refresh()`.

```typescript
// /api/preview-events -- SSE-endepunkt
export async function GET(req: Request) {
  const session = await requireSession(['administrator', 'redaktor', 'godkjenner', 'leser']);

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        controller.enqueue(`data: ping\n\n`);
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Admin-panelet sender en refresh-signal etter lagring
async function sendPreviewRefresh(aarstall: number) {
  await fetch(`/api/preview-events/refresh?aarstall=${aarstall}`, {
    method: 'POST'
  });
}
```

Redaktøren åpner forhåndsvisningen i et sidepanel i admin-UI-et (iFrame) og ser endringer reflektert innen sekunder etter lagring. Dette er funksjonelt ekvivalent med Sanitys Presentation-verktøy for de fleste praktiske formål.

### 6.3 Visuell klikk-til-felt-redigering (ambisiøs fase)

For ytterligere å redusere friksjonen mellom forhåndsvisning og redigering implementeres en enkel versjon av Sanitys Visual Editing. Hvert redigerbart DOM-element i forhåndsvisningen annoteres med `data-cms-field`-attributter ved render i Draft Mode. Et klientscript i forhåndsvisningen lytter på klikk og sender en `postMessage` til admin-panelet som instruerer det om å navigere til riktig felt.

```typescript
// I forhåndsvisnings-rendrer (kun i Draft Mode)
function CmsAnnotert({ felt, aarstall, komponent, children }) {
  if (!isDraftMode()) return children;

  return (
    <span
      data-cms-field={felt}
      data-cms-aarstall={aarstall}
      data-cms-komponent={komponent}
      className="cms-redigerbar"
    >
      {children}
    </span>
  );
}

// Klientscript i forhåndsvisnings-iFrame
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-cms-field]');
  if (!el) return;
  e.preventDefault();
  window.parent.postMessage({
    type: 'cms-naviger-til-felt',
    felt: el.dataset.cmsField,
    aarstall: el.dataset.cmsAarstall,
    komponent: el.dataset.cmsKomponent
  }, window.location.origin);
});
```

Admin-panelet lytter på `postMessage` og navigerer til riktig skjema og felt. Dette er en forenklet, men praktisk tilstrekkelig versjon av Sanitys Content Source Maps-tilnærming.

### 6.4 Flerbrukerssamarbeid med Yjs (ambisiøs fase)

For å støtte at flere redaktører kan arbeide i samme dokument samtidig uten konflikter, integreres Yjs -- et CRDT-bibliotek (Conflict-free Replicated Data Type) som brukes i produksjon av Notion, Linear og andre samarbeidsverktøy.

Yjs håndterer konflikter matematisk: to redaktører kan redigere samme felt samtidig, og Yjs fletter endringene deterministisk uten å miste data. TipTap har innebygd Yjs-støtte via `@tiptap/extension-collaboration`.

```typescript
// TipTap-editor med Yjs-støtte
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  'wss://cms.statsbudsjettet.no/yjs',
  `tema-${temaId}-${aarstall}`,
  ydoc
);

const editor = useEditor({
  extensions: [
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({
      provider,
      user: { name: sesjon.bruker.navn, color: '#2563EB' }
    })
  ]
});
```

Yjs-tilstanden synkroniseres mot Postgres ved `debounced` skriveoperasjoner: én lagring per 2 sekunder under aktiv redigering, og en endelig lagring ved `blur`. WebSocket-serveren (`y-websocket`) kjøres som en egen Node.js-prosess på sky.regjeringen.no.

Markørposisjoner fra andre påloggede redaktører vises som fargede markører med navn -- analogt med Google Docs og Sanitys innebygde samarbeidsfunksjon.

### 6.5 Drag-and-drop for modulsortering

Modulsortering og temasortering implementeres med `@dnd-kit/core`. Endringer lagres optimistisk på klientsiden og persisteres via Server Action.

### 6.6 Skjermbilder

**Budsjettår-oversikt** viser alle år med status-badge. Administrator oppretter nytt år med valgfri kopiering av forrige års innholdsstruktur -- inkludert eventuelle redaksjonelle drill-down-sider.

**Modul-editor** er et drag-and-drop-grensesnitt for rekkefølge og synlighet med side-ved-side forhåndsvisning.

**Tema-editor** redigerer hvert tema med TipTap-editor, fargevelger, bildeoplasting og budsjettlenker. Støtter samarbeid via Yjs.

**Programområde-editor** viser en liste over alle 27 programområder for det aktuelle budsjettåret. Hvert område har en status-indikator som viser om redaksjonelt innhold er lagt til. Redaktøren klikker seg inn på et område og skriver ingress, brødtekst og konfigurerer eventuelle tilleggsgrafer. Felt som er tomme rendres ikke på den offentlige siden.

**Nøkkeltall-editor**, **Mediebibliotek** og **Publiseringsflyt** som beskrevet i forrige versjon.


## 7. Autentisering og tilgangsstyring

### 7.1 Autentisering via Azure Entra ID

Innlogging skjer via Azure AD / Entra ID med OIDC. NextAuth.js håndterer OIDC-flyten og sesjonshåndteringen.

```typescript
async function requireSession(tillattRoller: Rolle[]) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/logginn');

  const bruker = await prisma.brukere.findUnique({
    where: { entra_id: session.user.id }
  });

  if (!bruker || !tillattRoller.includes(bruker.rolle as Rolle)) {
    throw new Error('Utilstrekkelige rettigheter');
  }
  return { ...session, bruker_id: bruker.id, rolle: bruker.rolle };
}
```

### 7.2 Roller

- **Administrator**: Full tilgang, inkludert brukeradministrasjon og opplåsing av historisk innhold.
- **Redaktør**: Opprette, redigere og sende til godkjenning.
- **Godkjenner**: Godkjenne innhold og sette publiseringstidspunkt.
- **Leser**: Lese og forhåndsvise, ikke redigere.


## 8. Redaktørens arbeidsflyt

Arbeidsflyten reflekterer den faktiske rekkefølgen i budsjettprosessen: budsjettdata er tilgjengelig allerede når administrator oppretter et nytt budsjettår i systemet. Redaktørens oppgave er ikke å vente på tallene, men å bruke dem som grunnlag for å lage god formidling fra dag én.

### 8.1 Fase 1: Oppstart og planlegging (4--6 uker før fremleggelse)

Administrator oppretter et nytt budsjettår og kopierer forrige års modulstruktur som utgangspunkt. Datapipelinen kjøres umiddelbart mot de tilgjengelige budsjettdataene og genererer JSON-filene. Disse er tilgjengelige i forhåndsvisningen fra første dag.

Redaksjonsteamet holder et oppstartsmøte der de gjennomgår tallene og planlegger kommunikasjonsstrategien: hvilke programområder skal ha redaksjonell tekst i drill-down, hvilke nøkkeltall skal fremheves i hero, hvilke temaer i «Plan for Norge» trenger størst oppmerksomhet, og hvilke grafer utover datapiplelinens standardvisninger vil styrke fortellingen.

### 8.2 Fase 2: Innholdsproduksjon (3--5 uker før fremleggelse)

Redaktørene arbeider parallelt i admin-panelet med full tilgang til det faktiske tallgrunnlaget i forhåndsvisningen. Sanntids forhåndsvisning gjør det mulig å se effekten av tekstvalg direkte mot de faktiske grafene og tallene.

Arbeidsoppgavene i denne fasen:

**Landingsside:** Hero-tekst og undertittel settes i kontekst av de faktiske totaltallene. Nøkkeltall velges og konfigureres basert på hva som er politisk mest relevant å fremheve. «Plan for Norge»-temaene skrives med problembeskrivelse, prioriteringer og sitater fra statsråder. Redaktørene kobler temaene til de relevante programområdene via budsjettlenker.

**Drill-down-sider:** For de programområdene redaksjonen ønsker å løfte (typisk 5--10 av 27) skrives ingress og eventuell brødtekst. Tilleggsgrafer konfigureres for å illustrere trender som ikke fremkommer direkte av hierarkivisningen. Resterende programområder lates stå uten redaksjonelt innhold og viser kun tallaget.

**Iterasjon:** Forhåndsvisningen brukes aktivt for å teste at formuleringer fungerer visuelt mot grafene, at nøkkeltall er korrekte og at drill-down-sider gir mening i sammenheng med resten av siden.

### 8.3 Fase 3: Kvalitetssikring og godkjenning

Innholdet har fire statusnivåer:

- **Kladd** (`kladd`): Under arbeid, kun synlig i forhåndsvisning for innloggede brukere.
- **Til godkjenning** (`til_godkjenning`): Klar for gjennomgang av godkjenner.
- **Godkjent** (`godkjent`): Klar for publisering. Videre redigering krever tilbakestilling av status.
- **Publisert** (`publisert`): Live. Endringer krever ny godkjenningsrunde.

Leser-rollen brukes aktivt i denne fasen: politiske rådgivere og kommunikasjonsansvarlige kan logge inn og bruke forhåndsvisningen for kvalitetssikring uten redigeringstilgang.

### 8.4 Fase 4: Publisering

Godkjenner setter `publisering_tid` i Postgres. En cron-jobb i CI/CD-pipelinen trigger et nytt statisk bygg når tidspunktet er nådd og status er «godkjent».

```
Godkjenner setter publisering_tid og status = 'godkjent'
        |
        v
Cron-jobb overvåker budsjettaar-tabellen hvert minutt
        |
        v
Next.js-bygg starter -- henter fra Postgres + JSON-filer
        |
        v
Statiske filer deployes til sky.regjeringen.no
        |
        v
budsjettaar.status oppdateres til 'publisert'
```

### 8.5 Fase 5: Etterarbeid

Etter fremleggelsen kan nye JSON-filer fra datapipelinen importeres for å reflektere forlik eller nysaldert budsjett. Redaksjonelle tekstblokker kan legges til eller justeres, og drill-down-sider kan oppdateres med ny kontekstuell informasjon.


## 9. Kobling mellom datagrunnlag og moduler

### 9.1 Datareferanser

Nøkkeltall og grafkonfigurasjon støtter en `datareferanse`-mekanisme som kobler et redaksjonelt felt til en verdi i datapipelinen:

- `utgifter.total`
- `utgifter.omraader[omr_nr=4].total`
- `spu.overfoering_fra_fond`
- `endringer.utgifter.omraader[omr_nr=10].endring_prosent`

Verdien hentes ved byggetidspunktet. Redaktøren kan overstyre verdien manuelt ved behov.

### 9.2 Drill-down og redaksjonell kobling

Budsjettlenkene i «Plan for Norge»-modulen og drill-down-sidene for programområder er to komplementære mekanismer for å koble det politiske narrativet til tallene. Lenkene fra temaene navigerer direkte til de relevante programområde-URL-ene, der redaksjonsinnholdet (om det finnes) gir kontekst før brukeren dykker videre ned i hierarkiet.


## 10. Krav til brukervennlighet

Admin-panelet skal brukes av kommunikasjonsrådgivere og politiske rådgivere uten teknisk bakgrunn:

Redigeringsgrensesnittet er norskspråklig med feltbeskrivelser og hjelpetekster på bokmål. Modulhåndtering er visuell med drag-and-drop og enkelt synlighets-ikon. Det skal aldri være nødvendig å redigere kode eller JSON direkte. Feilforebygging er bygget inn: obligatoriske felt markeres tydelig, datareferanser valideres mot tilgjengelige nøkler, fargeverdier har fargevelger.

Programområde-editoren viser tydelig hvilke av de 27 programområdene som har redaksjonelt innhold og hvilke som viser kun talldata, slik at redaksjonsteamet kan holde oversikt over hva som gjenstår.


## 11. Versjonshåndtering mellom budsjettår

Hvert budsjettår er et selvstendig innholdsdokument i databasen. URL-strukturen: `/2025` viser 2025-budsjettet, `/2025/militaert-forsvar` viser drill-down for programområde 4, roten `/` peker til gjeldende år.

Historiske år er frosset etter publisering og krever eksplisitt administratoropplåsing. Kopiering mellom år inkluderer modultyper, rekkefølge, synlighet og temastruktur -- men ikke budsjettdata eller godkjenningsstatus. Redaksjonelle drill-down-sider kopieres med tomme innholdsfelt som utgangspunkt; redaktøren skriver nytt innhold basert på det nye årets tallgrunnlag.


## 12. Utviklingsplan for Claude Code

Planen er delt i fem faser som følger en logisk rekkefølge: datalag, autentisering, redaksjonelle kjernefunksjoner, publiseringsflyt, og avanserte samarbeidsfunksjoner. Hver fase avsluttes med en fungerende og testbar leveranse.

---

### Fase 1: Datalag og prosjektstruktur (estimat: 2--3 dager)

**Mål:** Fungerende database og typelag som resten av prosjektet bygger på.

```
Oppgave 1.1 -- Prosjektoppsett
- Initialiser Next.js 14 App Router med TypeScript
- Konfigurer Prisma mot Postgres på sky.regjeringen.no
- Sett opp .env-struktur med DATABASE_URL, NEXTAUTH_SECRET, AZURE_CLIENT_ID osv.
- Konfigurer ESLint, Prettier og Husky pre-commit hooks

Oppgave 1.2 -- Prisma-skjema
- Oversett SQL-modellen fra seksjon 4 til schema.prisma
- Kjør prisma migrate dev for å opprette tabeller
- Seed databasen med testdata: ett budsjettår (2025), tre moduler, to temaer

Oppgave 1.3 -- TypeScript-typer
- Definer alle grensesnitt i /lib/types/cms.ts:
  Budsjettaar, Modul, ModulType, Tema, Nokkeltall,
  ProgramomraadeInnhold, Media, Bruker, Rolle, Revisjon
- Definer TipTapJSON-type og GrafKonfigurasjon
- Eksporter felles Prisma-klientinstans fra /lib/db.ts

Oppgave 1.4 -- Datareferanse-resolver
- Implementer funksjonen resolveDataref(ref: string, data: BudsjettJSON): number | null
- Støtt punktnotasjon og array-filtrering (omraader[omr_nr=4].total)
- Skriv enhetstester for resolveren med Vitest
```

---

### Fase 2: Autentisering og tilgangskontroll (estimat: 2--3 dager)

**Mål:** Sikker innlogging via Azure Entra ID med rollebasert tilgangsstyring på alle admin-ruter.

```
Oppgave 2.1 -- NextAuth med Azure AD-provider
- Installer next-auth og konfigurer Azure AD OIDC-provider
- Implementer session-callback som henter brukerrolle fra Postgres via entra_id
- Håndter første innlogging: opprett bruker i Postgres dersom entra_id ikke finnes

Oppgave 2.2 -- requireSession-middleware
- Implementer requireSession(tillattRoller: Rolle[]) som beskrevet i seksjon 7.1
- Legg til Next.js middleware (middleware.ts) som redirecter uautentiserte
  kall på /admin/* til /admin/logginn
- Implementer rollesjekk som kaster 403 ved utilstrekkelige rettigheter

Oppgave 2.3 -- Brukeradmin-side (/admin/brukere)
- Tabell over alle brukere med navn, epost, rolle og aktiv-status
- Rediger-modal for å endre rolle og aktiv-status (kun administrator)
- Server Action: oppdaterBruker(id, rolle, aktiv)

Oppgave 2.4 -- Innloggingsside og feilhåndtering
- /admin/logginn: enkel side med «Logg inn med departementskonto»-knapp
- Feilside for 403 med tydelig norsk feilmelding
```

---

### Fase 3: Redaksjonelle kjernefunksjoner (estimat: 8--10 dager)

**Mål:** Fullstendig redigerbart admin-panel for alle innholdstyper.

```
Oppgave 3.1 -- Budsjettår-oversikt (/admin/budsjettaar)
- Liste over alle år med status-badge og handlinger (åpne, kopier, slett)
- Server Action: opprettBudsjettaar(aarstall, kopierFraId?)
  Kopiering inkluderer moduler, temaer, nøkkeltall og programomraade_innhold
  (med tomme innholdsfelt for sistnevnte)
- Server Action: slettBudsjettaar(id) -- kun for kladd-status

Oppgave 3.2 -- Modul-editor (/admin/moduler/[aarstall])
- Installer @dnd-kit/core og @dnd-kit/sortable
- DnD-liste med modulkort som kan sorteres
- Hvert kort: type-ikon, tittel, synlighets-toggle, rediger-knapp
- Rediger-knapp åpner et sidepanel med det modulspesifikke skjemaet
- Server Actions: oppdaterRekkefoelge, oppdaterSynlighet, oppdaterKonfigurasjon

Oppgave 3.3 -- TipTap-editor-komponent
- Installer @tiptap/react og nødvendige extensions (StarterKit, Link, Image)
- Bygg <TipTapEditor value={json} onChange={setJson} />
- Verktøylinje: H2, H3, fet, kursiv, lenke, liste, bilde (fra mediebibliotek)
- Sikre at editoren er WCAG 2.1 AA-kompatibel (tastaturnavigasjon, aria-labels)

Oppgave 3.4 -- Tema-editor (/admin/temaer/[aarstall])
- Liste over temaer med DnD-sortering
- Skjema per tema: tittel, ingress, farge (fargevelger), ikon (medievelger),
  TipTap for problembeskrivelse, liste for prioriteringer, sitatfelt,
  budsjettlenker-editor med omr_nr-velger
- Server Actions: opprettTema, oppdaterTema, slettTema, oppdaterRekkefoelge

Oppgave 3.5 -- Nøkkeltall-editor (/admin/nokkeltall/[aarstall])
- Tabell over nøkkeltall med inline-redigering
- Felt: etikett, verdi, enhet, endringsindikator (dropdown), datareferanse
- Datareferanse-felt med validering: vis oppløst verdi fra JSON i sanntid
- Server Actions: opprettNokkeltall, oppdaterNokkeltall, slettNokkeltall

Oppgave 3.6 -- Programområde-editor (/admin/programomraader/[aarstall])
- Liste over alle 27 programområder hentet fra JSON-dataene
- Status-indikator per område: «Har redaksjonsinnhold» / «Kun talldata»
- Klikk åpner skjema: ingress (tekstfelt), brødtekst (TipTap),
  grafer (dynamisk liste med type-velger og datareferanse-felt),
  nøkkeltall (flervalg fra nøkkeltall-tabellen)
- Server Actions: opprettEllerOppdaterProgramomraadeInnhold

Oppgave 3.7 -- Mediebibliotek (/admin/media)
- Filopplasting med drag-and-drop sone og klikk-for-velg
- Validering: kun image/jpeg, image/png, image/webp; maks 5 MB
- Lagringsintegrasjon mot sky.regjeringen.no filsystem
- Bilderutenett med søk, filtrer på budsjettår, slett
- <MediaVelger />-modal gjenbrukt i tema-editor og andre felt
```

---

### Fase 4: Forhåndsvisning og publisering (estimat: 4--5 dager)

**Mål:** Sanntids forhåndsvisning og trygg, tidsstyrt publisering.

```
Oppgave 4.1 -- Next.js Draft Mode og preview-routes
- Aktiver Draft Mode via /api/draft-aktiver og /api/draft-deaktiver
- Implementer /preview/[aarstall] som henter fra Postgres i Draft Mode
  i stedet for statiske JSON-filer
- Implementer /preview/[aarstall]/[omr_slug] for drill-down-sider

Oppgave 4.2 -- Server-Sent Events for sanntidsoppdatering
- Implementer SSE-endepunkt /api/preview-events med autentisering
- Legg til klientscript i preview-layout som abonnerer på SSE
  og kjører router.refresh() ved refresh-hendelse
- Legg til sendPreviewRefresh()-kall i alle Server Actions som muterer innhold
- Test: rediger temafelt i ett vindu, se oppdatering i forhåndsvisning i et annet

Oppgave 4.3 -- Side-ved-side layout i admin-panelet
- Legg til «Forhåndsvisning»-knapp i admin-header som åpner en iFrame-drawer
- iFrame peker på /preview/[aarstall] med Draft Mode aktivert
- Toggle for desktop/mobilvisning i iFrame-headeren
- Klikk-til-felt via postMessage (se seksjon 6.3): annoteringsfunksjonen
  CmsAnnotert implementeres og aktiveres i Draft Mode

Oppgave 4.4 -- Publiseringsflyt (/admin/publisering/[aarstall])
- Statusoversikt: hvilke moduler og temaer har innhold, hvilke er tomme
- Statusendring-knapper: send til godkjenning, godkjenn, tilbakestill
- Datovelger for publiseringstidspunkt (kun synlig i godkjent-status)
- Server Action: oppdaterStatus(budsjettaarId, nyStatus, publiseringTid?)

Oppgave 4.5 -- Cron-jobb for tidsstyrt publisering
- Implementer /api/publiser-cron som verifiserer en hemmelig token
- Spørring: SELECT * FROM budsjettaar WHERE status = 'godkjent'
  AND publisering_tid <= now()
- Trigger nytt bygg via Next.js revalidatePath eller deploy hook
- Oppdater status til 'publisert' og logg i revisjoner
- Konfigurer cron-kall hvert minutt i CI/CD-infrastrukturen
```

---

### Fase 5: Avanserte samarbeidsfunksjoner (estimat: 7--10 dager)

**Mål:** Sanntids flerbrukerssamarbeid i TipTap-editorer og visuell redigering.

```
Oppgave 5.1 -- Yjs WebSocket-server
- Sett opp y-websocket som en separat Node.js-prosess
- Konfigurer autentisering: kun gyldige NextAuth-sesjoner får koble til
- Romnavngiving: tema-{temaId}-{aarstall}, programomr-{omrNr}-{aarstall}
- Deploy på sky.regjeringen.no som en systemd-tjeneste

Oppgave 5.2 -- TipTap med Yjs-samarbeid
- Installer @tiptap/extension-collaboration og @tiptap/extension-collaboration-cursor
- Installer y-websocket klientbibliotek
- Oppdater <TipTapEditor /> til å støtte valgfri ydoc og provider
- Markørvisning: navn og farge per innlogget bruker (hentet fra sesjon)
- Debounced lagring til Postgres: skriv til DB 2 sekunder etter siste endring

Oppgave 5.3 -- Tilstedeværelses-indikator
- Vis avatarer/initialer for andre brukere som er aktive i samme dokument
- Implementer en enkel tilstedeværelses-kanal via Yjs awareness-protokollen
- Vis «[Navn] redigerer nå»-banner dersom en annen bruker har feltet åpent

Oppgave 5.4 -- Revisjonshistorikk-visning
- Side /admin/revisjon/[tabell]/[radId] som viser alle endringer for en rad
- Vis diff mellom påfølgende snapshots for JSONB-kolonner
- Mulighet for å gjenopprette en tidligere versjon (med ny revisjon som logg)

Oppgave 5.5 -- End-to-end-testing
- Sett opp Playwright for E2E-testing
- Testscenario: opprett budsjettår, rediger tema, send til godkjenning,
  godkjenn, sett publiseringstidspunkt, verifiser publisering
- Testscenario: to brukere redigerer samme tema, verifiser at
  Yjs fletter endringer korrekt
- Testscenario: drill-down-side med og uten redaksjonsinnhold
```

---

**Total estimert innsats:** 23--31 dager for én erfaren Next.js-utvikler. Fase 1--4 (de som er strengt nødvendige for produksjon) utgjør 16--21 dager. Fase 5 er ambisiøs men realistisk og gir en redaksjonskvalitet som overgår mange kommersielle CMS-løsninger.


## 13. Oppsummering og avhengigheter

Publikasjonsverktøyet er designet rundt fire grunnprinsipper: separasjon mellom redaksjonelt innhold og talldata, modulbasert fleksibilitet som ikke krever kodeendringer, en arbeidsflyt med tydelige faser og godkjenningsmekanismer, og full datasuverenitet der embargert innhold ikke forlater statsforvaltningens infrastruktur.

Avhengigheter til øvrige prosjektdokumenter:

- **DATA.md**: Pipelinen genererer JSON-filene som modulene refererer til via datareferanse-mekanismen (seksjon 9.1). `programomraade_innhold` bruker `omr_nr` som nøkkel mot datapiplelinens programområdestruktur.
- **DESIGN.md**: Modultyper (seksjon 5) korresponderer med komponentene i DESIGN.md seksjon 3.1. Drill-down-sidens layout er beskrevet i DESIGN.md seksjon 4.3 og må utvides for å inkludere det redaksjonelle innholdslaget øverst. URL-strukturen følger DESIGN.md seksjon 2.3.
- **ARCHITECTURE.md**: Valget om selveid Postgres erstatter Sanity som CMS-lag i den tekniske stacken. Yjs WebSocket-serveren er en ny komponent som må inkluderes i infrastrukturoversikten.
- **Brukerbehov**: Kravet om at det skal være mulig å endre «deler av nettsiden (moduler), innholdet i disse modulene og datagrunnlaget for modulene» er det styrende designprinsippet. Drill-down-sideredaktøren utvider dette til også å gjelde programområdenivået i budsjettgrafen.
