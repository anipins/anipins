const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = relative => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("the page background scrolls with the document instead of forcing fixed-background repaints", () => {
  const css = read("src/app/globals.css");
  assert.doesNotMatch(css, /background-attachment:\s*fixed/);
});

test("only the Android WebView uses the per-scroll pagination fallback", () => {
  const feed = read("src/components/MasonryFeed.tsx");
  const fallback = feed.slice(feed.indexOf("Some Android WebViews"), feed.indexOf("const onScroll = () => {", feed.indexOf("Some Android WebViews")));
  assert.match(fallback, /if\s*\(!activeLayout\s*\|\|\s*!window\.AniPinsAndroid\)\s*return/);
});
