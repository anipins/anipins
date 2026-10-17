# Cloudflare staging status

The old staging instructions are retired: they described `wrangler.jsonc` as staging-only and recommended copying production Supabase, payment, and R2 credentials. That is not safe or accurate.

## What currently exists

- `wrangler.jsonc` is associated with the production-routed AniPins Worker and binds the live `anipins-public-media` and `anipins-premium-media` buckets. Do not deploy it to test the migration.
- `wrangler.better-auth-staging.jsonc` deploys only the standalone auth Worker and binds the test D1 database. It does not serve the AniPins website or connect a Container/R2.
- Staging D1 migrations 0001–0004 and the separate auth Worker are in place. The app identity bridge is currently local code only.
- There is no separate staging R2 bucket or isolated app Container configuration in the account. Do not copy images or deploy a new Container until cost and resource use are explicitly approved.

## Safe checks

From the repository root:

```powershell
npx wrangler whoami
npx wrangler d1 migrations list anipins-staging-db --remote --config wrangler.better-auth-staging.jsonc
npx wrangler deploy --dry-run --config wrangler.better-auth-staging.jsonc
```

The dry run must show only `env.DB (anipins-staging-db)`. The standalone auth Worker may be deployed with:

```powershell
npx wrangler deploy --config wrangler.better-auth-staging.jsonc
```

That deploy does not complete the app migration. Do not deploy the website/Container until a separate staging app configuration uses staging-only secrets, D1, and media storage. See [DEPLOY.md](DEPLOY.md) for the full release gate, exact secret names, smoke-test checklist, and rollback plan.

Production routes, production Supabase data, payment settings, and existing R2 objects must remain unchanged until staging parity and rollback are verified and the owner supplies the required production approval.
