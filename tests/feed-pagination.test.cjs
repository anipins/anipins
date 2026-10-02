const test = require("node:test");
const assert = require("node:assert/strict");
const { shouldLoadFromFeedSignal } = require("../src/lib/feed-pagination");

test("requires a new visitor scroll gesture after the initial short-feed fill", () => {
  assert.equal(shouldLoadFromFeedSignal({ armed: false, canPrime: false }), false);
  assert.equal(shouldLoadFromFeedSignal({ armed: false, canPrime: true }), true);
  assert.equal(shouldLoadFromFeedSignal({ armed: true, canPrime: false }), true);
});
