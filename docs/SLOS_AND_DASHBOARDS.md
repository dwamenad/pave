# Pave SLOs and Dashboard Baseline

## Service Level Objectives (Phase 0)

- Feed APIs (`/api/feed`, `/api/feed/for-you`, `/api/feed/following`)
  - Availability: 99.9% rolling 30 days
  - Latency: p95 < 500ms
  - Error budget trigger: 5xx > 1% over 15 minutes

- Post Detail API (`/api/posts/[postId]`)
  - Availability: 99.9% rolling 30 days
  - Latency: p95 < 500ms
  - Error budget trigger: 5xx > 1% over 15 minutes

- Create/Publish APIs (`/api/trips`, `/api/posts`)
  - Availability: 99.5% rolling 30 days
  - Latency: p95 < 800ms
  - Error budget trigger: 5xx > 1% over 15 minutes

## Golden Signals Dashboards

Track the following by endpoint group and environment:

- Latency: p50 / p95 / p99
- Traffic: requests per minute
- Errors: 4xx and 5xx split, plus top error signatures
- Saturation: DB connection usage, query queue depth, memory, CPU

## Runtime Readiness Route

`GET /api/health` is the repo-level readiness probe.

Track:
- response status (`200` healthy baseline, `503` degraded)
- database readiness
- auth readiness
- maps readiness
- AI create readiness
- mobile telemetry readiness
- rate-limit mode (`local` vs `upstash`)

## Event Coverage Gate

Event ingestion (`/api/events/batch`) and server-side event hooks should cover:

- `view_feed`
- `view_post`
- `start_create_flow`
- `complete_parse_social`
- `save_post`
- `remix_trip`
- `publish_post`
- `share_trip`
- `comment_post`
- `follow_user`
- `complete_trip_create`
- `invite_collaborator`
- `web_runtime_error`
- `server_exception`

## Operational Alerts

- Feed p95 latency > 700ms for 10 minutes
- Feed/Post 5xx rate > 1% for 15 minutes
- `/api/health` returning `503` for 5 minutes
- Event batch failure rate > 2% for 15 minutes
- Rate limiter failures (Upstash path errors) > 5% for 15 minutes
- Repeated `server_exception` spikes on `/api/social/parse`, `/api/ai/trips/draft`, or `/api/trips/[tripId]/export/pdf`
