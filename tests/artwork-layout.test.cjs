const test = require("node:test");
const assert = require("node:assert/strict");
const { getArtworkImageFit } = require("../src/lib/artwork-layout");

test("wide artwork is contained so no edge is cropped in a gallery tile", () => {
  assert.equal(getArtworkImageFit({ width: 1920, height: 1080 }), "contain");
});

test("portrait artwork keeps its edge-to-edge masonry presentation", () => {
  assert.equal(getArtworkImageFit({ width: 1080, height: 1920 }), "cover");
});
