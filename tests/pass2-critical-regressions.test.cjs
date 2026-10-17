const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { NextRequest } = require("next/server");

const root = path.resolve(__dirname, "..");
const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "anipins-regression-"));
fs.mkdirSync(path.join(runtime, "scripts"));
const schema = fs.readFileSync(path.join(root, "scripts/schema.sql"), "utf8")
  .replace(", provider_event_at BIGINT NOT NULL DEFAULT 0", "");
fs.writeFileSync(path.join(runtime, "scripts/schema.sql"), schema);
process.chdir(runtime);

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, ...args);
};
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};

const db = require(path.join(root, "src/lib/db.ts"));
const { NextRequest: Request } = require("next/server");
const artworksRoute = require(path.join(root, "src/app/api/artworks/route.ts"));
const { getArtworkCards } = require(path.join(root, "src/lib/content.ts"));
const billing = require(path.join(root, "src/lib/billing.ts"));
const mobileExchange = require(path.join(root, "src/app/api/auth/mobile-ticket/exchange/route.ts")).POST;
const { artworkFeedCacheHeaders } = require(path.join(root, "src/lib/artwork-feed-cache.ts"));

async function getFeed(query) {
  const response = await artworksRoute.GET(new Request(`http://localhost/api/artworks?${query}`));
  return { response, body: await response.json() };
}

test("a mobile sign-in ticket can create only one session when exchanged concurrently", async () => {
  await mobileExchange(new Request("http://localhost/api/auth/mobile-ticket/exchange", { method: "POST", body: "{}" }));
  await db.run("INSERT INTO users(id,email,password_hash,role) VALUES(?,?,?,?)", 9101, "ticket@example.invalid", "unused", "USER");
  const ticket = require("node:crypto").randomBytes(32).toString("hex");
  const codeHash = require("node:crypto").createHash("sha256").update(ticket).digest("hex");
  const now = Date.now();
  await db.run("INSERT INTO mobile_auth_tickets(code_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)", codeHash, 9101, now + 60000, now);
  const requests = [1, 2].map(() => mobileExchange(new Request("http://localhost/api/auth/mobile-ticket/exchange", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket }),
  })));
  const responses = await Promise.all(requests);
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.equal((await db.rows("SELECT token FROM sessions WHERE user_id=?", 9101)).length, 1);
});

test("cancelled subscriptions without a paid-through date do not grant Premium", async () => {
  await billing.storeSubscription({ subscription_id: "cancelled-zero", user_id: 9102, status: "cancelled", current_end: 0 });
  assert.equal(await billing.userHasPremium(9102), false);
});

test("older subscription webhook state cannot overwrite a newer state", async () => {
  const now = Math.floor(Date.now() / 1000);
  await billing.storeSubscription({ subscription_id: "ordered-events", user_id: 9103, status: "completed", current_end: now + 3600, eventCreatedAt: now });
  await billing.storeSubscription({ subscription_id: "ordered-events", user_id: 9103, status: "active", current_end: now + 3600, eventCreatedAt: now - 60 });
  assert.equal((await billing.getUserSubscription(9103)).status, "completed");
});

test("SSR discovery seed continues into page two without gaps", async () => {
  for (let id = 1; id <= 120; id++) {
    await db.run("INSERT INTO artworks(id,title,character_name,character_slug,anime_name,anime_slug,category,published,premium,orig,thumb,width,height) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, "Neutral fixture", "Audit", "audit", "Audit", "audit", "References", 1, 0, `o/${id}.png`, `t/${id}.webp`, 640, 960);
  }
  const first = await getArtworkCards({ sort: "random", limit: 36, seed: 60 });
  const seen = new Set(first.map((artwork) => artwork.id));
  let page = 1;
  let hasMore = true;
  while (hasMore && page < 10) {
    const { body } = await getFeed(`sort=random&seed=60&limit=36&page=${page++}`);
    body.items.forEach((artwork) => seen.add(artwork.id));
    hasMore = body.hasMore;
  }
  assert.equal(seen.size, 120);
});

test("artwork pagination rejects non-positive or non-integer limits", async () => {
  const { response } = await getFeed("sort=latest&limit=-2");
  assert.equal(response.status, 400);
});

test("Premium random feed responses are never marked publicly cacheable", () => {
  assert.equal(artworkFeedCacheHeaders({ premiumOnly: true, sort: "random" })["Cache-Control"], "private, no-store");
});

test.after(() => {
  global.__anipins_sqlite?.close();
  process.chdir(root);
  fs.rmSync(runtime, { recursive: true, force: true });
});
