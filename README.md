# One Click Away

One Click Away is a social itinerary app where users can discover trip ideas, generate personalized itineraries from social context, and publish/share those itineraries with the community.

This repo combines two experiences in one product:

1. **Trip planning utility**: place search, itinerary builder, map/list views, budget filters, sharing, and group voting.
2. **Social layer**: feed, profiles, post detail, comments, likes/saves, remix, reporting/moderation, and PDF export.

## Product scope (current MVP)

### Planner features

- Search destination/place and open a Place Hub (`/place/[placeId]`)
- Browse nearby options by category: Eat / Stay / Do
- Budget filters (Budget / Mid / Luxury)
- Build and edit 1-3 day itineraries
- Reorder/move/remove trip items
- Public share links and invite-token voting
- Nearby mode for quick no-login discovery (`/nearby`)

### Social features

- Publish itinerary-linked posts with caption + optional media URL
- Public feed (`/feed`) and profile pages (`/profile/[username]`)
- Post detail pages (`/post/[postId]`)
- Likes, saves, and comments
- Report + hide baseline moderation
- Remix any itinerary into your own editable trip
- Server-generated PDF export from trip pages

### Personalized generation from social context

- Paste 1-5 social links + text context
- Metadata fetch (title/description/OG where available)
- Best-effort location hint extraction from text + links
- Location confirmation via Places suggestions when ambiguous
- Preference-driven trip generation (budget, pace, days, tags)

## Tech stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling/UI**: Tailwind CSS + lightweight shadcn-style components
- **Database/ORM**: PostgreSQL + Prisma
- **Maps/Places**: Google Maps JS + Places APIs
- **Auth**: Auth.js (`next-auth`) with Google OAuth
- **PDF**: `pdf-lib` server-side generation
- **Testing**: Vitest

## High-level architecture

### Backend modules

- `lib/providers/*`: Google Places provider abstraction
- `lib/server/trip-service.ts`: itinerary generation + trip retrieval
- `lib/server/social-service.ts`: feed/profile/post retrieval and shaping
- `lib/server/link-metadata.ts`: URL metadata + parsing helpers
- `lib/server/moderation.ts`: profanity + tag normalization
- `lib/server/export-service.ts`: PDF generation + export records
- `lib/auth.ts`: auth/session helpers

### API routes

- Trips: create/edit/share/vote/remix/export
- Social: feed/posts/likes/saves/comments/reports
- Metadata parsing: social parse + link metadata
- Places: autocomplete/details/nearby/photo proxy
- Auth: `next-auth` handler

### Data model groups (Prisma)

- **Auth/identity**: `User`, `Account`, `Session`, `VerificationToken`, `AnonymousSession`
- **Planner**: `Trip`, `TripDay`, `TripItem`, `GroupInvite`, `Vote`
- **Places cache**: `PlaceCache`, `NearbyCache`
- **Social**: `Post`, `PostSourceLink`, `PostLike`, `PostSave`, `Comment`, `Report`
- **Reuse/export**: `TripRemix`, `TripExport`

## Routes

### Core pages

- `/` planner landing + social parse
- `/place/[placeId]` place hub
- `/trip/[slug]` itinerary builder + share + remix + export
- `/nearby` nearby-now mode

### Social pages

- `/feed` community itinerary feed
- `/create` social-context itinerary generation + optional publish
- `/post/[postId]` post detail and comments
- `/profile/[username]` user posts + saved posts

## Environment configuration

Create both `.env` and `.env.local` from `.env.example`:

```bash
cp .env.example .env
cp .env.example .env.local
```

Required variables:

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

### Google key restrictions (recommended)

- `GOOGLE_MAPS_API_KEY_PUBLIC`
  - Restrict by **HTTP referrer** (`http://localhost:3000/*` for dev)
  - API restriction: **Maps JavaScript API**
- `GOOGLE_MAPS_API_KEY_SERVER`
  - API restriction: **Places API**
  - For local dev, keep app restriction relaxed first; tighten later

## Local development

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name social_mvp
pnpm prisma:seed
pnpm dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/feed`
- `http://localhost:3000/create`

## Database notes

This project expects a running Postgres instance.

If you run a local cluster manually (example):

```bash
initdb -D "$HOME/.postgres-oca"
pg_ctl -D "$HOME/.postgres-oca" -l "$HOME/.postgres-oca/server.log" start
createdb one_click_away
```

Connection readiness:

```bash
pg_isready -h 127.0.0.1 -p 5432
```

## Testing

```bash
pnpm test
```

Current automated coverage includes:

- itinerary scoring behavior
- provider interface contract
- feed ranking scorer
- moderation utilities
- link metadata hint extraction

## Build

```bash
pnpm build
pnpm start
```

## Security and policy notes

- No authenticated scraping of Instagram/TikTok/Twitter content.
- Social links are handled as best-effort metadata + URL/text hints.
- Server key is never intentionally exposed to browser clients.
- Basic rate limiting is applied on public endpoints.
- MVP moderation: profanity filtering + user reports + hide behavior.

## Known MVP constraints

- No real-time comments/votes (polling/refresh model)
- No media upload pipeline (external URL media only)
- No advanced admin dashboard yet
- Feed ranking is deterministic and simple (recency + engagement weighted)

## Deploy considerations

Before production launch:

- Enforce strict Google key restrictions
- Set robust `NEXTAUTH_SECRET`
- Configure production Postgres + SSL
- Add proper object storage if moving beyond URL-based media
- Add observability for API errors and moderation activity
