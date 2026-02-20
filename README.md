# Statsbudsjettet.no

Publikasjonsplattform som presenterer det norske statsbudsjettet for allmennheten. Kombinerer regjeringens politiske budskap med faktiske budsjettall i en interaktiv, tilgjengelig nettopplevelse.

## Teknisk stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | Next.js (App Router), TypeScript |
| Visualisering | D3.js + React (SVG) |
| Styling | CSS Modules + CSS-variabler |
| CMS / Admin | Postgres + Prisma + NextAuth |
| Datapipeline | Python (pandas, openpyxl) |
| Testing | Vitest + Testing Library |

## Kom i gang

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Sett opp miljøvariabler

Kopier `.env.example` og fyll inn verdiene:

```bash
cp .env.example .env
```

Nødvendige variabler:

| Variabel | Beskrivelse |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL-tilkoblingsstreng |
| `NEXTAUTH_SECRET` | Tilfeldig hemmelig nøkkel for sesjoner |
| `NEXTAUTH_URL` | Applikasjonens URL (f.eks. `http://localhost:3000`) |
| `AZURE_AD_CLIENT_ID` | Azure Entra ID klient-ID (valgfritt i utvikling) |
| `AZURE_AD_CLIENT_SECRET` | Azure Entra ID hemmelighet (valgfritt i utvikling) |
| `AZURE_AD_TENANT_ID` | Azure Entra ID tenant-ID (valgfritt i utvikling) |

### 3. Sett opp databasen

```bash
# Generer Prisma-klient
npm run db:generate

# Kjør migrasjoner (krever kjørende PostgreSQL)
npm run db:migrate

# Fyll databasen med testdata
npm run db:seed
```

### 4. Start utviklingsserveren

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) for den offentlige nettsiden.

## Admin-panel (CMS)

Admin-panelet er tilgjengelig på [http://localhost:3000/admin](http://localhost:3000/admin).

### Tilgang i utviklingsmodus

I utviklingsmodus kan du logge inn uten Azure AD:

1. Gå til [http://localhost:3000/admin](http://localhost:3000/admin)
2. Du blir redirectet til innloggingssiden
3. Bruk feltet **Utviklingsmodus** nederst på siden
4. Skriv inn `admin@dev.local` (eller en annen e-postadresse)
5. Klikk **Logg inn som utvikler**

Seed-scriptet oppretter to testbrukere:

| E-post | Rolle |
|--------|-------|
| `admin@dev.local` | Administrator (full tilgang) |
| `redaktor@dev.local` | Redaktør |

### Tilgang i produksjon

I produksjon brukes Azure Entra ID (OIDC). Brukere logger inn med sin departementskonto via «Logg inn med departementskonto»-knappen.

### Admin-sider

| Rute | Beskrivelse |
|------|-------------|
| `/admin` | Dashbord med oversikt |
| `/admin/budsjettaar` | Opprett og administrer budsjettår |
| `/admin/moduler/[aarstall]` | Drag-and-drop modul-editor for landingssiden |
| `/admin/temaer/[aarstall]` | Rediger Plan for Norge-temaer |
| `/admin/nokkeltall/[aarstall]` | Definer nøkkeltall med datareferanser |
| `/admin/programomraader/[aarstall]` | Redaksjonelt innhold for drill-down-sider |
| `/admin/media` | Mediebibliotek (bildeopplasting) |
| `/admin/brukere` | Brukeradministrasjon (kun administrator) |
| `/admin/publisering/[aarstall]` | Publiseringsflyt og forhåndsvisning |

### Roller

| Rolle | Rettigheter |
|-------|-------------|
| **Administrator** | Full tilgang, brukeradministrasjon, publisering |
| **Redaktør** | Opprette/redigere innhold, sende til godkjenning |
| **Godkjenner** | Godkjenne og publisere innhold |
| **Leser** | Kun lesetilgang til admin-panelet |

### Publiseringsflyt

Innhold følger en statusmaskin:

```
kladd → til_godkjenning → godkjent → publisert
```

Fra «godkjent» kan man enten publisere umiddelbart eller sette et tidspunkt for automatisk publisering (via cron-jobben `/api/publiser-cron`).

### Forhåndsvisning

Fra publiseringssiden kan redaktører åpne en forhåndsvisning som viser innholdet slik det vil se ut for besøkende. Forhåndsvisningen oppdateres automatisk via Server-Sent Events når innhold lagres.

## Scripts

| Script | Beskrivelse |
|--------|-------------|
| `npm run dev` | Start utviklingsserver |
| `npm run build` | Bygg for produksjon (dynamisk modus med admin-panel) |
| `npm run build:static` | Bygg statisk eksport for GitHub Pages (uten admin) |
| `npm run lint` | Kjør ESLint |
| `npm run test` | Kjør Vitest-tester |
| `npm run db:generate` | Generer Prisma-klient fra skjema |
| `npm run db:migrate` | Kjør databasemigrasjoner |
| `npm run db:seed` | Fyll databasen med testdata |
| `npm run db:studio` | Åpne Prisma Studio (GUI for databasen) |

## Datapipeline

Budsjettdata genereres fra Excel-filer (Gul bok) via Python-pipelinen:

```bash
cd pipeline
python kjor_pipeline.py --aar 2025
```

Se `DATA.md` for detaljert dokumentasjon av datamodellen.

## Prosjektstruktur

```
src/
├── app/
│   ├── page.tsx                  # Forside (redirect til gjeldende år)
│   ├── [aar]/                    # Offentlig budsjettårside
│   ├── admin/                    # Admin-panel (CMS)
│   │   ├── layout.tsx            # Admin-layout med navigasjon
│   │   ├── budsjettaar/          # Budsjettår-administrasjon
│   │   ├── moduler/[aarstall]/   # Modul-editor (drag-and-drop)
│   │   ├── temaer/[aarstall]/    # Tema-editor
│   │   ├── nokkeltall/[aarstall]/ # Nøkkeltall-editor
│   │   ├── programomraader/      # Programområde-editor
│   │   ├── media/                # Mediebibliotek
│   │   ├── brukere/              # Brukeradministrasjon
│   │   └── publisering/          # Publiseringsflyt
│   ├── api/                      # API-ruter
│   │   ├── auth/[...nextauth]/   # NextAuth-endepunkt
│   │   ├── draft-aktiver/        # Aktiver Draft Mode
│   │   ├── preview-events/       # SSE for forhåndsvisning
│   │   └── publiser-cron/        # Tidsstyrt publisering
│   └── preview/[aarstall]/       # Forhåndsvisning
├── components/
│   ├── admin/                    # TipTapEditor, CmsAnnotert
│   ├── budget/                   # Budsjettvisualisering
│   ├── hero/                     # Hero-seksjon
│   ├── plan/                     # Plan for Norge
│   ├── layout/                   # Header, Footer, navigasjon
│   └── shared/                   # Delte komponenter
├── lib/
│   ├── auth.ts                   # NextAuth-konfigurasjon
│   ├── db.ts                     # Prisma-klient (singleton)
│   ├── requireSession.ts         # Sesjons- og rollesjekk
│   ├── revisjonslogg.ts          # Endringslogging
│   ├── datareferanse.ts          # Oppløs CMS-datareferanser
│   └── types/cms.ts              # CMS TypeScript-typer
└── middleware.ts                 # Auth-middleware for /admin
prisma/
├── schema.prisma                 # Databaseskjema
└── seed.ts                       # Testdata
```

## Dokumentasjon

| Fil | Innhold |
|-----|---------|
| `ARCHITECTURE.md` | Systemarkitektur og integrasjonspunkter |
| `DATA.md` | Datamodell, hierarki og pipeline |
| `DESIGN.md` | Komponentspesifikasjoner og WCAG-krav |
| `CMS.md` | Opprinnelig CMS-spesifikasjon (Sanity) |
| `CMS_oppdatert.md` | Oppdatert CMS-spesifikasjon (selveid) |
| `UTVIKLINGSPLAN.md` | Utviklingsplan med 28 oppgaver |
