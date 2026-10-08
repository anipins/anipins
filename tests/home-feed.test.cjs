const test = require("node:test");
const assert = require("node:assert/strict");
const { HOME_DISCOVERY_QUERY } = require("../src/lib/home-feed");

test("Home uses a rotating discovery feed instead of pinning visitors to newest uploads", () => {
  assert.deepEqual(HOME_DISCOVERY_QUERY, { sort: "random" });
});
