const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = relative => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("artwork lightbox starts recommendations independently of slow detail metadata", () => {
  const source = read("src/components/ArtLightbox.tsx");
  assert.match(source, /initialItems=\{data\?\.art\?\.id === id \? data\.related \?\? \[\] : \[\]\}/);
  assert.doesNotMatch(source, /\{data\?\.related\?\.length\s*\?\s*<MasonryFeed/);
});

test("admin artwork manager fetches a bounded first page immediately and can append pages", () => {
  const client = read("src/app/admin/manage/page.tsx");
  const api = read("src/app/api/admin/artworks/route.ts");
  assert.match(client, /limit=40/);
  assert.match(client, /page=\$\{page\}/);
  assert.match(client, /setItems\(previous => append \? \[\.\.\.previous, \.\.\.\(d\.items \|\| \[\]\)\]/);
  assert.match(client, /Load more/);
  assert.match(api, /LIMIT \? OFFSET \?/);
  assert.match(api, /hasMore/);
});

test("artwork detail avoids serial session lookup and per-card adjacent-ID subqueries", () => {
  const route = read("src/app/api/artworks/[id]/route.ts");
  assert.match(route, /const art = await row\(/);
  assert.match(route, /const user = premiumOnly \? await getUser\(\) : null/);
  assert.match(route, /const \[related, adjacent\] = await Promise\.all\(/);
  assert.doesNotMatch(route, /SELECT MAX\(p\.id\)|SELECT MIN\(n\.id\)/);
});

test("full artwork page does not block its main pin on recommendations", () => {
  const page = read("src/app/a/[id]/page.tsx");
  const client = read("src/components/ArtworkDetailClient.tsx");
  assert.doesNotMatch(page, /getArtworkCards/);
  assert.match(client, /\{art && \(/);
  assert.match(client, /<MasonryFeed[\s\S]*initialItems=\{data\?\.related \?\? \[\]\}/);
});

test("admin route gives immediate navigation feedback and avoids duplicate overview stats", () => {
  const loading = read("src/app/admin/loading.tsx");
  const shell = read("src/app/admin/AdminShell.tsx");
  const stats = read("src/app/api/admin/stats/route.ts");
  const navbar = read("src/components/Navbar.tsx");
  assert.match(loading, /role="status"/);
  assert.match(navbar, /href="\/admin" prefetch/);
  assert.match(shell, /path === "\/admin"/);
  assert.match(stats, /Promise\.all\(\[/);
});

test("admin navigation fully prefetches dynamic route content instead of only its skeleton boundary", () => {
  const shell = read("src/app/admin/AdminShell.tsx");
  assert.match(shell, /<Link key=\{item\.href\} href=\{item\.href\} prefetch=\{true\}/);
  assert.match(shell, /onMouseEnter=\{warm\} onFocus=\{warm\}/);
  const prefetch = read("src/lib/admin-prefetch.ts");
  assert.match(prefetch, /\/admin\/manage.*api\/admin\/artworks/);
  assert.match(prefetch, /\/admin\/premium-manage.*scope=premium/);
  assert.match(prefetch, /CACHE_TTL_MS = 15_000/);
  assert.match(prefetch, /invalidateAdminData/);
  assert.match(read("src/app/admin/manage/page.tsx"), /getAdminJson\(/);
});
