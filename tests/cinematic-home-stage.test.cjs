const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const slider = fs.readFileSync(path.join(root, "src", "components", "FeaturedSlider.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "src", "app", "page.tsx"), "utf8");

test("home has an original cinematic artwork stage with a perspective reveal", () => {
  assert.match(home, /cinematic-home/);
  assert.match(slider, /cinematic-feature-stage/);
  assert.match(slider, /cinematic-architectural-lines/);
  assert.match(slider, /rotateY/);
});
