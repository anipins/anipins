const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("home does not paint decorative 3D geometry over the artwork feed", () => {
  const component = fs.readFileSync(path.join(__dirname, "..", "src", "components", "HomeDepthScene.tsx"), "utf8");
  const home = fs.readFileSync(path.join(__dirname, "..", "src", "app", "page.tsx"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "..", "src", "app", "globals.css"), "utf8");

  assert.match(component, /REMOVED/);
  assert.doesNotMatch(home, /HomeDepthScene/);
  assert.doesNotMatch(styles, /\.cinematic-home-depth/);
});
