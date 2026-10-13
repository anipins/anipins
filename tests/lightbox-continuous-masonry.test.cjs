const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("opened artwork and related cards form one wide desktop canvas", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/components/ArtLightbox.tsx"), "utf8");
  assert.match(source, /lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,3fr\)\]/);
  assert.match(source, /<aside[^>]+aria-label="Related artwork"/);\n  assert.match(source, /md:grid-cols-\\[minmax\\(0,0\\.95fr\\)_minmax\\(0,1\\.05fr\\)\\]/);\n  assert.match(source, /className="columns-2 gap-3 xl:gap-4"/);
  assert.match(source, /data\.related\.slice\(0, 6\)\.map/);
  assert.match(source, /<ArtCard[^>]+art=\{relatedArt\}/);
  assert.doesNotMatch(source, /md:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(360px,0\.65fr\)\]/);
});

test("remaining artwork grid stays below the canvas, with no duplicated desktop cards", () => {
  const viewer = fs.readFileSync(path.join(__dirname, "../src/components/ArtLightbox.tsx"), "utf8");
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(viewer, /desktopHiddenIds=\{data\.related\.slice\(0, 6\)\.map/);
  assert.match(feed, /desktopHiddenIds\?: number\[\]/);
  assert.match(feed, /desktopHidden=\{desktopHiddenIds\.includes\(art\.id\)\}/);
});

test("desktop hiding never prevents mobile users seeing the full related feed", () => {
  const card = fs.readFileSync(path.join(__dirname, "../src/components/ArtCard.tsx"), "utf8");
  assert.match(card, /desktopHidden\?: boolean/);
  assert.match(card, /desktopHidden \? "lg:hidden" : ""/);
});
