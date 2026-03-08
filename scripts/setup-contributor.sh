#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Pave contributor setup"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install pnpm 10.x and rerun."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 22.x and rerun."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" != "22" ]]; then
  echo "Warning: Node 22.x is recommended. Current: $(node -v)"
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

if [[ -f apps/mobile/.env.example && ! -f apps/mobile/.env ]]; then
  cp apps/mobile/.env.example apps/mobile/.env
  echo "Created apps/mobile/.env from apps/mobile/.env.example"
fi

if command -v docker >/dev/null 2>&1; then
  echo "==> Starting local postgres via docker compose"
  docker compose up -d db

  echo "==> Waiting for postgres to become ready"
  for i in {1..30}; do
    if docker compose exec -T db pg_isready -U postgres -d one_click_away >/dev/null 2>&1; then
      echo "Postgres is ready"
      break
    fi
    if [[ "$i" -eq 30 ]]; then
      echo "Postgres did not become ready in time."
      exit 1
    fi
    sleep 1
  done
else
  echo "Docker not found. Ensure DATABASE_URL points to a running Postgres instance."
fi

echo "==> Installing dependencies"
pnpm install

echo "==> Generating Prisma client"
pnpm prisma:generate

echo "==> Applying migrations"
set +e
MIGRATE_OUTPUT="$(pnpm exec prisma migrate deploy 2>&1)"
MIGRATE_EXIT=$?
set -e
echo "$MIGRATE_OUTPUT"

if [[ "$MIGRATE_EXIT" -ne 0 ]]; then
  if grep -q "Error: P3005" <<<"$MIGRATE_OUTPUT"; then
    echo "Existing schema detected. Falling back to prisma db push for local sync."
    pnpm exec prisma db push
  else
    echo "Migration failed. Resolve the database issue and rerun setup."
    exit "$MIGRATE_EXIT"
  fi
fi

echo "==> Seeding database"
pnpm prisma:seed

echo
echo "Setup complete."
echo "Run web only:      pnpm dev"
echo "Run mobile only:   pnpm mobile:dev"
echo "Run both together: pnpm dev:all"
