# Auth Troubleshooting

This page is the fastest way to debug local sign-in issues for contributors working on Pave.

## What auth exists today
Pave does **not** use email/password auth.

Current auth methods:
- web: Google OAuth via NextAuth
- mobile: native Google sign-in, then backend-issued access and refresh tokens

## Quick diagnosis order
Work in this order:
1. confirm the database is up
2. confirm `/api/health` is healthy for web auth
3. confirm Google OAuth env values are present
4. confirm Google client configuration matches local URLs / app identifiers
5. only then debug route-specific behavior

## 1. Check the health route
Run:

```bash
curl http://localhost:3000/api/health
```

For web auth, this should show:

```json
"auth": { "ready": true }
```

If `auth.ready` is `false`, web sign-in will not work yet.

## 2. Common web auth failures

### Symptom: Google sign-in button appears, but sign-in fails immediately
Check:
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`

Expected local values:

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_with_32_plus_char_random_string"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
```

### Symptom: Google says redirect URI mismatch
Your Google Cloud **Web application** OAuth client is missing one of:

- Authorized JavaScript origins:

```text
http://localhost:3000
```

- Authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
```

### Symptom: sign-in succeeds at Google but Pave still behaves like you are signed out
Check:
- cookies are allowed in the browser
- you are actually using `http://localhost:3000`
- the database is reachable
- the user row exists in the database

## 3. Common mobile auth failures

### Symptom: `Continue with Google` is disabled
Check `apps/mobile/.env`:

```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

If those are blank, the sign-in screen disables Google auth.

### Symptom: mobile sign-in opens Google but backend rejects it
This is usually one of:
- `GOOGLE_IOS_CLIENT_ID` missing on the server
- `GOOGLE_ANDROID_CLIENT_ID` missing on the server
- Expo public Google client IDs do not match the server-side expected IDs
- Google token audience mismatch

Set these in `.env.local`:

```bash
GOOGLE_IOS_CLIENT_ID="your_ios_google_client_id"
GOOGLE_ANDROID_CLIENT_ID="your_android_google_client_id"
MOBILE_AUTH_JWT_SECRET="replace_with_mobile_jwt_secret"
```

Set these in `apps/mobile/.env`:

```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="your_ios_google_client_id"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="your_android_google_client_id"
```

These pairs must match:
- `GOOGLE_IOS_CLIENT_ID` <-> `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `GOOGLE_ANDROID_CLIENT_ID` <-> `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### Symptom: sign-in works once, then later requests fail with 401
Usually one of:
- access token expired
- refresh token invalid or expired
- mobile session revoked
- `MOBILE_AUTH_JWT_SECRET` changed locally between runs

If you changed auth secrets, sign in again from scratch.

## 4. App identifier mismatch
Pave currently expects:
- iOS bundle: `app.pave.mobile`
- Android package: `app.pave.mobile`

If the Google mobile OAuth clients were created for different app identifiers, mobile auth will fail even if the client IDs exist.

## 5. Database-related auth failures
If auth looks configured but nothing persists correctly:

Check:
- Docker is running
- Postgres is up
- `DATABASE_URL` is correct
- Prisma client is generated
- migrations have run

Useful commands:

```bash
pnpm db:up
pnpm prisma:seed
pnpm dev
```

## 6. Fast recovery path
If a contributor is stuck, the fastest reset is:

1. confirm Node `22.x`
2. run `pnpm setup:contributor`
3. re-check `.env.local`
4. re-check `apps/mobile/.env`
5. verify `/api/health`
6. retry Google sign-in

## 7. What counts as a successful auth smoke test

Web:
1. sign in with Google
2. save or like a post
3. create a comment, publish a post, or export a trip

Mobile:
1. sign in with Google
2. load the feed
3. open a signed-in surface without 401 failures

If those work, auth is operational enough for normal contributor development.
