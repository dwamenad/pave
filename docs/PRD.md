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

---

## 2) Problem Statement

People see places in short-form content (Instagram, TikTok, YouTube, X) but struggle to convert that inspiration into a trip they can actually execute. Existing tools are either:
- great for **content discovery** but weak for planning, or
- great for **planning** but disconnected from social inspiration.

Pave bridges both.

---

## 3) Product Vision

Be the fastest path from “I saw this online” to “I have a workable plan I can use, share, and remix.”

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
- Trip builder CRUD and drag/drop-like reordering UX.
- Public trip share and group invite voting.
- Authenticated social feed and post publishing.
- Likes, saves, comments.
- Remix itinerary into a user-owned copy.
- Report and hide moderation baseline.
- Server-side PDF export.

## Out of scope (MVP)
- Native mobile apps.
- Full media upload pipeline (external URL only for post media).
- Realtime comments/chat.
- Advanced moderation console.
- Paid/social platform API partnerships requiring elevated scopes.

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

## 7.4 Social Posts and Feed
- Post must reference an existing trip.
- Post payload includes caption, optional media URL, visibility (`PUBLIC|UNLISTED`), tags, destination label.
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

---

## 10) UX Requirements by Route

- `/`: Planner-first landing + CTA to feed/create
- `/feed`: Public post list with engagement actions
- `/create`: Social links + preferences -> generate trip -> optional publish
- `/post/[postId]`: Post detail + source links + comments + report
- `/profile/[username]`: Author posts + saved posts (visibility-safe)
- `/trip/[slug]`: Builder + share + remix + export + vote
- `/place/[placeId]`: Nearby place hub + create/share CTA
- `/nearby`: No-login quick picks

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

---

## 12) Known Failure Modes and Fix Playbook

1. **Missing env variables (`DATABASE_URL`, Google keys, OAuth secrets)**
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

---

## 13) Contributor Development Setup

## Local setup
```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name <migration_name>
pnpm prisma:seed
pnpm dev
```

## Quality checks before PR
```bash
pnpm test
pnpm build
```

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
