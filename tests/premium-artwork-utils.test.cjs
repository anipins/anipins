const test = require("node:test");
const assert = require("node:assert/strict");
const { premiumArtworkFilter } = require("../src/lib/premium-artwork-utils");

test("public feeds exclude premium-exclusive artwork", () => {
  assert.equal(premiumArtworkFilter(false), "COALESCE(premium, 0) = 0");
});

test("premium feeds select only premium-exclusive artwork", () => {
  assert.equal(premiumArtworkFilter(true), "COALESCE(premium, 0) = 1");
});
