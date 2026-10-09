const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const premiumPage = fs.readFileSync(path.join(root, "src", "app", "premium", "page.tsx"), "utf8");
const schema = fs.readFileSync(path.join(root, "src", "lib", "pgschema.ts"), "utf8");

test("Premium begins its membership check and initial artwork fetches together", () => {
  assert.match(premiumPage, /Promise\.all\(\[\s*canAccessPremium\(user\),\s*getArtworkCards\(\{ sort: "featured", limit: 8, premium: true \}\),\s*getArtworkCards\(\{ sort: "latest", limit: 18, premium: true \}\)/s);
});

test("Premium first paint is capped while infinite scrolling retains the rest of the library", () => {
  assert.match(premiumPage, /getArtworkCards\(\{ sort: "latest", limit: 18, premium: true \}\)/);
});

test("Postgres has targeted indexes for Premium feeds and protected image lookups", () => {
  assert.match(schema, /idx_art_premium_feed/);
  assert.match(schema, /WHERE published=1 AND COALESCE\(premium, 0\)=1 AND COALESCE\(category, ''\) <> 'Wallpapers'/);
  assert.match(schema, /idx_art_orig/);
  assert.match(schema, /idx_art_thumb/);
});
