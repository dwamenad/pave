# Pave

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18-149eca)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6e9f18)](https://vitest.dev/)
[![Node 22.x](https://img.shields.io/badge/Node-22.x-5fa04e)](https://nodejs.org/)

<p align="center">
  <img src="./docs/assets/pave-banner.svg" alt="Pave banner" width="100%" />
</p>

<p align="center">
  <strong>Turn social travel inspiration into ready-to-run itineraries.</strong>
  <br />
  Discover places, generate personalized trips, publish to a social feed, and remix community plans.
</p>

## Documentation Index

- Product specification: [`docs/PRD.md`](./docs/PRD.md)
- Reliability baseline: [`docs/SLOS_AND_DASHBOARDS.md`](./docs/SLOS_AND_DASHBOARDS.md)
- Mobile infrastructure runbook: [`docs/MOBILE_INFRA.md`](./docs/MOBILE_INFRA.md)
- Contributor onboarding: [`docs/CONTRIBUTOR_SETUP.md`](./docs/CONTRIBUTOR_SETUP.md)
- Environment setup and local runbook: this README (`Quick Start`, `Environment`, `Developer Workflow`)

## Why Pave?

Pave bridges the gap between social discovery and practical planning.

- Social-first trip creation from caption context + links
- Fast itinerary generation with editable 1-3 day plans
- Share, remix, comment, save, and follow creator workflows
- Feed ranking with candidate scoring + diversity re-ranking
- Safety baseline with reports, hide behavior, and user block graph

## Product Surface

| Area | What you can do |
|---|---|
| Planner | Search destinations, build itineraries, reorder/move items, nearby exploration |
| Social | Publish itinerary posts, browse feed, like/save/comment, remix trips |
| Growth | Follow/unfollow, notifications, event tracking, share attribution |
| Reliability | Distributed rate limiting (Upstash) with local fallback |
| Safety | Profanity checks, report/hide moderation flow, block graph filtering |

## Product Tour

<p align="center">
  <img src="./docs/assets/pave-tour.svg" alt="Pave product flow" width="100%" />
</p>

<p align="center">
  <em>Ingest social context, build itineraries, socialize in-feed, and optimize with event/ranking loops.</em>
</p>

## Core Routes

### End-user pages

- `/` planner-first landing with social parse entry
- `/feed` social itinerary feed (`for_you`, `following`, `trending` modes)
- `/create` social-context itinerary generation and optional publish
- `/trip/[slug]` itinerary builder + share + remix + export
- `/post/[postId]` post detail + comments + source links
- `/profile/[username]` creator profile, posts, and saved posts
- `/nearby` no-login nearby discovery
- `/notifications` activity inbox
- `/support` safety and support contact

### API highlights

- Feed: `/api/feed`, `/api/feed/for-you`, `/api/feed/following`
- Posts/social: `/api/posts/*`, `/api/reports`, `/api/comments/*`
- Trips: `/api/trips/*` (share, vote, remix, export, items CRUD)
- Growth/graph: `/api/events/batch`, `/api/users/[userId]/follow`, `/api/users/[userId]/block`, `/api/notifications`, `/api/shares/track`
- Parsing/places: `/api/social/parse`, `/api/links/metadata`, `/api/search/autocomplete`, `/api/places/*`

## Architecture

### Tech stack

- Framework: Next.js 14 (App Router), React 18, TypeScript
- Styling/UI: Tailwind CSS + lightweight shadcn-style primitives
- Data: PostgreSQL + Prisma
- Maps/Places: Google Maps JavaScript API + Places API
- Auth: Auth.js (`next-auth`) with Google OAuth
- PDF: `pdf-lib` server-side generation
- Tests: Vitest

### Key server modules

- `lib/server/trip-service.ts`: itinerary generation and trip retrieval
- `lib/server/social-service.ts`: feed/profile/post shaping and ranking flows
- `lib/server/feed-ranker.ts`: rank features, scoring, diversity re-ranking
- `lib/server/events.ts`: event ingestion, feed action tracking, notifications
- `lib/server/rate-limit.ts`: Upstash REST limit path + local fallback
- `lib/server/link-metadata.ts`: URL metadata + hint extraction
- `lib/server/moderation.ts`: profanity and tag sanitation

### Data model groups

- Auth/identity: `User`, `Account`, `Session`, `VerificationToken`, `AnonymousSession`
- Planner: `Trip`, `TripDay`, `TripItem`, `GroupInvite`, `Vote`
- Social: `Post`, `PostSourceLink`, `PostLike`, `PostSave`, `Comment`, `Report`
- Growth/graph: `Follow`, `Block`, `Event`, `Notification`, `FeedImpression`, `FeedAction`, `ShareAttribution`
- Reuse/export: `TripRemix`, `TripExport`
- Cache: `PlaceCache`, `NearbyCache`

## Quick Start

### Contributor bootstrap (recommended)

```bash
pnpm setup:contributor
```

### 1) Requirements

- Node.js `22.x`
- pnpm `10.x`
- Docker Desktop (recommended for local Postgres)

### 2) Install + setup

```bash
pnpm install
cp .env.example .env
cp .env.example .env.local
cp apps/mobile/.env.example apps/mobile/.env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

### 3) Run

```bash
pnpm dev
```

Run web + mobile together:

```bash
pnpm dev:all
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/feed`
- `http://localhost:3000/create`

## Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/one_click_away?schema=public"
GOOGLE_MAPS_API_KEY_PUBLIC="your_referrer_restricted_maps_js_key"
GOOGLE_MAPS_API_KEY_SERVER="your_server_places_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="60"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
SUPPORT_EMAIL="support@pave.app"
DEEP_LINK_BASE_URL="http://localhost:3000"
NEXTAUTH_SECRET="long-random-secret"
GOOGLE_CLIENT_ID="google-oauth-client-id"
GOOGLE_CLIENT_SECRET="google-oauth-client-secret"
GOOGLE_IOS_CLIENT_ID=""
GOOGLE_ANDROID_CLIENT_ID=""
MOBILE_AUTH_JWT_SECRET="replace_with_mobile_jwt_secret"
MOBILE_ACCESS_TOKEN_TTL_MINUTES="15"
MOBILE_REFRESH_TOKEN_TTL_DAYS="30"
```

Google key guidance:

- `GOOGLE_MAPS_API_KEY_PUBLIC`
  - Restrict by HTTP referrer (`http://localhost:3000/*` in dev)
  - Restrict API to Maps JavaScript API
- `GOOGLE_MAPS_API_KEY_SERVER`
  - Restrict API to Places API
  - Tighten app restrictions for production

## Developer Workflow

```bash
pnpm test
pnpm lint
pnpm build
```

Coverage currently includes itinerary logic, provider contract checks, feed ranking behavior, moderation utilities, and metadata hint extraction.

## Security and Policy Notes

- No authenticated scraping of Instagram/TikTok/X content
- Link handling is metadata + URL/text hint extraction only
- Server-side API keys are not intentionally exposed to clients
- Public endpoints have rate limiting (distributed if Upstash is configured)
- Moderation baseline includes profanity filtering and report/hide behavior
- Block graph prevents blocked-user visibility in feed/profile fetches
- Deep-link association files are in `public/.well-known/*`

## Operations

SLO and dashboard baseline lives in:

- `docs/SLOS_AND_DASHBOARDS.md`

## Known MVP Constraints

- No realtime comments/votes (polling model)
- External URL media only (no internal upload pipeline)
- No advanced admin moderation dashboard yet
- Feed ranking is heuristic v1 (not ML model serving)

## Deployment Notes

Before production launch:

- enforce strict Google API key restrictions
- set robust `NEXTAUTH_SECRET`
- run production Postgres with SSL and backups
- add object storage if moving beyond URL media
- wire error tracking + API latency dashboards
