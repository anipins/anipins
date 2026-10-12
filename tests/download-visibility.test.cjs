const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { mayDownloadArtwork, mayReadArtworkMedia } = require("../src/lib/artwork-access");

test("public users cannot download unpublished artwork or missing artwork", () => {
  assert.equal(mayDownloadArtwork(null, null), false);
  assert.equal(mayDownloadArtwork({ published: 0 }, null), false);
  assert.equal(mayDownloadArtwork({ published: 0 }, { id: 3, role: "USER" }), false);
  assert.equal(mayDownloadArtwork({ published: 1 }, null), true);
});

test("authorized administrators retain access to unpublished draft downloads", () => {
  assert.equal(mayDownloadArtwork({ published: 0 }, { id: 3, role: "ADMIN" }), true);
  assert.equal(mayDownloadArtwork({ published: 1 }, { id: 3, role: "ADMIN" }), true);
});

test("download endpoint applies visibility before retrieving original bytes", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/api/artworks/[id]/download/route.ts"), "utf8");
  assert.match(source, /positiveId\(params.id\)/);
  assert.match(source, /if \(!mayDownloadArtwork\(art, user\)\)/);
  assert.match(source, /canAccessPremium\(user\)/);
});

test("R2 downloads are authorized before redirecting the large file directly from storage", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/api/artworks/[id]/download/route.ts"), "utf8");
  const r2 = fs.readFileSync(path.join(__dirname, "../src/lib/r2.ts"), "utf8");
  assert.match(source, /mayDownloadArtwork\(art, user\)/);
  assert.match(source, /r2SignedDownloadUrl\(art\.orig/);
  assert.match(source, /NextResponse\.redirect\(location/);
  assert.match(r2, /ResponseContentDisposition/);
  assert.match(r2, /expiresIn: 300/);
});

test("public media path rejects staged and unpublished artwork keys", () => {
  assert.equal(mayReadArtworkMedia(null, null), false);
  assert.equal(mayReadArtworkMedia({ published: 0 }, null), false);
  assert.equal(mayReadArtworkMedia({ published: 1 }, null), true);
  assert.equal(mayReadArtworkMedia(null, { role: "ADMIN" }), true);
  assert.equal(mayReadArtworkMedia({ published: 0 }, { role: "ADMIN" }), true);
  const source = fs.readFileSync(path.join(__dirname, "../src/app/api/img/[...p]/route.ts"), "utf8");
  assert.match(source, /mayReadArtworkMedia\(artwork, user\)/);
  assert.match(source, /const restricted = premium \|\| unpublished/);
  assert.match(source, /private, no-store/);
});
