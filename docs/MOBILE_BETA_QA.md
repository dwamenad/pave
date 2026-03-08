# Mobile Beta QA Checklist

## Preflight
- `.env.local` has `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, and mobile auth secrets.
- `apps/mobile/.env` has API base URL, Expo public Google client IDs, and `EXPO_PUBLIC_SENTRY_DSN`.
- Backend is running (`pnpm dev`) and mobile app is running (`pnpm mobile:dev` or `pnpm dev:all`).

## Auth and Session
- Native Google sign-in completes and lands on Feed tab.
- App restart keeps session and returns to Feed without re-login.
- Sign out clears session and redirects to sign-in.
- Expired access token path refreshes automatically and continues request.

## Core Social Loop
- Feed loads For You / Following / Trending with pagination.
- Like and Save work from feed and update counts immediately.
- Opening a post shows details and comments.
- Comment creation works and appears in post detail list.
- Remix from post creates a new trip and opens trip screen.
- Create tab can parse caption/links, build trip, and publish post.
- Profile tab loads current user and switches between posts/saved.

## Deep Links and Navigation
- Opening `pave://post/<postId>` navigates to post detail.
- Opening `pave://trip/<slug>` navigates to trip detail.
- Opening `pave://profile/<username>` navigates to profile.
- Back navigation behaves naturally on iOS and Android.

## Nearby and Device Location
- First launch shows usable nearby results even before location permission is granted.
- Accepting location permission refreshes nearby results from the real device position.
- Denying location permission keeps fallback results visible with clear copy.
- Tapping the location button while granted refreshes the live nearby set without a broken state.

## Trip Export
- Export PDF on trip mobile screen downloads a real PDF file and opens the native share sheet.
- Export still succeeds after an expired access token refresh.

## Resilience and Errors
- Simulate offline mode and verify graceful error states with retry actions.
- 401/429/5xx responses show user-readable error UI and recover after retry.
- No screen should remain in an infinite loading state after request failure.
- Trigger one controlled mobile error in preview and confirm it appears in Sentry with route and signed-in tags.
