#!/usr/bin/env bash
# =============================================================================
# Codespaces / Dev Container — engangskjøring etter opprettelse.
# Gjør alt som trengs for at «npm run dev» og «/admin» fungerer umiddelbart.
#
# PostgreSQL kjører som en separat Docker Compose-tjeneste («db»).
# Databasen «statsbudsjettet» opprettes automatisk via POSTGRES_DB.
# =============================================================================
set -euo pipefail

echo "============================================"
echo "  Statsbudsjettet.no — setter opp miljøet"
echo "============================================"

# ----------------------------------------------------------
# 1. npm install
# ----------------------------------------------------------
echo ""
echo "→ Installerer npm-avhengigheter ..."
npm ci

# ----------------------------------------------------------
# 2. Sørg for at pg_isready er tilgjengelig
# ----------------------------------------------------------
if ! command -v pg_isready &>/dev/null; then
  echo ""
  echo "→ Installerer postgresql-client (for pg_isready) ..."
  sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-client >/dev/null 2>&1
fi

# ----------------------------------------------------------
# 3. Vent på at PostgreSQL er klar (tjeneste «db»)
# ----------------------------------------------------------
echo ""
echo "→ Venter på PostgreSQL (db) ..."
DB_READY=false
for i in $(seq 1 30); do
  if pg_isready -h db -U postgres -q 2>/dev/null; then
    echo "  PostgreSQL er klar."
    DB_READY=true
    break
  fi
  sleep 1
done

if [ "$DB_READY" = false ]; then
  echo "  ✗ PostgreSQL svarte ikke innen 30 sekunder. Avbryter."
  exit 1
fi

# ----------------------------------------------------------
# 4. Generer .env med riktige verdier for Codespaces
#    Overskriv alltid — sikrer riktig DATABASE_URL for db-tjenesten.
# ----------------------------------------------------------
echo ""
echo "→ Genererer .env ..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
cat > .env <<EOF
# --- Generert av .devcontainer/setup.sh ---
DATABASE_URL="postgresql://postgres:postgres@db:5432/statsbudsjettet?schema=public"

NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Azure Entra ID — ikke nødvendig i utvikling.
# AZURE_AD_CLIENT_ID=""
# AZURE_AD_CLIENT_SECRET=""
# AZURE_AD_TENANT_ID=""

MEDIA_UPLOAD_DIR="./public/uploads"
CRON_SECRET="dev-cron-secret"
EOF
echo "  .env opprettet med Postgres-URL (db:5432) og tilfeldig NEXTAUTH_SECRET."

# ----------------------------------------------------------
# 5. Prisma: generer klient + push skjema + seed
# ----------------------------------------------------------
echo ""
echo "→ Genererer Prisma-klient ..."
npx prisma generate

echo ""
echo "→ Pusher skjema til database (db push) ..."
npx prisma db push --skip-generate

echo ""
echo "→ Seeder databasen med testdata ..."
npx tsx prisma/seed.ts

# ----------------------------------------------------------
# 6. Opprett uploads-mappe
# ----------------------------------------------------------
mkdir -p public/uploads

# ----------------------------------------------------------
# 7. Python-avhengigheter for datapipelinen (valgfritt)
# ----------------------------------------------------------
if command -v pip &>/dev/null; then
  if [ -f pipeline/requirements.txt ]; then
    echo ""
    echo "→ Installerer Python-avhengigheter for pipeline ..."
    pip install -q -r pipeline/requirements.txt
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
echo "  Nettside:    http://localhost:3000"
echo "  Admin-panel: http://localhost:3000/admin"
echo "    → Logg inn med admin@dev.local"
echo "============================================"
