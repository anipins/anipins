const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "Intro.tsx"), "utf8");

test("the AniPins opening uses a lightweight 3D-perspective reveal instead of a flat logo fade", () => {
  assert.match(source, /intro-3d-scene/);
  assert.match(source, /perspective: "1000px"/);
  assert.match(source, /intro-logo-depth/);
  assert.match(source, /intro-light-sweep/);
});
