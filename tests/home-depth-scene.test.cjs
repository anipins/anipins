const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("home keeps a black-and-gold WebGL backdrop that reacts to scroll", () => {
  const component = fs.readFileSync(path.join(__dirname, "..", "src", "components", "HomeDepthScene.tsx"), "utf8");
  const home = fs.readFileSync(path.join(__dirname, "..", "src", "app", "page.tsx"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "..", "src", "app", "globals.css"), "utf8");

  assert.match(component, /<Canvas/);
  assert.match(component, /scrollY/);
  assert.match(component, /addEventListener\("scroll"/);
  assert.match(component, /tetrahedronGeometry/);
  assert.doesNotMatch(component, /446bd8|rgba\(20,35,74/);
  assert.match(home, /<HomeDepthScene\s*\/>/);
  assert.match(styles, /\.cinematic-home-depth[^}]*mix-blend-mode:\s*screen/);
});
