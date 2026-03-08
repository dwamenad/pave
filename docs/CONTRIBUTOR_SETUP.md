# Contributor Setup Guide

This guide is the fastest path for contributors to run Pave locally (web + mobile) without manual environment handholding.

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

## Database helpers
- Start DB: `pnpm db:up`
- Stop DB: `pnpm db:down`
- Tail DB logs: `pnpm db:logs`

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
