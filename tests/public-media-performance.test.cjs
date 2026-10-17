const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const getHelpers = async () => import("../cloudflare/public-image-cache.mjs");

function fakeCache() {
  const data = new Map();
  return {
    data,
    async match(request) { return data.get(request.url)?.clone(); },
    async put(request, response) { data.set(request.url, response.clone()); },
    async delete(request) { return data.delete(request.url); },
  };
}
async function run(request, origin, cache) {
  const pending = [];
  const { servePublicImage } = await getHelpers();
  const response = await servePublicImage(request, origin, cache, p => pending.push(p));
  await Promise.all(pending);
  return response;
}
const url = "https://anipins.com/api/img/t/d59d31f0a274be2f.jpg";
const publicImage = () => new Response("image-payload", { status: 200, headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
const privateImage = () => new Response("secret", { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });

test("public art thumbnail is served from edge on repeat without touching container", async () => {
  const cache = fakeCache();
  let originCount = 0;
  const origin = () => { originCount += 1; return publicImage(); };
  const a = await run(new Request(url), origin, cache);
  assert.equal(a.status, 200);
  assert.equal(a.headers.get("X-AniPins-Edge-Cache"), "MISS");
  const b = await run(new Request(url), origin, cache);
  assert.equal(b.status, 200);
  assert.equal(b.headers.get("X-AniPins-Edge-Cache"), "HIT");
  assert.equal(await b.text(), "image-payload");
  assert.equal(originCount, 1);
  assert.equal(cache.data.size, 1);
  assert.equal(cache.data.get(url).headers.get("Cache-Control"), "public, max-age=60");
  assert.equal(a.headers.get("Cache-Control"), "private, no-store");
  assert.equal(b.headers.get("Cache-Control"), "private, no-store");
  assert.equal(a.headers.get("CDN-Cache-Control"), "private, no-store");
});
test("original artwork images can be cached only when upstream explicitly permits public caching", async () => {
  const cache = fakeCache();
  const original = url.replace("/t/", "/o/").replace(".jpg", ".png");
  const r = await run(new Request(original), publicImage, cache);
  assert.equal(r.status, 200);
  assert.equal(cache.data.size, 1);
  assert.equal(r.headers.get("Cache-Control"), "private, no-store");
  assert.equal(r.headers.get("CDN-Cache-Control"), "private, no-store");
});

test("a signed-in visit cannot give a public artwork a retained browser cache lifetime", async () => {
  const cache = fakeCache();
  const request = new Request(url, { headers: { Cookie: "anipins_session=member" } });
  const r = await run(request, publicImage, cache);
  assert.equal(r.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(r.headers.get("Cache-Control"), "private, no-store");
  assert.equal(cache.data.size, 0);
});

test("an expired artwork Cache API entry is deleted and refreshed before it can be served", async () => {
  const cache = fakeCache();
  cache.data.set(url, new Response("stale", { headers: {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=60",
    "x-anipins-artwork-cache-until": "1",
  } }));
  let calls = 0;
  const r = await run(new Request(url), () => { calls += 1; return publicImage(); }, cache);
  assert.equal(calls, 1);
  assert.equal(r.headers.get("X-AniPins-Edge-Cache"), "MISS");
  assert.equal(await r.text(), "image-payload");
});

test("private, premium, unpublished and session-bearing requests never enter shared cache", async () => {
  const cache = fakeCache();
  const requests = [
    new Request(url, { headers: { Cookie: "anipins_session=private" } }),
    new Request(url, { headers: { Authorization: "Bearer private" } }),
    new Request(url, { headers: { Range: "bytes=0-100" } }),
    new Request(url + "?token=sensitive"),
  ];
  for (const request of requests) {
    const r = await run(request, publicImage, cache);
    assert.equal(r.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  }
  const secret = await run(new Request(url), privateImage, cache);
  assert.equal(secret.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(cache.data.size, 0);
});

test("no caching for 404s, authorization failures, cookies or non-image content", async () => {
  const cache = fakeCache();
  const failures = [
    new Response("not found", { status: 404 }),
    new Response("denied", { status: 401 }),
    new Response("not an image", { status: 200, headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=3600" } }),
    new Response("vary", { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600", "Vary": "Cookie" } }),
    new Response("cookie", { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600", "Set-Cookie": "session=secret" } }),
  ];
  for (const response of failures) {
    const result = await run(new Request(url), () => response, cache);
    assert.equal(result.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  }
  assert.equal(cache.data.size, 0);
});

test("non-artwork API and POST requests pass through uncached", async () => {
  const cache = fakeCache();
  let calls = 0;
  const upstream = () => { calls++; return publicImage(); };
  const { servePublicImage } = await getHelpers();
  const pending = [];
  const a = await servePublicImage(new Request("https://anipins.com/api/artworks/11"), upstream, cache, p => pending.push(p));
  const b = await servePublicImage(new Request(url, { method: "POST" }), upstream, cache, p => pending.push(p));
  assert.equal(a.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(b.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(calls, 2);
  assert.equal(pending.length, 0);
});

test("normal public artwork pages are edge-cached, while Premium remains private", async () => {
  const cache = fakeCache();
  let calls = 0;
  const publicFeed = () => {
    calls += 1;
    return new Response(JSON.stringify({ items: [] }), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=5" } });
  };
  const address = "https://anipins.com/api/artworks?sort=latest&limit=36";
  await run(new Request(address, { headers: { Cookie: "anipins_session=member" } }), publicFeed, cache);
  const second = await run(new Request(address), publicFeed, cache);
  assert.equal(second.headers.get("X-AniPins-Edge-Cache"), "HIT");
  assert.equal(calls, 1);

  const member = await run(new Request("https://anipins.com/api/artworks?premium=1"), publicFeed, cache);
  assert.equal(member.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(calls, 2);
});

test("the Worker accepts only signed public-media queries for its direct R2 path", () => {
  const source = fs.readFileSync(path.join(__dirname, "../cloudflare/worker.mjs"), "utf8");
  const cache = fs.readFileSync(path.join(__dirname, "../cloudflare/public-image-cache.mjs"), "utf8");
  assert.match(source, /signedPublicMediaKey\(request, env\.NEXTAUTH_SECRET\)/);
  assert.match(source, /env\.ARTWORKS_PUBLIC\.get\(publicMediaKey\)/);
  assert.match(cache, /expiresAt > Math\.floor\(Date\.now\(\) \/ 1000\) \+ 120/);
});

test("homepage rotating discovery query uses a short-lived 5-second shared server cache", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/page.tsx"), "utf8");
  assert.match(source, /const getHomeDiscovery = unstable_cache\(/);
  assert.match(source, /\["public-home-discovery-v2"\]/);
  assert.match(source, /revalidate: 5/);
  assert.match(source, /getHomeDiscovery\(discoverySeed\)/);
});

test("production Worker routes eligible requests through the cache before entering the container", () => {
  const source = fs.readFileSync(path.join(__dirname, "../cloudflare/worker.mjs"), "utf8");
  assert.match(source, /import \{ servePublicImage, signedPublicMediaKey \} from "\.\/public-image-cache\.mjs"/);
  assert.match(source, /return servePublicImage\(/);
  assert.match(source, /caches\.default/);
  assert.match(source, /ctx\.waitUntil\(promise\)/);
});

test("immutable Next.js scripts and styles are cached at the edge for a full day", async () => {
  const cache = fakeCache();
  let calls = 0;
  const js = "https://anipins.com/_next/static/chunks/app/gallery/page-abcdef1234.js";
  const css = "https://anipins.com/_next/static/css/app-abcdef1234.css";
  for (const [address, type] of [[js, "application/javascript"], [css, "text/css"]]) {
    const upstream = () => { calls += 1; return new Response("asset", { status: 200, headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" } }); };
    const a = await run(new Request(address), upstream, cache);
    const b = await run(new Request(address), upstream, cache);
    assert.equal(a.headers.get("X-AniPins-Edge-Cache"), "MISS");
    assert.equal(b.headers.get("X-AniPins-Edge-Cache"), "HIT");
    assert.equal(cache.data.get(address).headers.get("Cache-Control"), "public, max-age=86400");
  }
  assert.equal(calls, 2);
});

test("logged-in WebView visitors may read previously verified public cache entries, but cannot populate image cache with private content", async () => {
  const cache = fakeCache();
  const authenticated = new Request(url, { headers: { Cookie: "anipins_session=private" } });
  const noCache = await run(authenticated, () => publicImage(), cache);
  assert.equal(noCache.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(cache.data.size, 0);
  await run(new Request(url), () => publicImage(), cache);
  const warmed = await run(authenticated, () => privateImage(), cache);
  assert.equal(warmed.headers.get("X-AniPins-Edge-Cache"), "HIT");
  assert.equal(await warmed.text(), "image-payload");
});

test("a logged-in WebView can populate shared cache only for explicitly public immutable Next.js static files", async () => {
  const cache = fakeCache();
  const asset = "https://anipins.com/_next/static/chunks/hashed.js";
  const request = new Request(asset, { headers: { Cookie: "anipins_session=private" } });
  const response = await run(request, () => new Response("public-code", {
    status: 200, headers: { "Content-Type": "application/javascript", "Cache-Control": "public, max-age=31536000, immutable" },
  }), cache);
  assert.equal(response.headers.get("X-AniPins-Edge-Cache"), "MISS");
  assert.equal(cache.data.size, 1);
});

test("dynamic pages and executable HTML never enter shared static cache", async () => {
  const cache = fakeCache();
  const html = "https://anipins.com/_next/static/chunks/forged.js";
  const response = await run(new Request(html), () => new Response("<html>private</html>", { headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=600" } }), cache);
  assert.equal(response.headers.get("X-AniPins-Edge-Cache"), "BYPASS");
  assert.equal(cache.data.size, 0);
});
