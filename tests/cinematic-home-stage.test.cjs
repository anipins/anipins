const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const slider = fs.readFileSync(path.join(root, "src", "components", "FeaturedSlider.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "src", "app", "page.tsx"), "utf8");

test("home keeps the artwork stage clean without decorative line effects", () => {
  assert.doesNotMatch(home, /cinematic-home/);
  assert.doesNotMatch(slider, /cinematic-feature-stage/);
  assert.doesNotMatch(slider, /cinematic-architectural-lines/);
  assert.match(slider, /rotateY/);
});
