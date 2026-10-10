# Cloudflare staging setup

This configuration deploys only to the temporary Worker URL:

`https://anipins-staging.<account-subdomain>.workers.dev`

It does not create a route or change `anipins.com`.

## Before the first deployment

1. Authenticate Wrangler with the AniPins Cloudflare account:

   ```powershell
   npx wrangler login
   ```

2. Add the same runtime configuration used by production as Cloudflare Worker
   secrets. Never commit, paste into chat, or place these values in
   `wrangler.jsonc`:

   ```powershell
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put RAZORPAY_KEY_ID
   npx wrangler secret put RAZORPAY_KEY_SECRET
   npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put R2_ACCESS_KEY_ID
   npx wrangler secret put R2_SECRET_ACCESS_KEY
   ```

   Also transfer any optional production variables listed in
   `cloudflare/worker.mjs` that are enabled for AniPins (Firebase, premium plan,
   R2 bucket names, etc.). For staging, `NEXT_PUBLIC_SITE_URL` and
   `NEXTAUTH_URL` must use the temporary `workers.dev` URL.

3. Because Docker is not installed on this PC, use **Workers Builds** connected
   to the GitHub repository, or deploy from a computer with Docker running.
   Configure its production branch for this *staging Worker* only with:

   ```text
   npx wrangler deploy
   ```

## Verify before moving the domain

- Open `/health` and confirm `{ "ok": true }`.
- Test normal artwork browsing, Google login, admin access, upload, image view,
  download, Premium checkout and the Razorpay webhook on the staging URL.
- Confirm R2 media loads and no new objects are written to an unexpected bucket.
- Review Worker and Container logs for startup and request errors.

Only after all checks pass should `anipins.com` be attached to a separate
production Worker configuration. Do not add it to this staging Worker.
