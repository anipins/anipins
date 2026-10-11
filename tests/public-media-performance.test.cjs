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
});

test("original artwork images can be cached only when upstream explicitly permits public caching", async () => {
  const cache = fakeCache();
  const original = url.replace("/t/", "/o/").replace(".jpg", ".png");
  const r = await run(new Request(original), publicImage, cache);
  assert.equal(r.status, 200);
  assert.equal(cache.data.size, 1);
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

test("homepage rotating discovery query uses a short-lived 5-second shared server cache", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/page.tsx"), "utf8");
  assert.match(source, /const getHomeDiscovery = unstable_cache\(/);
  assert.match(source, /\["public-home-discovery-v1"\]/);
  assert.match(source, /revalidate: 5/);
  assert.match(source, /getHomeDiscovery\(\)/);
});
