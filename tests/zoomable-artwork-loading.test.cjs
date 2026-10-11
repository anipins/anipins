const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { isImageAlreadyLoaded } = require("../src/lib/image-loading-state");

test("recognizes an already loaded cached image even when its load event was missed", () => {
  assert.equal(isImageAlreadyLoaded({ complete: true, naturalWidth: 1440 }), true);
  assert.equal(isImageAlreadyLoaded({ complete: true, naturalWidth: 1 }), true);
});

test("does not mark pending or failed image requests as loaded", () => {
  assert.equal(isImageAlreadyLoaded({ complete: true, naturalWidth: 0 }), false);
  assert.equal(isImageAlreadyLoaded({ complete: false, naturalWidth: 1440 }), false);
  assert.equal(isImageAlreadyLoaded(null), false);
});

test("zoomable artwork checks cached images after hydration and displays a failure state", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/components/ZoomableArtwork.tsx"), "utf8");
  assert.match(source, /isImageAlreadyLoaded\(imageRef\.current\)/);
  assert.match(source, /onError=\{\(\)=>setFailedSrc\(src\)\}/);
  assert.match(source, /Full quality unavailable/);
});
