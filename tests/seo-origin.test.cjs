const test = require("node:test");
const assert = require("node:assert/strict");

test("SEO origin falls back to the canonical domain when production receives a workers.dev value", async () => {
  const { normalizeSiteUrl } = await import("../src/lib/site-url.mjs");
  assert.equal(normalizeSiteUrl("https://anipins-staging.anipins01.workers.dev"), "https://anipins.com");
});

test("SEO origin normalizes www to the canonical apex and keeps local development usable", async () => {
  const { normalizeSiteUrl } = await import("../src/lib/site-url.mjs");
  assert.equal(normalizeSiteUrl("https://www.anipins.com"), "https://anipins.com");
  assert.equal(normalizeSiteUrl("http://localhost:3000"), "http://localhost:3000");
});

test("sitemap and robots use the normalized SEO origin", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  assert.match(read("src/lib/site.ts"), /normalizeSiteUrl\(process\.env\.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL\)/);
  assert.match(read("src/app/sitemap.ts"), /absoluteUrl\(/);
  assert.match(read("src/app/robots.ts"), /getSiteUrl\(\)/);
});
