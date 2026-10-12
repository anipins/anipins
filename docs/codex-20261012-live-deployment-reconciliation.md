# AniPins interrupted Codex rollout: recovery and verification

Date inspected: 2026-10-12 UTC. This document describes **production observations**, not a claim that the source in GitHub `main` matches production.

## Do not roll back the production upload repair

- GitHub `main`: `dbea065ac27091d8d02df02ffad5d5332802efb7` (last commit 2026-10-11).
- Cloudflare Worker `anipins-staging` serves `anipins.com`; latest observed direct Wrangler production deployment 2026-10-12 16:17 UTC.
- Active Worker and running `anipins-web-v2` container share image digest starting `sha256:d2ec84653b92daa45307d465c`.
- Production Worker has `CONTAINER_BOOT_VERSION = "2026-10-12-upload-r2-read-proxy"`.
- Production Worker now handles HMAC-signed `POST /api/storage-upload` and `GET /api/storage-read` requests, using `ARTWORKS_PUBLIC` and `ARTWORKS_PREMIUM` native R2 bindings. The latter GET requires an unexpired capability with HMAC input `read:${key}:${premium ? "1" : "0"}:${expiresAt}`.
- Production Worker also includes a signed public-media fetch path that is not in checked-in `cloudflare/worker.mjs`.
- Live `wrangler.jsonc` configuration therefore differs from `main`: `ARTWORKS_PUBLIC` is bound to `anipins-public-media`, and `ARTWORKS_PREMIUM` to `anipins-premium-media`.
- Production direct deployment is not reflected in Cloudflare's GitHub Builds history; the last GitHub Builds record was for `dbea065`.

**Never merge this draft branch or trigger a GitHub-main auto-deploy without first importing Codex's complete local changes.** Doing so would restore the older container code and Worker and likely regress both upload types.

## Live QA completed

- Cloudflare Worker deployed and matching running container: PASS.
- R2 public/Premium bindings present: PASS.
- Public gallery and artwork detail pages render; anonymous artwork feed returned 36 entries: PASS.
- Unsigned `/api/storage-read` request rejected (403): PASS.
- Anonymous `POST /api/admin/upload` rejected (403): PASS.
- Authenticated upload (public and Premium): **NOT VERIFIED**. Requires an authorized admin session and read-only comparison of actual original, thumbnail and artwork DB metadata after a controlled test upload.
- Public/Premium existing artwork and permission preservation: must be regression-tested with authenticated accounts.
- Desktop at 1440px: current lightbox uses a three-column image/details/recommendation structure, while standalone artwork-page related masonry begins below the main detail at ~1052px. Both differ from the described continuous desktop masonry reference.
- Original screen recording was not supplied to this GitHub branch, so exact visual equivalence cannot yet be certified.

## Proposed lightbox improvement in this draft

`ArtLightbox.tsx`: opened image and metadata sit together in the left portion; normal-sized artwork cards begin at the same vertical position in masonry columns on the right; remaining related artwork continues in the full-width feed below. Responsive desktop duplicate suppression does not hide related artwork on mobile. This is a **proposal**, not yet a tested production visual reproduction.

## Before merging/deploying

1. Commit Codex's full actual local worktree (Worker, signed R2 staging read, admin-upload finalization, public-media signing, configuration, UI changes) to a separate GitHub branch. Include the revised container boot version and all bound R2 bucket declarations.
2. Reconcile that branch with this draft viewer/layout proposal; preserve signed-media access restrictions and any upload staging behavior present only in the live image.
3. Run CI tests and a Next.js production build on the reconciled source.
4. Compare the desktop lightbox with the supplied recording at 1440px and 1920px; validate mobile at 390px; test related-image counts, correct positioning, and full-quality media.
5. With permission, use a controlled test admin login to upload one **public** and one **Premium** test image. Verify capability creation, native R2 PUT, native R2 GET for staged finalization, thumbnail generation, publication and visibility permissions, and rollback of test records/assets only with explicit authorization.
6. After safe source reconciliation, perform a verified Cloudflare rollout and confirm Worker digest matches the running container; verify no new 503s or malformed-image responses.

No payment execution, real-account mutation or object deletion is part of this recovery note.
