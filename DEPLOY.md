# AniPins release and deployment runbook

## Verified topology (2026-10-17)

- Website and API: Next.js app in the Docker image, served by the Cloudflare Worker Container configured in `wrangler.jsonc` (`cloudflare/worker.mjs`).
- Production edge target: Worker script `anipins-staging`; Cloudflare routes `anipins.com/*` and `www.anipins.com/*` to it. Despite its name, deploying this config changes production.
- Media: Cloudflare R2 bindings `ARTWORKS_PUBLIC` and `ARTWORKS_PREMIUM` use `anipins-public-media` and `anipins-premium-media`.
- Database: Supabase PostgreSQL. Production project ref `synqmyiwjyvvrbrhcetw`; separate project `keqdwpsjygigdsatzjdb` exists for staging. Production schema inspection found `billing_subscriptions.provider_event_at` and `media_cleanup_queue` are not present yet.
- Android: native WebView project in `mobile/`; build a signed AAB locally. Never upload from this process to Play.

## Release commands and checks

Use Node 22. From the repo root:

```powershell
npm ci
npx tsc --noEmit --incremental false
npx --yes --package=node@22 node --test
npx --yes --package=node@22 node node_modules/next/dist/bin/next build
./mobile/build-play-release.ps1
```

There is no standalone `lint` npm script. The Next production build performs lint and type validation. The Android script builds and verifies the signed AAB (and a local APK); neither artifact is committed.

## Environment variable names

Set values only in the relevant provider secret store; never commit or print secret values.

| Variables | Use |
|---|---|
| `DATABASE_URL`, `DATABASE_CA_CERT` | PostgreSQL connection and optional CA trust |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin API integration |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` | Session and canonical site configuration |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` | Google sign-in |
| `ADMIN_PASSWORD`, `ADMIN_2FA_ENCRYPTION_KEY`, `SETUP_SECRET`, `SETUP_TOKEN` | Admin access and protected setup |
| `MEDIA_PROVIDER`, `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET`, `R2_PREMIUM_BUCKET` | R2 configuration where direct S3-compatible access is used |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PREMIUM_PLAN_ID_199`, `RAZORPAY_WEBHOOK_SECRET` | Billing; staging must use test credentials only |
| `RESEND_API_KEY`, `EMAIL_FROM`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SITE_VERIFICATION`, `ANDROID_APP_LINKS_SHA256` | Optional email, Firebase, search verification, and Android links |
| `ANIPINS_KEYSTORE_PATH`, `ANIPINS_KEYSTORE_PASSWORD`, `ANIPINS_KEY_ALIAS`, `ANIPINS_KEY_PASSWORD` | Local Android release signing only |

Cloudflare Worker also requires its configured `ARTWORKS_PUBLIC` and `ARTWORKS_PREMIUM` R2 bindings. Confirm environment-specific bindings before publishing.

## Database migration order and backup

1. Before any production DDL, create and verify a recoverable Supabase backup/snapshot and record its restore point. A schema listing or SQL copy is not a backup.
2. Apply numbered SQL files in `scripts/migrations/` in ascending filename order. The schema changes accompanying this release are additive/idempotent: create `media_cleanup_queue`, add `billing_subscriptions.provider_event_at`, and restrict direct `anon`/`authenticated` access to server-only tables. Do not run the application setup endpoint as a substitute for a reviewed migration.
3. Confirm the expected columns/table and RLS/grants after migration, then deploy code. Roll back application code first if smoke tests fail; additive schema may remain in place. Do not drop the added table/column as part of rollback.

## Deployment procedure

The current Wrangler config is production-routed. From a clean, pushed commit, inspect the account and preview the bundle before deployment:

```powershell
npx wrangler whoami
npx wrangler deploy --dry-run
npx wrangler deploy
```

Use only the authorized commit. Do not change DNS, rotate secrets, alter billing settings, delete data/storage, enable paid services, or upload an Android artifact to Google Play without separate approval. If backup verification, provider access, or test-account credentials are unavailable, stop before the affected production action and report the exact blocker.

## Smoke tests and rollback

Using a test account only and no real payments, verify: home page; browse/paginate/refresh; open artwork and image loading; sign-in and sign-out; like/save and download; premium entitlement check; admin upload with a test admin. Check HTTP status, browser console, Worker/container logs, and DB errors. Do not claim sign-in/like/premium passed based on public HTTP checks alone.

If a smoke test fails, roll back the Worker to the previously serving Cloudflare version through Cloudflare's version rollback/traffic controls, then retest the known-good version. Keep additive DB schema in place unless a separately reviewed recovery is needed. Never roll back by deleting user data or media.

## Release artifact status

The signed Android AAB is a local artifact at `mobile/app/build/outputs/bundle/release/app-release.aab`. Keep the keystore/password out of source control. The AAB is not uploaded to Google Play by this deployment.
