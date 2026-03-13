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

## Auth setup: what contributors actually need
Pave already has a working backend auth system. Contributors do not need to build password auth to get sign-in working locally.

Current auth methods:
- web: Google OAuth via NextAuth
- mobile: native Google sign-in plus backend-issued access and refresh tokens

### What `/api/health` means for auth
The readiness route reports `subsystems.auth.ready=true` when the **web auth** prerequisites are present:
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` or `NEXT_PUBLIC_APP_URL`

That check does **not** mean mobile sign-in is configured. Mobile auth has additional platform-specific client IDs.

### Web auth: minimum local setup
Set these in `.env.local`:

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_with_32_plus_char_random_string"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
```

In Google Cloud Console, create a **Web application** OAuth client and set:

- Authorized JavaScript origins:

```text
http://localhost:3000
```

- Authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
```

Once that is in place:
1. run `pnpm dev`
2. open `http://localhost:3000`
3. sign in with Google
4. confirm a protected action works, such as save, like, comment, publish, or export

### Mobile auth: extra local setup
Mobile sign-in uses Google on-device, then exchanges the verified Google identity for Pave access and refresh tokens.

Set these in `.env.local`:

```bash
GOOGLE_IOS_CLIENT_ID="your_ios_google_client_id"
GOOGLE_ANDROID_CLIENT_ID="your_android_google_client_id"
MOBILE_AUTH_JWT_SECRET="replace_with_mobile_jwt_secret"
```

Set these in `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
EXPO_PUBLIC_DEEP_LINK_BASE_URL="http://localhost:3000"
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="your_ios_google_client_id"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="your_android_google_client_id"
```

The client IDs must match between server and Expo:
- `GOOGLE_IOS_CLIENT_ID` <-> `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `GOOGLE_ANDROID_CLIENT_ID` <-> `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

Pave's Expo identifiers are currently:
- iOS bundle: `app.pave.mobile`
- Android package: `app.pave.mobile`

Use those when creating the corresponding Google mobile OAuth clients.

Once that is in place:
1. run `pnpm mobile:dev`
2. open the Expo app
3. use `Continue with Google`
4. confirm the app can load signed-in surfaces and protected API calls

### Shared protected-route behavior
Backend API routes already accept either:
- a web session cookie, or
- a mobile bearer token

That unified route protection is why contributors only need to configure the auth providers and envs, not build a second auth layer for mobile.

### Fast auth smoke checklist
If a contributor wants the shortest meaningful auth test:

Web:
1. sign in with Google on `localhost:3000`
2. save or like a post
3. create a comment or publish a post

Mobile:
1. sign in with Google in Expo
2. load the feed
3. open a post or trip that requires authenticated API access

For common failure modes, use [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md).

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
