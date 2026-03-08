# Mobile Infrastructure Runbook

## Scope
This document covers the base mobile infrastructure for Pave:
- Expo + React Native app scaffold (`apps/mobile`)
- Native Google sign-in token bridge (`/api/mobile/auth/*`)
- Bearer access + refresh token flow
- Device registration endpoint (`/api/mobile/devices/*`)

This phase intentionally does not implement full feature parity with web.

## Repository Layout
- `apps/mobile`: Expo mobile app
- `packages/contracts`: shared request/response DTOs
- `app/api/mobile/*`: mobile backend endpoints
- `lib/server/mobile-*`: auth, verification, and middleware helpers

## Environment Variables
Required for mobile auth bridge:
- `GOOGLE_IOS_CLIENT_ID`
- `GOOGLE_ANDROID_CLIENT_ID`
- `MOBILE_AUTH_JWT_SECRET` (falls back to `NEXTAUTH_SECRET` if omitted)
- `MOBILE_ACCESS_TOKEN_TTL_MINUTES` (default `15`)
- `MOBILE_REFRESH_TOKEN_TTL_DAYS` (default `30`)

## Local Development
From repo root:

```bash
pnpm setup:contributor
```

In a second terminal:

```bash
pnpm dev:all
```

## Native Auth Flow
1. Mobile obtains Google ID token via native SDK.
2. Mobile calls `POST /api/mobile/auth/google`.
3. Backend verifies token with Google tokeninfo and audience check.
4. Backend issues:
   - short-lived access token (JWT)
   - rotating refresh token (hashed at rest)
5. Mobile stores both tokens in Secure Store.
6. Mobile uses bearer access token on protected mobile endpoints.
7. On 401, mobile calls `POST /api/mobile/auth/refresh` and retries once.

## Device Token Capture
Use `POST /api/mobile/devices/register` with:
- `installationId`
- `platform`
- optional `pushToken`, `appVersion`, `deviceName`

Use `DELETE /api/mobile/devices/:deviceId` to unregister.

## Deep Links
Association files are in `public/.well-known`:
- `apple-app-site-association`
- `assetlinks.json`

Replace placeholders before production:
- iOS Team ID
- Android release SHA-256 cert fingerprint

## CI / Build
- Main CI runs web checks and mobile typecheck.
- EAS profiles live in `apps/mobile/eas.json`:
  - `development`
  - `preview`
  - `production`

## Operational Notes
- Revoke refresh tokens on logout.
- Access tokens are statelessly verified and also session-validated against DB (`jti`, version, revocation, expiry).
- Device records are user-scoped and installation-scoped.
