# Release Notes

## v0.2.1 - Theme Support and Dark Mode Gallery

Tagged on March 11, 2026.

This patch release packages the first intentional theming pass for the web app and the supporting docs needed to keep that work from regressing.

### Shipped
- added real light and dark mode support through `next-themes`
- stopped hard-locking the app shell to light mode
- introduced semantic theme tokens for shared shell and UI primitives
- polished the main high-traffic surfaces in both themes:
  - `/create`
  - `/feed`
  - `/post/[postId]`
  - `/nearby`
  - `/profile/[username]`
  - `/trip/[slug]`
  - `/place/[placeId]`
- added a theme preference note to contributor docs
- added live dark-mode screenshots for feed, post detail, and profile to the README
- added a reusable theme QA checklist for future UI verification

### Verification
- `pnpm lint` passed
- `pnpm build` passed
- browser smoke checks passed in both themes for `/create` and `/nearby`
- dark-mode screenshots were captured from the seeded local app for:
  - `/feed`
  - `/post/[postId]`
  - `/profile/[username]`

### Tags
- `theme-polish-v1`
- `v0.2.1`

## v0.2.0 - Pre-API Hardening Baseline

Tagged on March 11, 2026.

This milestone packages the repo state after the pre-API optimization pass. The goal was to make Pave more reliable before layering in additional external APIs.

### Shipped
- introduced a shared place-service boundary between app code and provider adapters
- added explicit provider reason codes and a local-only mock places provider
- upgraded cache handling to expose hit/stale/miss metadata and support stale-if-error behavior
- refactored create flow UX around clearer step states, degraded modes, and machine-readable error handling
- improved nearby discovery handling for degraded, stale, mock, and empty-result states
- expanded event coverage for the create/publish/invite funnel
- expanded seed data into a believable demo network with users, trips, posts, saves, follows, comments, and remixes
- added smoke-tested screenshots to the README and contributor docs
- documented the Docker-backed local database flow for contributors

### Verification
- database booted successfully through Docker
- Prisma schema synced successfully against local Postgres
- seed completed successfully with 4 users, 12 trips, and 12 published posts
- browser smoke checks passed for `/feed`, `/profile/alexrivero`, `/trip/lisbon-food-club`, `/create`, and `/nearby`

### Tags
- `preapi-hardening-v1`
- `v0.2.0`
