const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { HOME_DISCOVERY_QUERY } = require("../src/lib/home-feed");

test("Home uses a rotating discovery feed instead of pinning visitors to newest uploads", () => {
  assert.deepEqual(HOME_DISCOVERY_QUERY, { sort: "random" });
});

test("production random feed rotates from a seeded indexed position instead of sorting the whole library", () => {
  const route = fs.readFileSync(path.join(__dirname, "../src/app/api/artworks/route.ts"), "utf8");
  assert.match(route, /const offset = \(seed % total \+ consumed\) % total/);
  assert.match(route, /ORDER BY id ASC LIMIT \? OFFSET \?/);
  assert.doesNotMatch(route, /hashtextextended|ORDER BY RANDOM\(\)/);
});

test("home keeps its initial discovery feed compact and waits for visitor scrolling before loading more", () => {
  const home = fs.readFileSync(path.join(__dirname, "../src/app/page.tsx"), "utf8");
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(home, /sort: "random", limit: 18, seed, compact: true/);
  assert.match(home, /initialHasMore=\{discovery.length === 18\}/);
  assert.doesNotMatch(home, /eagerLoad/);
  assert.match(feed, /shouldLoadFromFeedSignal/);
  assert.match(feed, /visitorScrollArmed.current = true/);
  assert.match(feed, /rootMargin: "1600px 0px"/);
  assert.match(feed, /remaining < 2000/);
  assert.doesNotMatch(home, /Browse anime art by series and character/);
});

test("the server-rendered random Home screen is not immediately replaced during hydration", () => {
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(feed, /const renderedItemsRef = useRef\(initialItems\)/);
  assert.match(feed, /if \(renderedItemsRef\.current === initialItems\) return/);
  assert.match(feed, /setItems\(randomize \? shuffled\(initialItems\) : initialItems\)/);
});
