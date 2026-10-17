const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("unfiltered Search renders public artwork on the server instead of waiting for hydration", () => {
  const page = fs.readFileSync(path.join(__dirname, "../src/app/search/page.tsx"), "utf8");
  assert.match(page, /export default async function SearchPage/);
  assert.match(page, /unstable_cache\([\s\S]*getArtworkCards\(\{ sort: "latest", limit: 36 \}\)/);
  assert.match(page, /const showDefaultFeed = !q && !gender && !wallpapers/);
  assert.match(page, /initialItems=\{initialItems\}/);
  assert.match(page, /initialHasMore=\{initialItems\.length === 36\}/);
  assert.doesNotMatch(page, /useSearchParams|"use client"/);
});

test("typed and filtered Search continues through the existing client API query", () => {
  const page = fs.readFileSync(path.join(__dirname, "../src/app/search/page.tsx"), "utf8");
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(page, /const feedQuery = \{[\s\S]*q \? \{ q \}/);
  assert.match(page, /gender \? \{ gender \}/);
  assert.match(page, /wallpaper: "1"/);
  assert.match(feed, /fetch\(`\/api\/artworks\?\$\{params\}`/);
});

test("only the initial featured slide competes for high-priority image loading", () => {
  const slider = fs.readFileSync(path.join(__dirname, "../src/components/FeaturedSlider.tsx"), "utf8");
  assert.match(slider, /<FeaturedImage art=\{a\} priority=\{idx === 0\}/);
  assert.match(slider, /}, 1500\);/);
  assert.match(slider, /quality=\{95\}/);
});
