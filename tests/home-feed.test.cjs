const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { HOME_DISCOVERY_QUERY } = require("../src/lib/home-feed");

test("Home uses a rotating discovery feed instead of pinning visitors to newest uploads", () => {
  assert.deepEqual(HOME_DISCOVERY_QUERY, { sort: "random" });
});

test("production random feed uses a seeded hash so refreshes vary across the library", () => {
  const route = fs.readFileSync(path.join(__dirname, "../src/app/api/artworks/route.ts"), "utf8");
  assert.match(route, /hashtextextended\(CAST\(id AS text\), \?\)/);
});

test("home starts the next metadata page in the background before the visitor reaches it", () => {
  const home = fs.readFileSync(path.join(__dirname, "../src/app/page.tsx"), "utf8");
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(home, /<MasonryFeed query=\{HOME_DISCOVERY_QUERY\} randomize initialItems=\{discovery\} initialHasMore=\{discovery\.length === 36\} eagerLoad \/>/);
  assert.match(feed, /rootMargin: "1600px 0px"/);
  assert.match(feed, /remaining < 2000/);
});
