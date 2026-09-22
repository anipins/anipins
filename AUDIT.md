# AniPins Codebase Audit

Date: 2026-09-22

## Current architecture

- Frontend: Next.js 15 App Router, React 19, TypeScript and Tailwind CSS.
- Backend: Next.js route handlers in the same repository. Production uses PostgreSQL through `pg`; local development falls back to SQLite through `better-sqlite3`.
- Storage: Supabase object storage for production artwork and profile media.
- Authentication: AniPins-owned users and sessions. Passwords use bcrypt hashes; session tokens are stored server-side and set in cookies. Google Identity Services is linked into the same users/session system through `auth_identities`, using Google's stable `sub` value. Administrator role, two-factor fields, login challenges, session management and security/audit records are present.
- Android: native Android WebView application that loads the live AniPins site, with native download/upload, navigation, notification and Google account-selection integrations.
- Deployment: Vercel production deployment from the GitHub `main` branch. Canonical public origin is `https://anipins.com`; PostgreSQL/storage are supplied through server-only environment variables.

## What is already implemented

- Canonical metadata, Open Graph/Twitter metadata, robots rules, sitemap generation and structured data.
- Indexable artwork, anime and character detail routes.
- Responsive feed, search, saves, follows, profiles, recommendations and administration.
- Duplicate-image detection during admin upload using content and perceptual hashes.
- Rate limiting and same-origin checks on sensitive write endpoints.
- Database row-level security and revoked direct anonymous access for private tables.
- First-party telemetry, administrator audit history and account-security controls.

## Findings and priorities

1. **P0 — inaccurate privacy statement (fixed):** the policy said the Android release had no push or analytics capability, while Firebase Cloud Messaging and limited first-party telemetry are present. The wording now describes both accurately.
2. **P1 — inconsistent content labels:** production currently exposes 639 artwork records, 67 anime labels and 509 character labels. Several labels differ only by capitalization, spacing or spelling. See `DATA_CLEANUP_REPORT.md`.
3. **P1 — denormalized taxonomy:** anime and character names/slugs live directly on every artwork record. This permits new spelling variants. After the reviewed cleanup, add canonical anime and character tables or validated admin autocomplete so future uploads reuse existing records.
4. **P2 — rate-limit durability:** the middleware limiter is process-memory based, so limits are not shared reliably across serverless instances. Move sensitive auth/admin limits to a shared store when traffic or abuse warrants it.
5. **P2 — regression coverage:** add automated smoke tests for login, Google login, upload, download, artwork detail/infinite recommendations, sitemap and Android WebView navigation.

## Recommended next action

Review the proposed mappings in `DATA_CLEANUP_REPORT.md`. Only after approval, run a transaction that updates affected artwork labels/slugs, verifies counts, keeps existing canonical routes working through redirects, and records a backup/rollback plan.
