# AniPins deployment and Better Auth/D1 migration

## Current verified topology

- Website/API: Next.js in a Cloudflare Container, fronted by `cloudflare/worker.mjs`.
- `wrangler.jsonc` names the Worker `anipins-staging`, but the deployed Worker is production-routed (including `anipins.com` / `www.anipins.com`) and binds the existing production R2 buckets `anipins-public-media` and `anipins-premium-media`. Do not deploy this config as staging.
- The production-routed Worker still serves the legacy website/auth path. The migration target is Better Auth + Cloudflare D1 + existing Cloudflare R2 + Workers.
- Isolated Better Auth staging Worker: `anipins-better-auth-staging`, at `https://anipins-better-auth-staging.anipins01.workers.dev`; it binds only staging D1. It is not the website Worker and does not by itself switch app login/data.
- Isolated app migration staging: `anipins-migration-staging` at `https://anipins-migration-staging.anipins01.workers.dev`, using `anipins-staging-db` and two dedicated staging R2 buckets. Published artwork object keys were mirrored from production R2 to staging R2 without changing production objects. Migrations `0001`–`0007` are applied. Staging uses the `basic` Container class after the `lite` class failed to start reliably; production must be cost-monitored after cutover.
- Production D1 preparation target: `anipins-production-db` (`5f1923c8-e706-4894-90e7-2d378333a65a`). Migrations `0001`–`0007` are applied using the migration-only config `wrangler.d1-production.jsonc` (no Worker entrypoint, routes, R2, or Container); a live Wrangler check on 2026-10-19 reported no migrations to apply. All 20 source business tables were copied from Supabase without modifying the source; the 11 users, 20 legacy sessions, 1,877 artworks, 6 settings, 6 billing records, 9 Google identities, audit/security, and activity records are present. Better Auth has 11 linked users, 11 credential accounts, and 9 Google accounts. Artwork objects and R2 keys were not copied or changed.
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
- Production Google OAuth and payment-provider secret names are present (confirmed read-only on 2026-10-19); secret values and live OAuth/payment flows have not been validated.
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

App migration staging deploy `anipins-migration-staging` is active on its `workers.dev` URL only; latest Worker version is `6552a2e1-dd47-4cca-954b-e7c540649b7d`. The owner confirmed the Better Auth email/Google login plus admin MFA now opens `/admin` and remains there after refresh. Staging email auth, artwork browse/detail, image fetch, like/unlike, sign-out, admin dashboard, authenticated upload, pagination, and sampled media checks passed as recorded above. Read-only D1 aggregation now confirms Razorpay test-mode webhook events were persisted: two each for `subscription.activated` and `subscription.charged`, plus two active staging subscription rows. This verifies the staging webhook-to-ledger path; Premium-entitled access through the UI/API remains unverified. The verified staging admin MFA session-handoff fix is in the current deployed Worker; regression tests, TypeScript, and production build passed before deployment. Production Worker dry-run previously passed with `anipins-production-db`, existing production R2 buckets, and the `basic` Container instance selection. No production Worker deployment or production R2 write occurred.

On 2026-10-19, the current Supabase source and production D1 counts matched across all 20 business tables. In addition, all 1,877 artwork records matched exactly across 23 non-timestamp metadata fields, including IDs, titles, character/anime labels, publication and Premium flags, object keys, dimensions, counters, hashes, creator names, and source URLs. The source remains live and can still receive writes, so repeat the parity check immediately before cutover. The D1 export was restored successfully into a disposable remote D1 database; key user, artwork, subscription, and Better Auth counts matched, and that temporary database was removed. Production D1 migrations `0001`–`0007` are applied; a live Wrangler check reports no pending migrations. No production Worker, website route, or app client has been switched. Secret names for Google OAuth and Razorpay are present, but secret values were not read or validated. Live route checks return HTTP 404 for `https://anipins.com/api/better-auth/get-session` and HTTP 200 for the legacy `/api/auth/me`, confirming production still serves the legacy auth/data path.

Remaining production gates: repeat source/D1 parity immediately before cutover because Supabase can still receive writes; verify Premium-entitled access on staging; confirm production OAuth/payment secret values are correct (Wrangler confirms names, not values); complete final auth/admin smoke tests on a production candidate; prepare a clean exact production commit; and receive the owner's approval in the exact form `APPROVED: deploy <commit hash> to production` before the Worker cutover. A live route check on 2026-10-19 returned HTTP 404 for `https://anipins.com/api/better-auth/get-session`, while the old `/api/auth/me` route returned HTTP 200; the live site remains on legacy auth/data services. `wrangler secret list` confirms production secret names for Better Auth, Google OAuth, Razorpay, Supabase, and R2 are present; secret values were not read or tested. Supabase and production R2 were not changed.

On 2026-10-19, the source checkout was updated to remove Supabase storage fallbacks from application routes and stop forwarding retired Supabase credentials to the app Container; it also changes Premium previews to read from the Premium R2 bucket. Existing Supabase data and Worker secrets remain intact for rollback. This source update is not a production deployment. The Android CI signing change recorded on 2026-10-19 was provisional and is superseded below; the current live Android APK remains the checked-in `2.5.21` artifact.

On 2026-10-19, the admin's existing TOTP/recovery-code verification was ported to the Better Auth cutover path. It requires a session-bound signed MFA proof before the ADMIN role is returned or linked, consumes recovery codes once, and throttles failed attempts using additive D1 table `admin_mfa_attempts`. The focused tests, full Node 22 test suite, TypeScript check, production build, and migration-staging dry-run passed. Migration `0007_admin_mfa_attempts.sql` was applied only to `anipins-staging-db`; `anipins-migration-staging` has since been updated to version `6552a2e1-dd47-4cca-954b-e7c540649b7d`. The owner confirmed sign-in plus authenticator challenge opens `/admin` and remains open after refresh. No production Worker or production D1 migration was changed.

## Production status update — 2026-10-20

The earlier statements above that production was still on the legacy auth route are historical and are superseded by this update. Cloudflare's deployment history confirms that production Worker `anipins-staging` received the approved Better Auth/D1 migration commit `077819a3b57a0d4380834d53e1f8883753574613` on 2026-10-19; its current 100%-traffic version is `cbf0753c-8691-44de-9b89-a0a1386dc3b7`. The version is bound to production D1 `anipins-production-db` and the production public and Premium R2 buckets. Live checks return HTTP 200 for `/login` and `/api/better-auth/get-session` (anonymous session is `null`). The seven public featured artworks correspond to the Supabase source and all sampled thumbnail URLs return HTTP 200. This confirms the website's Better Auth/D1/R2 path is live; it does not by itself prove all client flows or the Android app have been migrated.

Production D1 row counts matched the Supabase source for the 20 copied business tables except `telemetry`, which has 137 more rows in D1, consistent with new post-copy writes. The exact artwork metadata parity check previously recorded remains valid for the snapshot it covered; Supabase is still retained and writable, so it is not safe to claim ongoing zero-lag replication. Production deployment bindings still include legacy Supabase/Postgres secret names as well as the new configuration; their secret values were not read. Keep those credentials/data for rollback until a separately verified retirement plan. Current uncommitted Worker/media cleanup changes stop forwarding Supabase/Postgres credentials into the container and remove Supabase storage fallback code; they have only been verified on migration staging and are not deployed to production.

The remaining release gate is not “switch production from Supabase” (that Worker switch is already live). It is to finish and verify the current cleanup candidate, establish the app/client cutover separately, and then deploy only an exact committed hash with fresh explicit approval. Do not treat the prior approval for `077819…` as approval for later, uncommitted changes. Premium-entitled user access and live Google OAuth/payment flows remain unverified. The Supabase security scan also reports `public.billing_subscriptions` with RLS disabled (critical); do not change it without reviewing and approving the required access policies.

## Final migration candidate verification — 2026-10-20

The current source candidate removes Supabase/Postgres runtime forwarding and storage fallbacks, switches the Android native email/Google flows to Better Auth while retaining encrypted session cookies, and aligns the container's Google client ID with the Better Auth OAuth client (the old production secret is retained only for rollback). All 233 Node 22 tests pass, Android lint/debug assembly and the Next.js production build pass, and the production Wrangler dry-run binds `anipins-production-db` plus the production R2 buckets. The updated staging Worker `anipins-migration-staging` is version `17402451-08d8-4e0b-bf74-172142735a69`; unauthenticated session/profile routes, native Google config, featured artwork, and public site return HTTP 200. Its native Google config now reports the same client ID as the staging Better Auth configuration.

The production site remains on the previously deployed migration version until a fresh exact-hash production approval is given. A live production check still shows `/api/auth/google/native-config` returning the retained legacy client ID; the new candidate corrects that by forwarding `BETTER_AUTH_GOOGLE_CLIENT_ID` as the canonical app runtime value. The Android source is migration-ready at `2.5.22` (`versionCode` 43). The existing signing key is held in private Supabase Storage and the Android build workflow is reconnected to its OIDC-protected signer; its signed output must match the current website APK certificate before it can be published. Do not generate a replacement key or remove old Supabase secrets/data before rollback is no longer required.

## Android signing workflow update — 2026-10-20

The Android release workflow candidate now signs locally in GitHub Actions with the existing APK v2 signing implementation and removes the Supabase OIDC/function/storage calls. It retains the strict certificate fingerprint match against the currently published `AniPins-2.5.21.apk`, so a different Play upload key cannot silently replace the sideload release key. Local smoke verification with a throwaway test key passed Android `apksigner` v2 validation. This source change has not yet run in GitHub Actions or published an APK. Before dispatching it, the owner must move the exact existing `v2-signing-key.txt` and `v2-signing-password.txt` values from the private Supabase Storage bucket into encrypted GitHub repository Actions secrets named `ANIPINS_SIGNING_KEY_DATA` and `ANIPINS_SIGNING_PASSWORD`; never post either value in chat or commit them. Once the workflow passes the release certificate check, review the artifact and publish it through the normal website release process. Keep the Supabase copy until successful validation and a secure backup are confirmed.
