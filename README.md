# Statsbudsjettet.no

Publikasjonsplattform som presenterer det norske statsbudsjettet for allmennheten. Kombinerer regjeringens politiske budskap med faktiske budsjettall i en interaktiv, tilgjengelig nettopplevelse.

## Hurtigstart med GitHub Codespaces

> **Alt er ferdig konfigurert.** Codespaces installerer avhengigheter, starter PostgreSQL, oppretter databasen og seeder testdata automatisk. Du trenger bare å trykke to knapper.

### 1. Åpne Codespace

Klikk **Code → Codespaces → Create codespace on main** (eller den branchen du vil jobbe med).

Vent til terminalen viser:

```
============================================
  Miljøet er klart!

  Start utviklingsserveren:
    npm run dev

  Nettside:    http://localhost:3000
  Admin-panel: http://localhost:3000/admin
    → Logg inn med admin@dev.local
============================================
```

### 2. Start serveren

```bash
npm run dev
```

Codespaces åpner automatisk en nettleserfane med nettsiden.

### 3. Åpne admin-panelet

Gå til `/admin` i nettleseren. På innloggingssiden:

1. Bruk **Utviklingsmodus**-feltet nederst
2. Skriv `admin@dev.local`
3. Klikk **Logg inn som utvikler**

Ferdig — du har full administratortilgang.

### Testbrukere (seed-data)

| E-post | Rolle |
|--------|-------|
| `admin@dev.local` | Administrator (full tilgang) |
| `redaktor@dev.local` | Redaktør |

## Hva devcontaineren setter opp

Filen `.devcontainer/setup.sh` kjøres automatisk ved opprettelse og gjør:

1. `npm ci` — installerer alle avhengigheter
2. Starter PostgreSQL 16 og oppretter database `statsbudsjettet`
3. Genererer `.env` med lokal Postgres-URL og tilfeldig `NEXTAUTH_SECRET`
4. `prisma generate` + `prisma db push` — oppretter tabeller
5. `prisma/seed.ts` — fyller databasen med budsjettår 2025, moduler, temaer og nøkkeltall
6. Installerer Python-avhengigheter for datapipelinen (hvis `pipeline/requirements.txt` finnes)

Dersom noe feiler, kan du kjøre scriptet manuelt:

```bash
bash .devcontainer/setup.sh
```

## Teknisk stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | Next.js (App Router), TypeScript |
| Visualisering | D3.js + React (SVG) |
| Styling | CSS Modules + CSS-variabler |
| CMS / Admin | Postgres + Prisma + NextAuth |
| Datapipeline | Python (pandas, openpyxl) |
| Testing | Vitest + Testing Library |

## Lokalt oppsett (uten Codespaces)

Dersom du foretrekker å kjøre lokalt trenger du Node 20, PostgreSQL 16 og Python 3.12.

```bash
# 1. Installer avhengigheter
npm install

# 2. Opprett .env (rediger DATABASE_URL til din lokale Postgres)
cp .env.example .env

# 3. Sett opp databasen
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start serveren
npm run dev
```

## Admin-panel (CMS)

Admin-panelet er tilgjengelig på `/admin`.

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

```
kladd → til_godkjenning → godkjent → publisert
```

Fra «godkjent» kan man publisere umiddelbart eller sette et tidspunkt for automatisk publisering via cron-jobben `/api/publiser-cron`.

### Forhåndsvisning

Fra publiseringssiden kan redaktører åpne en forhåndsvisning som oppdateres automatisk via Server-Sent Events når innhold lagres.

### Tilgang i produksjon

I produksjon brukes Azure Entra ID (OIDC). Sett `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` og `AZURE_AD_TENANT_ID` i miljøvariablene.

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
.devcontainer/
├── devcontainer.json         # Codespaces-konfigurasjon
└── setup.sh                  # Automatisk oppsett (db, env, seed)
src/
├── app/
│   ├── page.tsx              # Forside (redirect til gjeldende år)
│   ├── [aar]/                # Offentlig budsjettårside
│   ├── admin/                # Admin-panel (CMS)
│   │   ├── layout.tsx        # Admin-layout med navigasjon
│   │   ├── budsjettaar/      # Budsjettår-administrasjon
│   │   ├── moduler/          # Modul-editor (drag-and-drop)
│   │   ├── temaer/           # Tema-editor
│   │   ├── nokkeltall/       # Nøkkeltall-editor
│   │   ├── programomraader/  # Programområde-editor
│   │   ├── media/            # Mediebibliotek
│   │   ├── brukere/          # Brukeradministrasjon
│   │   └── publisering/      # Publiseringsflyt
│   ├── api/                  # API-ruter
│   └── preview/              # Forhåndsvisning
├── components/
│   ├── admin/                # TipTapEditor, CmsAnnotert
│   ├── budget/               # Budsjettvisualisering
│   └── ...
├── lib/
│   ├── auth.ts               # NextAuth-konfigurasjon
│   ├── db.ts                 # Prisma-klient (singleton)
│   ├── requireSession.ts     # Sesjons- og rollesjekk
│   ├── datareferanse.ts      # Oppløs CMS-datareferanser
│   └── types/cms.ts          # CMS TypeScript-typer
└── middleware.ts              # Auth-middleware for /admin
prisma/
├── schema.prisma             # Databaseskjema
└── seed.ts                   # Testdata
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
