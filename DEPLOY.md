# AniPins deployment and Better Auth/D1 migration

## Current verified topology

- Website/API: Next.js in a Cloudflare Container, fronted by `cloudflare/worker.mjs`.
- `wrangler.jsonc` names the Worker `anipins-staging`, but the deployed Worker is production-routed (including `anipins.com` / `www.anipins.com`) and binds the existing production R2 buckets `anipins-public-media` and `anipins-premium-media`. Do not deploy this config as staging.
- The production-routed Worker still serves the legacy website/auth path. The migration target is Better Auth + Cloudflare D1 + existing Cloudflare R2 + Workers.
- Isolated Better Auth staging Worker: `anipins-better-auth-staging`, at `https://anipins-better-auth-staging.anipins01.workers.dev`; it binds only staging D1. It is not the website Worker and does not by itself switch app login/data.
- Isolated app migration staging: `anipins-migration-staging` at `https://anipins-migration-staging.anipins01.workers.dev`, using `anipins-staging-db` and two dedicated staging R2 buckets. Published artwork object keys were mirrored from production R2 to staging R2 without changing production objects. Migrations `0001`–`0004` are applied. Staging uses the `basic` Container class after the `lite` class failed to start reliably; production must be cost-monitored after cutover.
- Production D1 preparation target: `anipins-production-db` (`5f1923c8-e706-4894-90e7-2d378333a65a`). Migrations `0001`–`0004` are applied using the migration-only config `wrangler.d1-production.jsonc` (no Worker entrypoint, routes, R2, or Container). All 20 source business tables were copied from Supabase without modifying the source; the 11 users, 20 legacy sessions, 1,877 artworks, 6 settings, 6 billing records, 9 Google identities, audit/security, and activity records are present. Better Auth has 11 linked users, 11 credential accounts, and 9 Google accounts. Artwork objects and R2 keys were not copied or changed.
- Android: native WebView project under `mobile/`. Build a signed AAB locally; do not upload it to Google Play.

## Release gate and required environment names

Use Node 22 (the project supports Node >=20 and <23). Run from repository root:

```powershell
npm ci
npm run build
node --test tests/*.test.cjs
npx wrangler deploy --dry-run --config wrangler.better-auth-staging.jsonc
```

The full test suite must pass before a release. The current signed `AniPins-2.5.21.apk` is checked in under `public/downloads/`, included in the app image, and served locally by the download route so the current release does not require Supabase storage. Verify the APK signature and package/version metadata before changing it. On 2026-10-18 the full suite passed 201/201 using Node 22.23.3; the production build, including lint and TypeScript validation, also passed with Node 22. The default machine runtime remains Node 24, outside the project's supported range.

Required secret/variable names (values belong only in Cloudflare secrets or the private Container environment; never commit values):

- Better Auth on the app's isolated staging Worker: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- Worker-to-Container D1 bridge: `D1_RPC_URL`, `D1_RPC_SECRET` (same secret at Worker and Container). The secret must be at least 32 characters.
- Google staging OAuth if Google sign-in is part of the smoke test: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- App staging URL/cookie configuration: `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`.
- Existing production environment still includes Supabase/Postgres and payment/media credentials. Do not copy production values into staging; staging payments must be disabled or use test-only credentials.

## Staging status

The isolated app staging Worker is deployed from `wrangler.migration-staging.jsonc` (current version `c269578e-6045-4bdd-9519-7f861cd1b652`, candidate commit `212a43e43434b3cad84d35824a6a5abb1d242c09`). It has no production routes, production D1, production R2, or payment credentials. The staging Better Auth endpoint is `/__staging/auth`; this is separate from the production `/api/better-auth` namespace.

Verified against staging: email sign-up and session lookup, Google sign-in (owner-confirmed), public artwork browsing/detail, authenticated like/unlike, sign-out, anonymous Premium denial, and anonymous admin denial. The owner account `anipins01@gmail.com` was explicitly promoted to `ADMIN` in staging only; `/admin` loads and shows the admin dashboard. On 2026-10-18, the owner completed a real authenticated admin upload: artwork `1895` (`cain von silford`, anime `dEMON`) was recorded as published in staging D1, the admin audit log records `ARTWORK_UPLOAD`, the original and thumbnail both returned HTTP 200 from staging, and `/` plus `/api/artworks/1895` returned HTTP 200. Pagination passed: two consecutive 20-item latest-feed pages returned 20 items each, `hasMore=true`, and no duplicate IDs; anonymous Premium feed correctly returned HTTP 403. Five recent public artworks returned HTTP 200 for both original and thumbnail URLs, and a 32-key sample across public/Premium records also returned HTTP 200. Premium-entitled access was not tested because the staging admin has no Premium entitlement; no billing state was fabricated. Staging media was copied from production R2 read-only, so staging storage usage is now materially higher and should be checked against the account's included allowance.

Run `npx wrangler deploy --dry-run --config wrangler.migration-staging.jsonc` before staging updates. Never use the production-routed `wrangler.jsonc` for staging. Configure secrets interactively with Wrangler or in Cloudflare's Secret UI; never place secret values in command arguments or source files.

Admin console additions deployed to staging (2026-10-18): user role control (USER/ADMIN, guarded against self-demotion and removal of the last admin), read-only subscription/payment history, report review/status updates, and in-app announcement composition/delivery. The existing content-management screens remain available. Notifications are in-app only (no email/push sender is configured). D1 migrations `0005_admin_announcements.sql` and `0006_billing_transactions.sql` are additive and applied to staging only. The transaction ledger records verified Razorpay payment webhook events from the date this code is deployed; it does not backfill historical events, and staging has no live payment credentials/webhook configured. Unauthenticated requests to each `/api/admin/{users,payments,reports,notifications}` endpoint return HTTP 403; the owner should visually confirm the pages while signed in before production planning.

The separate auth Worker can be redeployed independently with `npx wrangler deploy --config wrangler.better-auth-staging.jsonc`; it has no Container or R2 binding. Its host-only cookie does not authenticate a different app hostname, so test the final flow on the app's own staging origin.

## Production deployment gate

The owner has authorized production work, but the live Worker cutover has not been exercised. Production cutover still requires all of the following first:

- Staging smoke tests pass for the full auth/data/media paths, including Google sign-in and admin upload.
- All source tables, IDs, foreign keys, user/session mappings, subscription history, security records, and row-count/checksum parity are reconciled.
- A recoverable production database export/backup and a tested restore/rollback procedure exist. The 2026-10-18 D1 export was successfully restored into a disposable Cloudflare D1 database; key counts matched (`users` 11, `artworks` 1,877, `billing_subscriptions` 6, Better Auth users 11/accounts 20/sessions 0/user links 11). The temporary restore database was deleted after validation. Full content-level parity is still open.
- Production Google OAuth and payment-provider secrets are present and tested. Current production Worker secret inventory is missing `GOOGLE_CLIENT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
- Review the source finding that `public.billing_subscriptions` has RLS disabled; do not change RLS until service policies are reviewed.
- Keep existing authentication/data available for rollback until cutover verification completes; revoke legacy sessions only at the approved cutover.
- The exact production commit and D1 export/restore evidence are recorded.

Production deployment must target only that approved commit. Apply only reviewed additive/reversible migrations after confirming backup availability, then smoke test with a test account and no real payments. On failure, roll back the Worker to the recorded prior version; do not delete data or objects.

## Component rollback

- Auth/app Worker: restore the recorded previous Cloudflare Worker version. Keep old auth enabled until cutover is verified.
- D1: migrations are additive; do not drop schema to roll back app code. Restore from a verified D1 export only under an approved recovery procedure.
- R2: leave all production object keys and objects untouched; no bulk copy/delete in a rollback.
- Android: keep the signed AAB local and unchanged; upload only through the owner's Play Console process.

## Current status

App migration staging deploy `anipins-migration-staging`, Worker version `c269578e-6045-4bdd-9519-7f861cd1b652` from candidate commit `212a43e43434b3cad84d35824a6a5abb1d242c09`, is active on its `workers.dev` URL only. The `__Secure-` cookie handoff regression is fixed. Staging email auth passed signup, authenticated session lookup, artwork browse/detail, image fetch, like/unlike, and sign-out; Google sign-in was confirmed successful by the owner. The owner account `anipins01@gmail.com` has staging role `ADMIN`, and the `/admin` dashboard was verified. The owner completed an authenticated admin upload of staging artwork `1895`; its D1 record is published, the audit event is present, and the original and thumbnail both returned HTTP 200. Home and artwork detail API also returned HTTP 200. Pagination passed (two 20-item pages, no duplicate IDs); anonymous Premium access correctly returned HTTP 403. Sampled staging media URLs passed (five recent public artworks: original and thumbnail; 32-key sample across public and Premium media). Premium-entitled access remains unverified; no billing state was fabricated. On the candidate redeploy, home, artwork feed, and Better Auth session endpoint returned HTTP 200; unauthenticated requests to all four admin APIs returned HTTP 403. Razorpay transaction extraction/idempotency tests pass; actual provider webhook delivery is not configured or tested in staging, and no historical transactions were backfilled. Full Node 22.23.3 test suite: PASS (208/208, rerun 2026-10-19); production build and TypeScript validation: PASS (rerun 2026-10-19). Production Worker dry-run passed and shows `anipins-production-db`, both existing production R2 buckets, and the `basic` Container instance selection. No production Worker deployment or production R2 write occurred; the additive production D1 migrations were applied in the previous continuation.

On 2026-10-19, the current Supabase source and production D1 counts matched across all 20 business tables. In addition, all 1,877 artwork records matched exactly across 23 non-timestamp metadata fields, including IDs, titles, character/anime labels, publication and Premium flags, object keys, dimensions, counters, hashes, creator names, and source URLs. The source remains live and can still receive writes, so repeat the parity check immediately before cutover. The D1 export was restored successfully into a disposable remote D1 database; key user, artwork, subscription, and Better Auth counts matched, and that temporary database was removed. Production D1 migrations `0001`–`0006` are now applied; `0005` and `0006` add only the announcements/recipients and payment transaction tables. No production Worker, website route, or app client was switched by that schema update. The owner confirmed Google sign-in works on migration staging, but `GOOGLE_CLIENT_SECRET` is absent from the production Worker's secret inventory, so production Google OAuth is not ready. `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are also absent there, so Premium checkout/webhook ledger cannot be verified on this Worker. An enabled legacy admin TOTP flow remains available through the login page's explicit “Use existing sign-in” fallback; it has not been ported to Better Auth. Live route check 2026-10-19: `https://anipins.com/` returns HTTP 200, `/api/better-auth/get-session` returns HTTP 404, and unauthenticated `/api/admin/users` returns HTTP 403, confirming the deployed production site still serves the legacy backend and was not switched to the prepared D1 auth path.

Remaining production gates: repeat source/D1 parity immediately before cutover; add and test production Google OAuth and Razorpay secrets; verify Premium-entitled access and payment webhooks without charging a real user; complete the admin/auth smoke tests against a production candidate; prepare a clean exact production commit; and receive the owner's approval in the exact form `APPROVED: deploy <commit hash> to production` before the Worker cutover. Premium-entitled access remains unverified in staging. A protected local production D1 export exists at `%LOCALAPPDATA%\AniPinsMigrationBackups\anipins-production-d1-20261018-114052.sql` (1,883,533 bytes; SHA-256 `0C1BF47C25B725113FA4E385ED4B50B93C549A0FB8D56B240599A7EC014FD706`). The current live site remains on legacy auth/data services until those gates are complete. Supabase and production R2 were not changed.
