const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("production Worker signed PUT and GET routes are source controlled and R2 bucket bindings retained",()=>{
 const worker=read("cloudflare/worker.mjs"),config=JSON.parse(read("wrangler.jsonc"));
 assert.match(worker,/async function signedArtworkUpload/);assert.match(worker,/async function signedArtworkRead/);
 assert.match(worker,/await bucket\.put\(upload\.key/);assert.match(worker,/await bucket\.get\(stagedRead\.key\)/);
 assert.deepEqual(config.r2_buckets.map(b=>b.binding).sort(),["ARTWORKS_PREMIUM","ARTWORKS_PUBLIC"]);
});
test("staged upload and read use matching per-file signed Worker capabilities instead of S3 GET",()=>{
 const media=read("src/lib/media.ts");
 assert.match(media,/crypto\.createHmac\("sha256", secret\)/);
 assert.match(media,/signedWorkerStorageUrl\("upload", key, premium\)/);
 assert.match(media,/signedWorkerStorageUrl\("read", key, premium\)/);
 assert.match(media,/Staged artwork read failed/);
 assert.doesNotMatch(media,/if \(USE_R2_MEDIA\) return \{ key, uploadUrl: await r2SignedPutUrl/);
});
test("both original and WebP thumbnail uploads use native signed Worker/R2 binding",()=>{
 const worker=read("cloudflare/worker.mjs"),media=read("src/lib/media.ts");
 assert.ok(worker.includes("t\\/[a-f0-9]{32}\\.webp"));
 assert.match(worker,/upload\.key\.startsWith\("t\/"\)/);
 assert.match(media,/signedWorkerStorageUrl\("upload", key, premium\)/);
 assert.match(media,/if \(USE_R2_MEDIA && \(key\.startsWith\("o\/"\) \|\| key\.startsWith\("t\/"\)\)\)/);
 assert.match(media,/await putMedia\(thumbKey, thumbBuf, "image\/webp", premium\)/);
});
test("server-side thumbnail upload uses strict content types and short-lived HMAC capabilities",()=>{
 const worker=read("cloudflare/worker.mjs");
 assert.match(worker,/upload\.key\.startsWith\("t\/"\) && upload\.contentType !== "image\/webp"/);
 assert.match(worker,/crypto\.subtle\.verify\("HMAC"/);
 assert.match(worker,/await bucket\.put\(upload\.key/);
});

test("artwork thumbnails and originals stream via native Worker only after publication and Premium gate",()=>{
 const worker=read("cloudflare/worker.mjs"),media=read("src/lib/media.ts"),route=read("src/app/api/img/[...p]/route.ts");
 assert.match(worker,/async function signedArtworkRead/);
 assert.match(worker,/t.*a-zA-Z0-9.*webp/);
 assert.match(media,/export async function readArtworkViaWorker/);
 assert.match(route,/await readArtworkViaWorker\(rel, premium\)/);
 assert.match(route,/if \(unpublished\)/);
 assert.match(route,/if \(premium\)/);
 assert.match(route,/await canAccessPremium\(user\)/);
 assert.match(route,/const cacheControl = restricted/);
});
