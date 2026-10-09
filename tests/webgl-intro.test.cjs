const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const intro = fs.readFileSync(path.join(root, "src", "components", "Intro.tsx"), "utf8");
const scenePath = path.join(root, "src", "components", "CinematicIntroScene.tsx");

test("the opening uses a real WebGL scene and preserves the AniPins logo asset", () => {
  assert.ok(pkg.dependencies.three, "three must be installed for the real 3D scene");
  assert.ok(pkg.dependencies["@react-three/fiber"], "React Three Fiber must render the scene");
  assert.match(intro, /CinematicIntroScene/);
  const scene = fs.readFileSync(scenePath, "utf8");
  assert.match(scene, /<Canvas/);
  assert.match(scene, /ap-symbol-intro\.png/);
  assert.match(scene, /useFrame/);
  assert.match(scene, /camera=\{\{ position: \[0,0,4\.1\], fov: 37 \}\}/);
  assert.match(scene, /onReady/);
});
