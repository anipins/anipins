const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "Intro.tsx"), "utf8");

test("the AniPins opening restores the original assembled-logo animation", () => {
  assert.match(source, /const logoFragments/);
  assert.match(source, /ap-symbol-intro\.png/);
  assert.match(source, /logoFragments\.map/);
  assert.doesNotMatch(source, /CinematicIntroScene/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /anipins_intro/);
});
