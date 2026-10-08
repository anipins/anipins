const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("mobile artwork details keep only primary actions visible", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/components/ArtLightbox.tsx"), "utf8");
  assert.match(source, /Mobile actions: Save and Download stay visible/);
  assert.match(source, /Follow details, sharing and reporting stay behind More/);
  assert.match(source, /md:min-h-80/);
  assert.doesNotMatch(source, /className="flex min-h-80 flex-col/);
  assert.match(source, /artwork-detail-panel/);
});
