const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { positiveId } = require("../src/lib/input-validation");
const { requestArtworkSave } = require("../src/lib/save-request");

test("accepts only safe positive integer artwork and collection IDs", () => {
  assert.equal(positiveId(9), 9);
  assert.equal(positiveId("41"), 41);
  for (const input of [null, undefined, 0, -1, 1.2, "1oops", "0", "01", {}, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(positiveId(input), null, String(input));
  }
});

test("only treats a verified server success as a saved artwork", async () => {
  const fetcher = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, saved: true }) });
  assert.deepEqual(await requestArtworkSave(7, undefined, fetcher), { status: "saved" });
});

test("auth, HTTP failure, invalid server payload and network failures are not saved", async () => {
  assert.deepEqual(await requestArtworkSave(7, undefined, async () => ({ ok: false, status: 401 })), { status: "unauthorized" });
  for (const response of [
    { ok: false, status: 403 },
    { ok: false, status: 500 },
    { ok: true, status: 200, json: async () => ({ ok: false, saved: true }) },
    { ok: true, status: 200, json: async () => ({ ok: true, saved: false }) },
  ]) {
    assert.deepEqual(await requestArtworkSave(7, undefined, async () => response), { status: "error" });
  }
  assert.deepEqual(await requestArtworkSave(7, undefined, async () => { throw Error("offline"); }), { status: "error" });
});

test("save API enforces collection ownership before writing into a user collection", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/api/saves/route.ts"), "utf8");
  assert.match(source, /SELECT id FROM collections WHERE id=\? AND user_id=\?/);
  assert.match(source, /SELECT id, COALESCE\(premium, 0\) AS premium FROM artworks WHERE id=\? AND published=1/);
  assert.match(source, /canAccessPremium\(u\)/);
  assert.match(source, /positiveId\(artworkId\)/);
  assert.match(source, /positiveId\(collectionId\)/);
});

test("SaveMenu only claims success after the API confirms a saved artwork", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/components/SaveMenu.tsx"), "utf8");
  assert.match(source, /requestArtworkSave\(artworkId, collectionId\)/);
  assert.match(source, /result.status !== "saved"/);
});
