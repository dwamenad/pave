# Product Requirements Document (PRD)
## Pave - Social Itinerary Platform

**Version:** 1.0 (Contributor Build Spec)  
**Date:** March 1, 2026  
**Status:** Active Implementation Baseline  
**Repository:** `dwamenad/pave`

---

## 1) Executive Summary

Pave helps people turn travel inspiration from social content into practical, editable itineraries, then share those itineraries in a social feed.

This PRD is implementation-focused and decision-complete for contributors. It documents what to build, how it should behave, how to test it, what can fail, and how to reduce those failures.

The product combines:
- **Planning utility** (maps, nearby discovery, itinerary generation, trip editing)
- **Social product** (posts, profiles, likes/saves/comments, remix, moderation)

## 1A) Current Milestone Snapshot (`v0.2.0`)

The current tagged baseline is `v0.2.0` (`preapi-hardening-v1`), which captures the repo after the pre-API hardening pass.

What shipped in this milestone:
- a centralized place-service boundary so app code no longer has to invent its own provider/fallback rules
- explicit provider reason codes plus a local-only mock places mode for development and demos
- cache metadata and stale-if-error handling for place and nearby lookups
- clearer create-flow state handling with machine-readable degraded/fallback outcomes
- stronger nearby UX for empty, degraded, stale, and mock-backed states
- expanded funnel instrumentation for parse, create, AI draft, publish, and invite actions
- richer seed data with a believable social graph and remixable published trips
- contributor documentation for the Docker-backed local database path
- smoke-tested screenshots and docs updates reflecting the current live local product state

Operationally, `v0.2.0` is the point where the local product loop is much easier to validate before introducing additional provider complexity.

---

## 2) Problem Statement

People see places in short-form content (Instagram, TikTok, YouTube, X) but struggle to convert that inspiration into a trip they can actually execute. Existing tools are either:
- great for **content discovery** but weak for planning, or
- great for **planning** but disconnected from social inspiration.

Pave bridges both.

---

## 3) Product Vision

Be the fastest path from “I saw this online” to “I have a workable plan I can use, share, and remix.”

## 3A) Intellectual Property Posture

Pave is a proprietary product. The repository is not intended to be open source, and contributor access should not be interpreted as permission to reuse the codebase outside authorized work on Pave.

Operationally, this means:
- repository notices must remain explicit and current,
- contributor docs must state the proprietary posture clearly,
- any future public packages or open-source utilities must be carved out deliberately with their own license.

---

## 4) Objectives and Success Metrics

## Primary objectives
1. Convert social inspiration into a usable trip plan quickly.
2. Enable social sharing and remix loops to increase reuse.
3. Keep reliability high enough for public sharing.

## Success metrics (MVP)
- `TTV` (time to first viable itinerary): median < 3 minutes.
- Feed publish conversion: >= 20% of created trips become posts.
- Remix rate: >= 10% of viewed posts get remixed.
- Export completion success: >= 98% PDF generation success.
- API error rate (5xx) on core endpoints: < 1%.

---

## 5) Users and Personas

1. **Casual traveler**
- Finds content online and wants a quick plan.
- Values simplicity and speed.

2. **Travel curator/creator**
- Publishes itineraries for others.
- Cares about presentation, sharing, and engagement.

3. **Group planner**
- Shares trip links and collects votes.
- Needs collaboration without heavy setup.

---

## 6) Scope

## In scope (MVP)
- Place search and Place Hub browse (Eat/Stay/Do).
- Social link + caption parsing into location hints.
- Preference-aware itinerary generation.
- Advisory AI-assisted itinerary drafting for the web create flow, with explicit review before persistence.
- Trip builder CRUD and drag/drop-like reordering UX.
- Public trip share and group invite voting.
- Authenticated social feed and post publishing.
- Likes, saves, comments.
- Remix itinerary into a user-owned copy.
- Report and hide moderation baseline.
- Server-side PDF export.

## Out of scope (MVP)
- Full media upload pipeline (external URL only for post media).
- Realtime comments/chat.
- Advanced moderation console.
- Paid/social platform API partnerships requiring elevated scopes.

## 6A) Current Product Constraints

These constraints are still real in the current implementation and should remain explicit in contributor planning, roadmap discussions, and external product descriptions:

- Pave does not yet have a full production media upload pipeline.
- Comments and group voting are functional workflows, but they are not realtime systems.
- Moderation exists in-product, but there is not yet a full internal moderation console.
- Feed ranking is currently heuristic and feature-driven, not an ML-serving or learned-ranking stack.
- The mobile app is a beta client with core parity goals, not yet a separately scaled public app-store release operation.

---

## 7) Functional Requirements

## 7.1 Authentication and Identity
- Google OAuth sign-in via Auth.js.
- Anonymous users may browse public content.
- Auth required for: post publish, like/save/comment, remix, report, PDF export request.
- Profile page exists at `/profile/[username]`.

## 7.2 Trip Planning
- Search place via autocomplete.
- Place Hub page shows tabs (`eat`, `stay`, `do`) with map/list interactions.
- Budget filter maps to price level ranges.
- Trip generator creates 1-3 day itinerary with deterministic scoring.
- Trip editor supports add/remove/reorder/move items.
- Direct trip structure mutation routes must require an authenticated actor and enforce author-only edits for itinerary items and invite creation.

## 7.3 Social Input and Personalization
- Accept caption + up to 5 links.
- Fetch accessible metadata (OG/title/description) for links.
- Extract location/activity hints from caption + metadata + URL tokens.
- If ambiguous, require place confirmation.
- Preference inputs:
  - budget (`budget|mid|luxury`)
  - days (`1|2|3`)
  - pace (`slow|balanced|packed`)
  - vibe tags
  - dietary tags

## 7.3A Advisory AI Create Flow
- The web `/create` surface must support an AI draft path in addition to the deterministic generator.
- AI create is **advisory-first**:
  - draft first,
  - review second,
  - persist only after explicit user acceptance.
- The AI draft path must:
  - use OpenAI Responses API
  - enforce a strict structured output schema
  - use read-only live-data tools for place details, nearby search, and requester-only user context
  - optionally use file-search retrieval over curated internal planning docs
- The AI draft path must not:
  - mutate trips directly
  - invent place ids
  - invent reservations, hours, or transport guarantees
- If the AI path fails, times out, emits malformed output, duplicates places, or references unresolved places, the system must degrade to a deterministic fallback draft instead of hard-failing the create flow.
- The deterministic generator remains a first-class option and the fallback path.

## 7.4 Social Posts and Feed
- Post must reference an existing trip.
- Post payload includes caption, optional media URL, visibility (`PUBLIC|UNLISTED`), tags, destination label.
- Post media currently supports external `http(s)` URLs only; native media upload is not part of this baseline.
- Feed displays only `ACTIVE + PUBLIC` posts.
- Unlisted posts are viewable by direct URL; not discoverable in feed/profile for non-owners.

## 7.5 Engagement
- Like toggle (idempotent via unique constraint).
- Save toggle (idempotent via unique constraint).
- Comments support creation/listing for active posts.

## 7.6 Remix
- User can clone another trip into a new editable trip.
- Lineage tracked (`TripRemix` table).
- UI should signal “Remixed from ...”.

## 7.7 Moderation
- Profanity check on post/comment creation.
- Report endpoint for posts/comments.
- Reported content can be soft-hidden.
- Users can delete own post/comment.

## 7.8 PDF Export
- Server-generated PDF from trip data.
- Export status tracked (`TripExport`).
- Response returns downloadable PDF stream on success.
- Failures must return structured reason codes and recovery-oriented user copy.

## 7.9 Runtime readiness and trust
- The repo exposes a lightweight readiness route at `/api/health`.
- Optional integrations should show as degraded rather than crashing unrelated product surfaces.
- First-party `/support`, `/privacy`, and `/terms` pages must stay aligned with the actual product boundaries.

---

## 8) Data Model Requirements (Prisma)

Required entities and purpose:
- `User`, `Account`, `Session`, `VerificationToken`, `AnonymousSession`
- `Trip`, `TripDay`, `TripItem`, `GroupInvite`, `Vote`
- `PlaceCache`, `NearbyCache`
- `Post`, `PostSourceLink`, `PostLike`, `PostSave`, `Comment`, `Report`
- `TripRemix`, `TripExport`

All contributor changes to model must include:
1. schema update,
2. migration,
3. seed compatibility update,
4. endpoint/type updates,
5. tests.

---

## 9) API Surface (MVP)

## Core social APIs
- `GET /api/feed`
- `POST /api/posts`
- `GET /api/posts/[postId]`
- `POST /api/posts/[postId]/like`
- `POST /api/posts/[postId]/save`
- `GET|POST /api/posts/[postId]/comments`
- `POST /api/posts/[postId]/delete`
- `POST /api/comments/[commentId]/delete`
- `POST /api/reports`

## Planner + sharing APIs
- `POST /api/trips`
- `POST /api/ai/trips/draft`
- `POST /api/trips/from-draft`
- `GET /api/trips/slug/[slug]`
- `POST /api/trips/[tripId]/items/add`
- `POST /api/trips/[tripId]/items/remove`
- `POST /api/trips/[tripId]/items/reorder`
- `POST /api/trips/[tripId]/items/move`
- `POST /api/trips/[tripId]/share`
- `POST /api/trips/[tripId]/invite`
- `POST /api/trips/[tripId]/vote`
- `POST /api/trips/[tripId]/remix`
- `POST /api/trips/[tripId]/export/pdf`

## Parsing / metadata / places APIs
- `POST /api/social/parse`
- `POST /api/links/metadata`
- `GET /api/search/autocomplete`
- `GET /api/places/details`
- `GET /api/places/nearby`
- `GET /api/health`

---

## 10) UX Requirements by Route

- `/`: Planner-first landing + CTA to feed/create
- `/feed`: Public post list with engagement actions
- `/create`: Social links + preferences -> parse -> AI draft or deterministic generation -> review -> create trip -> optional publish
- `/post/[postId]`: Post detail + source links + comments + report
- `/profile/[username]`: Author posts + saved posts (visibility-safe)
- `/trip/[slug]`: Builder + share + remix + export + vote
- `/place/[placeId]`: Nearby place hub + create/share CTA
- `/nearby`: No-login quick picks
- `/support`, `/privacy`, `/terms`: trust, support, and current product-boundary pages

---

## 11) Non-Functional Requirements

## Performance
- Feed API p95 < 500ms under nominal load.
- Link metadata fetch timeout <= 5s, bounded response size.
- Place API calls cached via DB TTL.

## Reliability
- Build/test must pass on PR.
- All user-facing API errors return JSON (no HTML crash payloads).

## Security
- No unrestricted server-key exposure.
- SSRF protections for metadata fetch.
- Data minimization for API responses (no accidental PII fields).
- Auth checks on all write endpoints.

## Observability (minimum)
- Log route-level errors with endpoint and request context.
- Track export failures and moderation events.
- Track AI create request, success, fallback, accept, and reject events with lightweight metadata only.

---

## 12) Known Failure Modes and Fix Playbook

1. **Missing env variables (`DATABASE_URL`, Google keys, OAuth secrets, OpenAI AI-create vars)**
- Symptom: Prisma runtime errors, invalid key errors.
- Fix: `.env` + `.env.local` sync from `.env.example`, verify values, restart server.

2. **Postgres unavailable**
- Symptom: `P1001` or runtime DB connection failures.
- Fix: start local DB, verify with `pg_isready`, rerun migrate/seed.

3. **Google key restriction mismatch**
- Symptom: Places API invalid key/permission errors.
- Fix: public/server key separation; correct API restrictions.

4. **Metadata fetch abuse / SSRF attempts**
- Symptom: link parsing stalls/security concerns.
- Fix: hostname/IP guardrails, protocol checks, size/timeout limits.

5. **Feed pagination duplicates or missing posts**
- Symptom: repeated/missing cards while paging.
- Fix: cursor ordering and display ordering must match.

6. **Visibility leakage for unlisted content**
- Symptom: unlisted appears on profile/feed to non-owners.
- Fix: enforce visibility filters in all list queries.

7. **AI draft path disabled or misconfigured**
- Symptom: `/create` hides AI path or AI route always returns fallback with `ai_disabled`.
- Fix: set `OPENAI_API_KEY`, `OPENAI_RESPONSES_MODEL`, `OPENAI_VECTOR_STORE_ID`, `ENABLE_AI_CREATE`, and `NEXT_PUBLIC_ENABLE_AI_CREATE`.

8. **Knowledge sync cannot upload docs**
- Symptom: `pnpm ai:sync-knowledge` fails before upload or while attaching files.
- Fix: confirm `OPENAI_API_KEY` and `OPENAI_VECTOR_STORE_ID`, verify the target vector store already exists, then rerun the sync.

---

## 13) Contributor Development Setup

## Prerequisites
- Node.js `22.x`
- pnpm `10.x`
- Docker Desktop (recommended local Postgres runtime)

## Recommended bootstrap (single command)
```bash
pnpm setup:contributor
```

This command is the canonical contributor onboarding path and must:
1. create `.env` and `.env.local` from `.env.example` when missing,
2. create `apps/mobile/.env` from `apps/mobile/.env.example` when missing,
3. start local Postgres (`docker compose up -d db`) when Docker is available,
4. install dependencies,
5. run Prisma generate + schema sync/migration path,
6. run seed.

## Run modes
```bash
pnpm dev        # web only
pnpm mobile:dev # mobile only
pnpm dev:all    # web + mobile
pnpm ai:sync-knowledge # upload curated planning docs into the configured OpenAI vector store
```

## Database helpers
```bash
pnpm db:up
pnpm db:down
pnpm db:logs
```

## Manual fallback setup
```bash
pnpm install
cp .env.example .env
cp .env.example .env.local
cp apps/mobile/.env.example apps/mobile/.env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

## Quality checks before PR
```bash
pnpm test
pnpm lint
pnpm build
```

## AI create local readiness
To exercise the live AI create path locally, contributors also need:

```bash
OPENAI_API_KEY=...
OPENAI_RESPONSES_MODEL=gpt-4.1-mini
OPENAI_VECTOR_STORE_ID=...
ENABLE_AI_CREATE=true
NEXT_PUBLIC_ENABLE_AI_CREATE=true
```

The following live checks are not complete until valid provider secrets are present:
- vector-store sync of `docs/ai-knowledge/*`
- real parse -> draft -> accept -> publish smoke test on `/create`

## Contributor rules
- Keep API response shapes explicit (`select`, not broad `include` for user objects).
- Never add scraping or authenticated social-content fetching.
- Maintain server-side handling for provider keys.
- Add tests for all business-logic changes.
- Update docs for any route/model/env change.

---

## 14) Work Breakdown for Contributors

## Epic A: Core Product Integrity
- A1: Auth hardening and username collision-safe allocation
- A2: Route-level authorization audit
- A3: Environment validation strategy by runtime

## Epic B: Social Quality
- B1: Feed ranking refinement + deterministic pagination
- B2: Comment/report moderation lifecycle improvements
- B3: Profile experience (saved/remixed filters, empty states)

## Epic C: Planner + Social Integration
- C1: Publish flow from trip builder polish
- C2: Remix attribution and analytics hooks
- C3: PDF template quality improvements

## Epic D: Reliability and Ops
- D1: Distributed rate limiter (Redis/Upstash)
- D2: Structured logging and error tracking
- D3: API performance instrumentation

---

## 15) Definition of Done (MVP)

A feature is done only when all are true:
1. Functional requirements implemented.
2. Authorization + visibility rules enforced.
3. Unit/integration tests added or updated.
4. `pnpm test` and `pnpm build` pass.
5. Docs updated (`README` and/or this PRD when scope changes).
6. No sensitive data leaked in API responses.

---

## 16) Roadmap Beyond MVP

- Follow graph and personalized feed ranking.
- Media upload/storage pipeline.
- Admin moderation dashboard.
- Event tracking and creator analytics.
- Native mobile clients.

---

## 17) Appendix: Suggested Issue Template

**Title:** `[EPIC-ID] Short action-oriented summary`  
**Problem:** What user or system problem this solves  
**Scope:** In/out bullets  
**Implementation notes:** Routes/services/models touched  
**Security/visibility impact:** Required checks  
**Test plan:** Unit + integration + manual checks  
**Acceptance criteria:** Concrete pass/fail bullets

---

This PRD should be updated whenever product behavior, data model, auth policy, or API contracts materially change.
