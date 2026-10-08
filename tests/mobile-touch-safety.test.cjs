const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repo = path.join(__dirname, "..");
const source = file => fs.readFileSync(path.join(repo, file), "utf8");

test("the gallery does not reset itself on focus, pageshow, or a timer", () => {
  const feed = source("src/components/MasonryFeed.tsx");
  assert.doesNotMatch(feed, /setInterval\(refreshRecent/);
  assert.doesNotMatch(feed, /addEventListener\("pageshow", refreshWhenVisible\)/);
  assert.doesNotMatch(feed, /addEventListener\("focus", refreshWhenVisible\)/);
});

test("an artwork card needs deliberate movement-free touch before opening", () => {
  const card = source("src/components/ArtCard.tsx");
  assert.match(card, /> 20\) suppressOpen\.current = true/);
  assert.match(card, /setTimeout\(\(\) => \{ suppressOpen\.current = false; \}, 400\)/);
});

test("pull to refresh can only start from the top edge", () => {
  const refresh = source("src/components/PullToRefresh.tsx");
  assert.match(refresh, /event\.touches\[0\]\.clientY <= START_ZONE/);
  assert.match(refresh, /const THRESHOLD = 80/);
});
