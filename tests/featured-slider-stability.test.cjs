const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "FeaturedSlider.tsx"),
  "utf8",
);

test("featured artwork stays on the selected card until the visitor changes it", () => {
  assert.doesNotMatch(
    source,
    /setInterval\([\s\S]*?setIdx/,
    "the featured carousel must not advance while a refresh is settling",
  );
});
