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

Required in `apps/mobile/.env` for native mobile app auth:
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_SENTRY_DSN` (optional locally, required for beta crash telemetry)

Required for Sentry release/source map upload during preview and production builds:
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_URL` (optional, defaults to `https://sentry.io/`)

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

## Location and Nearby
- Nearby mobile screens start with a Times Square fallback until foreground location access is granted.
- Expo config now includes an `expo-location` permission string. If you change the nearby experience, keep the copy aligned with actual usage.
- Denied location permission must keep the app usable with fallback nearby results instead of blocking the screen.

## Telemetry
- Mobile crash and runtime error telemetry is wired through `@sentry/react-native`.
- Set `EXPO_PUBLIC_SENTRY_DSN` in `apps/mobile/.env` for preview/TestFlight builds.
- Build-time source map upload uses the Expo Sentry plugin in `apps/mobile/app.config.ts`.
- For local export/build verification, copy `apps/mobile/.env.sentry-build-plugin.example` to `apps/mobile/.env.sentry-build-plugin` and fill in your Sentry values.
- In EAS, set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` as build environment variables for `preview` and `production`.

## CI / Build
- Main CI runs web checks and mobile typecheck.
- EAS profiles live in `apps/mobile/eas.json`:
  - `development`
  - `preview` (beta channel)
  - `production`
- Use preview channel builds for TestFlight closed-beta verification.

## Operational Notes
- Revoke refresh tokens on logout.
- Access tokens are statelessly verified and also session-validated against DB (`jti`, version, revocation, expiry).
- Device records are user-scoped and installation-scoped.
- Web APIs now accept either NextAuth cookies (web) or mobile bearer tokens for shared endpoint reuse.

## QA Checklist
- Mobile beta checklist lives in `docs/MOBILE_BETA_QA.md`.
