const test = require("node:test");
const assert = require("node:assert/strict");
const { shouldRequestNextPage } = require("../src/lib/feed-pagination");

test("does not re-request a page until the visitor scrolls again", () => {
  assert.equal(shouldRequestNextPage(1800, 1800), false);
  assert.equal(shouldRequestNextPage(1800, 1920), true);
});

test("allows the first request when no prior scroll request exists", () => {
  assert.equal(shouldRequestNextPage(null, 0), true);
});
