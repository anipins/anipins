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
test("generated WebP thumbnails use the signed native R2 upload route", () => {
  const worker=read("cloudflare/worker.mjs"),media=read("src/lib/media.ts");
  assert.match(worker,/upload\.key\.startsWith\("t\/"\) && upload\.contentType !== "image\/webp"/);
  assert.ok(worker.includes("t\\/[a-f0-9]{32}\\.webp"));
  assert.match(media,/signedWorkerStorageUrl\("upload", key, premium\)/);
  assert.match(media,/await putMedia\(thumbKey, thumbBuf, "image\/webp", premium\)/);
  assert.ok(worker.includes("this.rolling ??= this.restartForConfigurationRollout()"));
});
test("uploads serialize finalization under existing Lite 256 MB budget", () => {
 const page=read("src/app/admin/upload/page.tsx");
 assert.match(page,/const PARALLEL_UPLOADS = 1/);
});
