const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const intro = fs.readFileSync(path.join(root, "src", "components", "Intro.tsx"), "utf8");
const scenePath = path.join(root, "src", "components", "CinematicIntroScene.tsx");

test("the opening uses the original lightweight AniPins logo animation", () => {
  assert.match(intro, /ap-symbol-intro\.png/);
  assert.match(intro, /logoFragments\.map/);
  assert.match(intro, /setTimeout\(\(\) => setShow\(false\), 1750\)/);
  assert.doesNotMatch(intro, /CinematicIntroScene|@react-three\/fiber|three/);
  assert.ok(fs.existsSync(scenePath), "the experimental scene remains isolated from the startup path");
  assert.ok(pkg.dependencies["framer-motion"], "the original animation uses Framer Motion");
});
