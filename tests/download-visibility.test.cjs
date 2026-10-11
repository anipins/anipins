const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { mayDownloadArtwork } = require("../src/lib/artwork-access");

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
