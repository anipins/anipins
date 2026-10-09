const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "Intro.tsx"), "utf8");

test("the AniPins opening delegates its enhanced reveal to the dedicated 3D scene", () => {
  assert.match(source, /CinematicIntroScene/);
  assert.match(source, /enhanced && <CinematicIntroScene/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /anipins_intro/);
});
