const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repo = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(repo, "src/app/globals.css"), "utf8");
const nav = fs.readFileSync(path.join(repo, "src/components/MobileBottomNav.tsx"), "utf8");

test("phone masonry uses Pinterest-scale four-pixel gutters", () => {
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.masonry \{[^}]*column-gap: 4px/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.masonry > \* \{[^}]*margin-bottom: 4px/);
});

test("phone navigation is attached to the bottom edge instead of floating", () => {
  assert.match(nav, /fixed inset-x-0 bottom-0/);
  assert.doesNotMatch(nav, /inset-x-5 bottom-3/);
});
