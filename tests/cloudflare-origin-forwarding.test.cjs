const test = require("node:test");
const assert = require("node:assert/strict");

const getForwarder = async () => (await import("../cloudflare/forwarding.mjs")).forwardToContainer;
const getHostCheck = async () => (await import("../cloudflare/forwarding.mjs")).isAllowedPublicHost;
const getCanonicalRedirect = async () => (await import("../cloudflare/forwarding.mjs")).canonicalHostRedirect;

test("forwards the public hostname so legitimate same-origin POST requests pass origin checks", async () => {
  const forwardToContainer = await getForwarder();
  const incoming = new Request("https://anipins.com/api/saves", {
    method: "POST",
    headers: { "origin": "https://anipins.com", "content-type": "application/json" },
    body: '{"artworkId":11}',
  });
  const forwarded = forwardToContainer(incoming);
  assert.equal(new URL(forwarded.url).host, "container");
  assert.equal(new URL(forwarded.url).protocol, "http:");
  assert.equal(forwarded.method, "POST");
  assert.equal(forwarded.headers.get("origin"), "https://anipins.com");
  assert.equal(forwarded.headers.get("x-forwarded-host"), "anipins.com");
  assert.equal(forwarded.headers.get("x-forwarded-proto"), "https");
  assert.equal(await forwarded.text(), '{"artworkId":11}');
});

test("replaces any caller-supplied forwarded hostname instead of trusting it", async () => {
  const forwardToContainer = await getForwarder();
  const incoming = new Request("https://www.anipins.com/api/likes", {
    method: "POST",
    headers: { "origin": "https://www.anipins.com", "x-forwarded-host": "attacker.example" },
  });
  const forwarded = forwardToContainer(incoming);
  assert.equal(forwarded.headers.get("x-forwarded-host"), "www.anipins.com");
});

test("does not convert a cross-site Origin into a trusted Origin", async () => {
  const forwardToContainer = await getForwarder();
  const incoming = new Request("https://anipins.com/api/saves", {
    method: "POST",
    headers: { "origin": "https://attacker.example" },
  });
  const forwarded = forwardToContainer(incoming);
  assert.equal(forwarded.headers.get("origin"), "https://attacker.example");
  assert.equal(forwarded.headers.get("x-forwarded-host"), "anipins.com");
});

test("accepts only the configured public domains as forwarded hosts", async () => {
  const isAllowedPublicHost = await getHostCheck();
  assert.equal(isAllowedPublicHost(new Request("https://anipins.com/api/saves")), true);
  assert.equal(isAllowedPublicHost(new Request("https://www.anipins.com/api/saves")), true);
  assert.equal(isAllowedPublicHost(new Request("https://anipins-staging.example.workers.dev/api/saves")), false);
});

test("permanently redirects www requests to the canonical HTTPS apex and preserves path and query", async () => {
  const canonicalHostRedirect = await getCanonicalRedirect();
  const response = canonicalHostRedirect(new Request("https://www.anipins.com/a/1301?from=share"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://anipins.com/a/1301?from=share");
});

test("permanently redirects HTTP requests to canonical HTTPS", async () => {
  const canonicalHostRedirect = await getCanonicalRedirect();
  const response = canonicalHostRedirect(new Request("http://anipins.com/gallery?page=2"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://anipins.com/gallery?page=2");
});

test("does not redirect unrelated or staging hosts", async () => {
  const canonicalHostRedirect = await getCanonicalRedirect();
  assert.equal(canonicalHostRedirect(new Request("https://anipins.com/a/1301")), null);
  assert.equal(canonicalHostRedirect(new Request("https://anipins-staging.example.workers.dev/a/1301")), null);
});
