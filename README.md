# One Click Away (Social Itinerary MVP)

One Click Away turns social place inspiration into practical trip plans and now includes a social feed where people publish, remix, and discuss itineraries.

## What this MVP now supports

- Place search + Place Hub (`/place/[placeId]`) with Eat/Stay/Do and budget filters
- Trip builder with drag/drop reorder and day moves
- Public trip links and invite-token group voting
- Social feed with itinerary-linked posts (`/feed`)
- User profiles (`/profile/[username]`)
- Post detail with comments, likes, saves, and reports (`/post/[postId]`)
- Remix flow: clone someone else's trip into your own editable copy
- Personalized trip creation from links + caption + preferences (`/create`)
- Server-generated PDF export for trips

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Postgres + Prisma
- Google Maps Platform (Maps JS + Places)
- Auth.js (next-auth) with Google OAuth

## Required APIs (Google Cloud)

Enable:

- Maps JavaScript API
- Places API (New)

For OAuth sign-in:

- Create OAuth Client ID (Web application)

## Environment variables

Copy `.env.example` to both `.env` and `.env.local`:

```bash
cp .env.example .env
cp .env.example .env.local
```

Required values:

```env
DATABASE_URL="postgresql://<user>@127.0.0.1:5432/one_click_away?schema=public"
GOOGLE_MAPS_API_KEY_PUBLIC="your_referrer_restricted_maps_js_key"
GOOGLE_MAPS_API_KEY_SERVER="your_server_places_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="60"
NEXTAUTH_SECRET="long-random-secret"
GOOGLE_CLIENT_ID="google-oauth-client-id"
GOOGLE_CLIENT_SECRET="google-oauth-client-secret"
```

## Setup

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name social_mvp
pnpm prisma:seed
pnpm dev
```

## Core routes

- `/` planner landing
- `/feed` social feed
- `/create` personalized trip creation + optional publish
- `/post/[postId]` post detail + comments
- `/profile/[username]` user profile
- `/trip/[slug]` trip editor + share + remix + export PDF
- `/nearby` nearby now mode

## Key API routes

- `GET /api/feed`
- `POST /api/posts`
- `GET /api/posts/[postId]`
- `POST /api/posts/[postId]/like`
- `POST /api/posts/[postId]/save`
- `GET/POST /api/posts/[postId]/comments`
- `POST /api/reports`
- `POST /api/trips/[tripId]/remix`
- `POST /api/trips/[tripId]/export/pdf`
- `POST /api/links/metadata`

## Tests

```bash
pnpm test
```

Includes:

- itinerary scoring tests
- provider interface contract test
- feed ranking scoring test
- moderation helper tests
- link metadata hint extraction test

## Notes

- External social links are metadata-parsed best-effort; no authenticated scraping.
- Public posts appear in feed; unlisted posts are direct-link access only.
- Basic moderation includes profanity filtering and report/hide behavior.
