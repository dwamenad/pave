# Pave Redesign Rollout Checklist

This document tracks release readiness for the multi-page UI redesign while preserving existing API contracts and global shell behavior.

## Included Route Slices
- `/feed`: high-fidelity card/grid/sidebar polish with load-more resilience and feed render performance refinements.
- `/post/[postId]`: timeline narrative with sticky action rail, save/share/report/comment parity.
- `/nearby`: map-hero layout, category quick actions, location error handling.
- `/profile/[username]`: richer profile hero, stat tiles, sticky tabs (`?tab=posts|saved`).
- `/trip/[slug]`: upgraded planner workspace and social action rails.
- `/`: explore-first entry route (no redirect), social parse and discovery-first onboarding.
- `/create`: aligned creation funnel from explore to publish.

## Release Sequence (Commit Slices)
1. `b2e7105` post detail redesign.
2. `cbcf168` nearby redesign.
3. `5b94c8a` profile redesign.
4. `3ce5a4c` trip builder/social action redesign.
5. `4ea4bf4` explore-first landing + create funnel alignment.
6. `b022ff7` analytics taxonomy hardening + event coverage tests.
7. `4d99149` feed performance pass.
8. Release docs/checklist (this commit).

## Manual QA Checklist
- Feed:
  - source tabs (`FOR_YOU`, `FOLLOWING`, `TRENDING`) return expected data.
  - load more appends without duplicate cards and hides at end.
  - save/like/remix flows still call existing endpoints.
- Post detail:
  - add comment works and refreshes thread.
  - report submits without breaking page state.
  - save toggle updates count and state.
  - source chips open links in a new tab.
- Nearby:
  - granted geolocation renders nearby cards.
  - denied geolocation shows actionable fallback state.
  - quick category switches (`eat/coffee/do`) keep UI stable.
- Profile:
  - `?tab=posts` and `?tab=saved` are linkable and server-rendered.
  - follow button behavior remains unchanged for non-self profiles.
- Trip:
  - add/move/reorder/remove itinerary items still function.
  - share link generation, remix, publish, export PDF still function.
  - group voting still requires invite token.
- Create + landing:
  - `/` renders explore flow first (no redirect).
  - parse social hints and suggestion selection still works.
  - create itinerary and publish post still work.

## Monitoring Checklist (First 24-48 Hours)
- API health:
  - feed endpoints latency and 5xx rate.
  - post detail, comments, save, remix, publish endpoints.
- Event stream integrity:
  - `view_feed`, `view_post`, `save_post`, `comment_post`, `follow_user`, `publish_post`, `remix_trip`, `share_trip`.
  - no unexpected event-name growth (taxonomy guard in `/api/events/batch`).
- Frontend stability:
  - client errors on load-more and nearby geolocation states.
  - hydration/console errors on redesigned pages.

## Rollback Strategy
- Revert by route slice commit if regression is isolated.
- Prefer reverting latest affected UI slice rather than rolling back data contracts.
- Keep analytics taxonomy changes unless they directly block ingestion.

