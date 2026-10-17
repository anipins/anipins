const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../src/components/ArtCard.tsx"), "utf8");

test("feed artwork cards do not use 3D tilt that can paint across masonry gutters", () => {
  assert.doesNotMatch(source, /import\s+Tilt\s+from/);
  assert.doesNotMatch(source, /<Tilt\b/);
});

test("masonry card paint is contained to its own grid track", () => {
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  assert.match(css, /\.art-card\s*\{[^}]*contain:\s*layout\s+paint/s);
  assert.match(css, /\.art-card\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.art-card\s*\{[^}]*max-width:\s*100%/s);
});
