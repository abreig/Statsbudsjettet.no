#!/usr/bin/env bash
# =============================================================================
# Codespaces / Dev Container — engangskjøring etter opprettelse.
# Gjør alt som trengs for at «npm run dev» og «/admin» fungerer umiddelbart.
#
# PostgreSQL kjører som en separat Docker Compose-tjeneste («db»).
# Databasen «statsbudsjettet» opprettes automatisk via POSTGRES_DB.
#
# Skriptet feiler IKKE på database-steg — frontend fungerer uansett.
# =============================================================================
set -uo pipefail

echo "============================================"
echo "  Statsbudsjettet.no — setter opp miljøet"
echo "============================================"

# ----------------------------------------------------------
# 1. npm install
# ----------------------------------------------------------
echo ""
echo "→ Installerer npm-avhengigheter ..."
if ! npm ci; then
  echo "  ⚠ npm ci feilet — prøver npm install ..."
  npm install
fi

# ----------------------------------------------------------
# 2. Generer .env med riktige verdier
# ----------------------------------------------------------
echo ""
echo "→ Genererer .env ..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Bestem NEXTAUTH_URL basert på om vi kjører i GitHub Codespaces
if [ -n "${CODESPACE_NAME:-}" ]; then
  FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  NEXTAUTH_URL_VALUE="https://${CODESPACE_NAME}-3000.${FORWARDING_DOMAIN}"
  echo "  Codespaces oppdaget — bruker ${NEXTAUTH_URL_VALUE}"
else
  NEXTAUTH_URL_VALUE="http://localhost:3000"
fi

cat > .env <<EOF
# --- Generert av .devcontainer/setup.sh ---
DATABASE_URL="postgresql://postgres:postgres@db:5432/statsbudsjettet?schema=public"

NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL_VALUE}"

# Azure Entra ID — ikke nødvendig i utvikling.
# AZURE_AD_CLIENT_ID=""
# AZURE_AD_CLIENT_SECRET=""
# AZURE_AD_TENANT_ID=""

MEDIA_UPLOAD_DIR="./public/uploads"
CRON_SECRET="dev-cron-secret"
EOF
echo "  .env opprettet med Postgres-URL (db:5432) og tilfeldig NEXTAUTH_SECRET."

# ----------------------------------------------------------
# 3. Opprett mapper
# ----------------------------------------------------------
mkdir -p public/uploads

# ----------------------------------------------------------
# 4. Prisma: generer klient (fungerer uten database)
# ----------------------------------------------------------
echo ""
echo "→ Genererer Prisma-klient ..."
npx prisma generate || echo "  ⚠ Prisma generate feilet — admin-panel krever manuell kjøring."

# ----------------------------------------------------------
# 5. Database-oppsett (valgfritt — feiler ikke skriptet)
# ----------------------------------------------------------
DB_OK=false

# Sjekk om pg_isready finnes, installer om nødvendig
if ! command -v pg_isready &>/dev/null; then
  echo ""
  echo "→ Installerer postgresql-client ..."
  sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-client >/dev/null 2>&1 || true
fi

if command -v pg_isready &>/dev/null; then
  echo ""
  echo "→ Venter på PostgreSQL (db) ..."
  for i in $(seq 1 30); do
    if pg_isready -h db -U postgres -q 2>/dev/null; then
      echo "  PostgreSQL er klar."
      DB_OK=true
      break
    fi
    sleep 1
  done
fi

if [ "$DB_OK" = true ]; then
  echo ""
  echo "→ Pusher skjema til database ..."
  if npx prisma db push --skip-generate; then
    echo ""
    echo "→ Seeder databasen med testdata ..."
    npx tsx prisma/seed.ts || echo "  ⚠ Seeding feilet — databasen er tom."
  else
    echo "  ⚠ Prisma db push feilet."
  fi
else
  echo ""
  echo "  ⚠ PostgreSQL ikke tilgjengelig — hopper over database-oppsett."
  echo "    Frontend (npm run dev) fungerer fortsatt."
  echo "    Admin-panel krever database. Kjør manuelt:"
  echo "      npx prisma db push && npx tsx prisma/seed.ts"
fi

# ----------------------------------------------------------
# 6. Python-avhengigheter for datapipelinen (valgfritt)
# ----------------------------------------------------------
if command -v pip &>/dev/null; then
  if [ -f pipeline/requirements.txt ]; then
    echo ""
    echo "→ Installerer Python-avhengigheter for pipeline ..."
    pip install -q -r pipeline/requirements.txt || echo "  ⚠ Python-avhengigheter feilet."
  fi
fi

# ----------------------------------------------------------
# Ferdig
# ----------------------------------------------------------
echo ""
echo "============================================"
echo "  Miljøet er klart!"
echo ""
echo "  Start utviklingsserveren:"
echo "    npm run dev"
echo ""
echo "  Nettside:    ${NEXTAUTH_URL_VALUE}"
echo "  Admin-panel: ${NEXTAUTH_URL_VALUE}/admin"
if [ "$DB_OK" = true ]; then
  echo "    → Logg inn med admin@dev.local"
else
  echo "    ⚠ Database ikke satt opp — admin krever manuell konfigurasjon."
fi
echo "============================================"
