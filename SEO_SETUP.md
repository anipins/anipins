# AniPins SEO setup

## What is implemented

- Server-rendered home, anime index, character index, trending, anime detail, character detail and artwork detail content.
- Unique metadata, canonical URLs, Open Graph/Twitter cards, meaningful headings, internal links and image alt text.
- `WebSite`, `CollectionPage`, `ItemList` and `ImageObject` JSON-LD generated from real database records.
- Dynamic `/sitemap.xml`, `/robots.txt`, branded 404 and `X-Robots-Tag` protection for account, admin, search and private pages.
- Public `/delete-account` and accurate website/Android privacy policy.

## Environment

Set these in Vercel Production, Preview and local `.env.local` as appropriate:

```text
NEXT_PUBLIC_SITE_URL=https://anipins-three.vercel.app
GOOGLE_SITE_VERIFICATION=the_token_from_search_console
ANDROID_APP_LINKS_SHA256=AA:BB:...release-certificate-fingerprint
```

Never place `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable.

## Google Search Console

1. Add a URL-prefix property for `https://anipins-three.vercel.app/` (or add a domain property if a custom domain is connected).
2. Choose HTML-tag verification, copy only the `content` token into `GOOGLE_SITE_VERIFICATION`, deploy, then verify.
3. Submit `https://anipins-three.vercel.app/sitemap.xml`.
4. Inspect `/`, `/anime`, `/characters`, representative `/anime/[slug]`, `/c/[slug]` and `/a/[id]` URLs and request indexing.
5. Use the rendered HTML and Rich Results tests to validate structured data. Image indexing can take time and is not guaranteed.

The sitemap reads current published database records; unpublished/admin/account/search URLs are intentionally excluded.
