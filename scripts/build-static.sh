#!/usr/bin/env bash
# =============================================================================
# Statisk eksport for GitHub Pages.
#
# Fjerner server-only ruter (admin, API, preview, middleware) midlertidig,
# kjører «next build» med STATIC_EXPORT=true, og gjenoppretter filene etterpå.
# =============================================================================
set -euo pipefail

PROJ_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJ_ROOT"

# Midlertidig mappe for filer som ikke kan statisk eksporteres
STASH_DIR="$PROJ_ROOT/.static-build-stash"

cleanup() {
  echo ""
  echo "→ Gjenoppretter server-only filer ..."

  # Flytt tilbake alle stashede filer
  if [ -d "$STASH_DIR/app/admin" ]; then
    mv "$STASH_DIR/app/admin" src/app/admin
  fi
  if [ -d "$STASH_DIR/app/api" ]; then
    mv "$STASH_DIR/app/api" src/app/api
  fi
  if [ -d "$STASH_DIR/app/preview" ]; then
    mv "$STASH_DIR/app/preview" src/app/preview
  fi
  if [ -f "$STASH_DIR/middleware.ts" ]; then
    mv "$STASH_DIR/middleware.ts" src/middleware.ts
  fi

  rm -rf "$STASH_DIR"
  echo "  Alle filer gjenopprettet."
}

# Gjenopprett alltid, selv ved feil
trap cleanup EXIT

echo "============================================"
echo "  Statisk eksport for GitHub Pages"
echo "============================================"

# ----------------------------------------------------------
# 1. Generer Prisma-klient (trengs for typesjekking)
# ----------------------------------------------------------
echo ""
echo "→ Genererer Prisma-klient ..."
npx prisma generate

# ----------------------------------------------------------
# 2. Flytt server-only filer midlertidig ut
# ----------------------------------------------------------
echo ""
echo "→ Fjerner server-only ruter midlertidig ..."

mkdir -p "$STASH_DIR/app"

mv src/app/admin  "$STASH_DIR/app/admin"
mv src/app/api    "$STASH_DIR/app/api"
mv src/app/preview "$STASH_DIR/app/preview"
mv src/middleware.ts "$STASH_DIR/middleware.ts"

echo "  Fjernet: admin/, api/, preview/, middleware.ts"

# ----------------------------------------------------------
# 3. Kjør Next.js build med statisk eksport
# ----------------------------------------------------------
echo ""
echo "→ Kjører Next.js statisk eksport ..."
STATIC_EXPORT=true next build

echo ""
echo "============================================"
echo "  Statisk eksport fullført!"
echo "  Output: $PROJ_ROOT/out/"
echo "============================================"
