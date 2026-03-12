# Release Notes

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
