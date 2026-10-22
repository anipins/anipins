const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("desktop feeds use six columns at the scaled desktop breakpoint", () => {
  const component = fs.readFileSync(path.join(root, "src/components/MasonryFeed.tsx"), "utf8");
  const styles = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");

  assert.match(component, /if \(width >= 1360\) return 6;/);
  assert.doesNotMatch(component, /if \(width >= 1680\) return 6;/);
  assert.match(styles, /@media \(min-width: 1360px\) \{ \.masonry \{ column-count: 6; \} \}/);
});
