const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

test("read HMAC supports legacy originals and thumbnail keys but not arbitrary paths", () => {
 const w=read("cloudflare/worker.mjs");
 const readStart=w.indexOf("async function signedArtworkRead");
 const readEnd=w.indexOf("__name(signedArtworkRead",readStart);
 const section=w.slice(readStart,readEnd);
 assert.match(section,/o\\\/\[a-f0-9\]\{16,32\}/);
 assert.match(section,/t\\\/\[a-zA-Z0-9._-\]\+/);
 assert.match(section,/crypto\.subtle\.verify\("HMAC"/);
 assert.match(section,/read:\$\{key\}:\$\{premium/);
 const uploadSection=w.slice(w.indexOf("async function signedArtworkUpload"),w.indexOf("__name(signedArtworkUpload"));
 assert.match(uploadSection,/t\\\/\[a-f0-9\]\{32\}\\\.webp/);
});
test("native media is read only after publication and Premium authorization", () => {
 const route=read("src/app/api/img/[...p]/route.ts");
 const first=route.indexOf("const unpublished =");
 const gate=route.indexOf("if (premium)");
 const native=route.indexOf("await readArtworkViaWorker(rel, premium)");
 assert.ok(first>=0 && gate>first && native>gate);
 assert.match(route,/await canAccessPremium\(user\)/);
 assert.match(route,/mayReadArtworkMedia\(artwork, user\)/);
 assert.match(route,/native \? null : await r2Get\(rel, premium\)/);
});
test("capability remains server-side and existing fallback survives backend issues", () => {
 const media=read("src/lib/media.ts"),route=read("src/app/api/img/[...p]/route.ts");
 assert.match(media,/export async function readArtworkViaWorker/);
 assert.match(media,/signedWorkerStorageUrl\("read", key, premium\)/);
 assert.match(media,/signal: AbortSignal\.timeout\(15_000\)/);
 assert.match(route,/Fall back to the already-authorized S3 path/);
});
