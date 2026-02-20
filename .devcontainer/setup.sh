#!/usr/bin/env bash
# =============================================================================
# Codespaces / Dev Container — engangskjøring etter opprettelse.
# Gjør alt som trengs for at «npm run dev» og «/admin» fungerer umiddelbart.
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
# 2. Vent på at PostgreSQL er klar
# ----------------------------------------------------------
echo ""
echo "→ Venter på PostgreSQL ..."
for i in $(seq 1 30); do
  if pg_isready -q 2>/dev/null; then
    echo "  PostgreSQL er klar."
    break
  fi
  sleep 1
done

# ----------------------------------------------------------
# 3. Opprett database og bruker
# ----------------------------------------------------------
echo ""
echo "→ Oppretter database «statsbudsjettet» ..."
# Dev Container-featuren oppretter postgres-brukeren automatisk.
# createdb feiler stille hvis den allerede finnes.
createdb statsbudsjettet 2>/dev/null || true

# ----------------------------------------------------------
# 4. Generer .env med riktige verdier for Codespaces
# ----------------------------------------------------------
echo ""
echo "→ Genererer .env ..."
if [ ! -f .env ]; then
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  cat > .env <<EOF
# --- Generert av .devcontainer/setup.sh ---
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/statsbudsjettet?schema=public"

NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Azure Entra ID — ikke nødvendig i utvikling.
# AZURE_AD_CLIENT_ID=""
# AZURE_AD_CLIENT_SECRET=""
# AZURE_AD_TENANT_ID=""

MEDIA_UPLOAD_DIR="./public/uploads"
CRON_SECRET="dev-cron-secret"
EOF
  echo "  .env opprettet med lokal Postgres og tilfeldig NEXTAUTH_SECRET."
else
  echo "  .env finnes allerede — hopper over."
fi

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
# 6. Python-avhengigheter for datapipelinen (valgfritt)
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
