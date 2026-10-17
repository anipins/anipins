const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const intro = fs.readFileSync(path.join(root, "src", "components", "Intro.tsx"), "utf8");
const scenePath = path.join(root, "src", "components", "CinematicIntroScene.tsx");

test("the opening uses a lightweight AniPins wordmark reveal without loading a 3D scene", () => {
  assert.match(intro, /ap-symbol-intro\.png/);
  assert.match(intro, /className="intro-logo-mark"/);
  assert.match(intro, /intro-splash__lockup/);
  assert.match(intro, /intro-splash__wordmark-glint/);
  assert.match(intro, /INTRO_DURATION_MS = 3200/);
  assert.doesNotMatch(intro, /intro-splash__piece/);
  assert.doesNotMatch(intro, /CinematicIntroScene|@react-three\/fiber|three|framer-motion|logoFragments/);
  assert.ok(fs.existsSync(scenePath), "the experimental scene remains isolated from the startup path");
  assert.ok(pkg.dependencies["framer-motion"], "other interactive components retain Framer Motion");
});
