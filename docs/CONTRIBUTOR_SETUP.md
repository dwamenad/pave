# Contributor Setup Guide

This guide is the fastest path for contributors to run Pave locally (web + mobile) without manual environment handholding.

## Repository posture

Pave is a proprietary repository. Access for contribution does not grant permission to reuse or redistribute the code outside work authorized by the repository owner.

Before sharing code, snippets, or internal docs externally, check [REPO_POLICY.md](./REPO_POLICY.md).

## Prerequisites
- Node.js 22.x
- pnpm 10.x
- Docker Desktop (recommended for local Postgres)

## One-Command Bootstrap
From repo root:

```bash
pnpm setup:contributor
```

The setup script will:
1. create `.env` and `.env.local` from `.env.example` if missing,
2. create `apps/mobile/.env` from `apps/mobile/.env.example` if missing,
3. start local Postgres via Docker Compose,
4. install dependencies,
5. generate Prisma client,
6. apply migrations and seed data.

## Run the app
- Web only: `pnpm dev`
- Mobile only: `pnpm mobile:dev`
- Web + mobile together: `pnpm dev:all`

### Theme preference
Pave now supports both light and dark mode in the web app.

- the header theme toggle lets you switch between them manually
- the app defaults to your system theme on first load
- your browser keeps the selected theme for later visits

When you are doing visual QA, it is worth checking both themes on the routes you touched instead of assuming the semantic tokens carried everything automatically.

For a reusable pass/fail checklist, use [THEME_QA_CHECKLIST.md](./THEME_QA_CHECKLIST.md).

## What good local state looks like
Once Docker Postgres is up and the seed has run cleanly, you should be able to load seeded surfaces immediately.

| `/create` | `/nearby` |
|---|---|
| <img src="./assets/screenshots/pave-smoke-create.png" alt="Local create flow screenshot" width="100%" /> | <img src="./assets/screenshots/pave-smoke-nearby.png" alt="Local nearby screenshot" width="100%" /> |

These screenshots were captured against the local seeded dataset, so they are a good baseline for quick smoke checks when a contributor is unsure whether their environment is healthy.

## Database helpers
- Start DB: `pnpm db:up`
- Stop DB: `pnpm db:down`
- Tail DB logs: `pnpm db:logs`
- Start full local stack: `pnpm stack:up`
- Stop full local stack: `pnpm stack:down`
- Tail full stack logs: `pnpm stack:logs`

## Quick runtime health check
Once the web app is running, you can verify the repo-only readiness path with:

```bash
curl http://localhost:3000/api/health
```

That route reports:
- app version + environment
- database connectivity
- readiness booleans for auth, maps, AI create, mobile telemetry, and rate limiting

Maps, AI create, and mobile telemetry are allowed to show as degraded locally without breaking unrelated screens. Database and auth are the important baseline checks.

### Docker-backed local DB note
If you are using the bundled Docker Postgres container, your local `DATABASE_URL` should point at the compose credentials:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/one_click_away?schema=public"
```

This matters most for contributors who already had an older local `.env` or `.env.local` before Docker setup was standardized. `pnpm setup:contributor` will create missing env files, but it will not overwrite an existing local connection string for you.

### Dockerized web + DB note
If you want the web app to run inside Docker as well, use:

```bash
pnpm stack:up
```

In that mode:

- the web container connects to Postgres with `DATABASE_URL=postgresql://postgres:postgres@db:5432/one_click_away?schema=public`
- your host machine should still use `127.0.0.1:5432` if you run Prisma or the web app outside Docker
- the app still uses Postgres-backed place/nearby cache tables
- there is not yet a local Redis container; route limiting continues to use the current Upstash-or-local fallback path

## If setup fails
1. Ensure Docker is running.
2. Ensure port `5432` is free.
3. Ensure Node major version is `22`.
4. Re-run `pnpm setup:contributor`.

## Optional keys for full functionality
- To use Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.
- To use native Google sign-in in the Expo app, set:
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
  in `apps/mobile/.env`.
- To use Places API features without quota/auth errors, set both maps keys in `.env.local`:
  - `GOOGLE_MAPS_API_KEY_PUBLIC`
  - `GOOGLE_MAPS_API_KEY_SERVER`
- To exercise the advisory AI create flow locally, also set:
  - `OPENAI_API_KEY`
  - `OPENAI_RESPONSES_MODEL`
  - `OPENAI_VECTOR_STORE_ID`
  - `ENABLE_AI_CREATE`
  - `NEXT_PUBLIC_ENABLE_AI_CREATE`
- To force local place/demo behavior without live provider calls, set:
  - `USE_MOCK_PLACES_PROVIDER=true`
