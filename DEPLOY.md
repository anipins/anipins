# AniPins deployment and Better Auth/D1 migration

## Current verified topology

- Website/API: Next.js in a Cloudflare Container, fronted by `cloudflare/worker.mjs`.
- `wrangler.jsonc` names the Worker `anipins-staging`, but the deployed Worker is production-routed (including `anipins.com` / `www.anipins.com`) and binds the existing production R2 buckets `anipins-public-media` and `anipins-premium-media`. Do not deploy this config as staging.
- Production structured data and current website authentication still use Supabase PostgreSQL/custom sessions. The migration target is Better Auth + Cloudflare D1 + existing Cloudflare R2 + Workers.
- Isolated Better Auth staging Worker: `anipins-better-auth-staging`, at `https://anipins-better-auth-staging.anipins01.workers.dev`; it binds only staging D1. It is not the website Worker and does not by itself switch app login/data.
- Staging D1: `anipins-staging-db` (`47006a2e-45b1-42e4-9f89-5ce8329a44bf`). Migrations `0001`–`0004` are applied. Public artwork metadata was copied; image bytes were not copied.
- Android: native WebView project under `mobile/`. Build a signed AAB locally; do not upload it to Google Play.

## Release gate and required environment names

Use Node 22 (the project supports Node >=20 and <23). Run from repository root:

```powershell
npm ci
npm run build
node --test tests/*.test.cjs
npx wrangler deploy --dry-run --config wrangler.better-auth-staging.jsonc
```

The full test suite must pass before a release. The current signed `AniPins-2.5.21.apk` is checked in under `public/downloads/`, included in the app image, and served locally by the download route so the current release does not require Supabase storage. Verify the APK signature and package/version metadata before changing it. On this machine the local runtime is Node 24, outside the project's supported range; use the Node 22 Docker validation image or a Node 22 installation for the full test suite.

Required secret/variable names (values belong only in Cloudflare secrets or the private Container environment; never commit values):

- Better Auth on the app's isolated staging Worker: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- Worker-to-Container D1 bridge: `D1_RPC_URL`, `D1_RPC_SECRET` (same secret at Worker and Container). The secret must be at least 32 characters.
- Google staging OAuth if Google sign-in is part of the smoke test: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- App staging URL/cookie configuration: `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`.
- Existing production environment still includes Supabase/Postgres and payment/media credentials. Do not copy production values into staging; staging payments must be disabled or use test-only credentials.

## Staging deployment prerequisites

A safe app staging environment is not provisioned yet. The existing production-routed app Worker config binds production R2, and the Cloudflare account currently has no separate staging media bucket. Do not deploy the main app Worker until there is a separate app Worker/Container environment with a non-production media bucket and staging-only secrets. Container provisioning or additional R2 use may incur charges; obtain separate owner approval before enabling paid capacity or copying media.

After that isolated environment is prepared, follow this order:

1. Build and test using the release gate above.
2. Confirm the target Worker config lists only the staging D1, staging R2, and staging Container bindings. Never use the production-routed `wrangler.jsonc` as the target.
3. Configure the staging secret names listed above using `npx wrangler secret put <NAME> --config <STAGING_CONFIG>` interactively; never place values in command arguments or source files.
4. Check `npx wrangler d1 migrations list anipins-staging-db --remote --config <STAGING_CONFIG>`. If migrations are pending, apply `migrations/d1/0001_initial_anipins_schema.sql` through `0004_better_auth_business_user_link.sql` in ascending order using Wrangler D1 migrations. Take a D1 export before future schema changes.
5. Run `npx wrangler deploy --dry-run --config <STAGING_CONFIG>`, inspect bindings, then deploy only the isolated staging config after confirming it has no production routes, R2, secrets, or payment keys.
6. Smoke test using staging-only accounts: email sign-up/sign-in, Google if configured, session lookup, user/admin role checks, sign-out, home/feed/pagination, open artwork/image, like/save/download, Premium entitlement (no payment), and a test-admin upload.
7. Record the exact commit, Worker version, migration list, tests, smoke results, and rollback target. Stop before production.

The separate auth Worker can be redeployed independently with `npx wrangler deploy --config wrangler.better-auth-staging.jsonc`; it has no Container or R2 binding. Its host-only cookie does not authenticate a different app hostname, so test the final flow on the app's own staging origin.

## Production deployment gate

Do not deploy to production, change DNS/routes, enable paid services, change payment/subscription settings, delete data/storage, or upload to Google Play without the relevant separate explicit approval. Production cutover requires all of the following first:

- Staging smoke tests pass for the full auth/data/media paths.
- All source tables, IDs, foreign keys, user/session mappings, subscription history, security records, and row-count/checksum parity are reconciled.
- A recoverable production database export/backup and a tested restore/rollback procedure exist. If Supabase cannot provide a backup, produce and verify an independent export before switching.
- Review the source finding that `public.billing_subscriptions` has RLS disabled; do not change RLS until service policies are reviewed.
- Keep existing authentication/data available for rollback until cutover verification completes; revoke legacy sessions only at the approved cutover.
- User gives the required exact approval: `APPROVED: deploy <commit hash> to production`.

Production deployment must target only that approved commit. Apply only reviewed additive/reversible migrations after confirming backup availability, then smoke test with a test account and no real payments. On failure, roll back the Worker to the recorded prior version; do not delete data or objects.

## Component rollback

- Auth/app Worker: restore the recorded previous Cloudflare Worker version. Keep old auth enabled until cutover is verified.
- D1: migrations are additive; do not drop schema to roll back app code. Restore from a verified D1 export only under an approved recovery procedure.
- R2: leave all production object keys and objects untouched; no bulk copy/delete in a rollback.
- Android: keep the signed AAB local and unchanged; upload only through the owner's Play Console process.

## Current status

Latest isolated Better Auth staging Worker deploy: `d45c0bfd-1a70-49a0-9729-f2069ccebc9f` (`anipins-better-auth-staging`); `/__staging/auth/ok` returned HTTP 200 and unauthenticated `/__staging/identity` returned HTTP 401. This is not the website/app Worker.

Build: PASS in the Node 22 Docker build. Node 22 full suite: 191/191 PASS (including opt-in Better Auth browser-flow, sign-out, and fail-closed admin-2FA checks); `npx tsc --noEmit`: PASS; production build: PASS. Current Android APK signature and package/version verified; local app-image download smoke test returns HTTP 200 without Supabase configuration. Wrangler dry runs: previously PASS. Isolated Better Auth staging Worker: deployed and smoke-tested. App identity bridge and opt-in web/Android WebView login/logout integration: implemented locally, not deployed or remotely tested. Legacy multi-account session switching and admin second-factor migration are not yet ported; admins with legacy TOTP are now rejected by the staging bridge until that challenge is migrated. Production app, database, auth, storage, DNS, and billing: unchanged. Deployment is not ready because source/destination parity, account-flow coverage, admin second-factor migration, and a cost-safe isolated app staging environment remain unverified.
