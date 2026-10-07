const test = require("node:test");
const assert = require("node:assert/strict");
const { nonWallpaperFilter, wallpaperFilter } = require("../src/lib/wallpaper-feed-utils");

test("normal artwork feeds exclude wallpaper records", () => {
  assert.equal(
    nonWallpaperFilter(),
    "(NOT (lower(category) = 'wallpapers' OR COALESCE(lower(tags), '') LIKE '%wallpaper%'))",
  );
});

test("dedicated wallpaper feeds select only wallpaper records", () => {
  assert.equal(
    wallpaperFilter(),
    "(lower(category) = 'wallpapers' OR COALESCE(lower(tags), '') LIKE '%wallpaper%')",
  );
});
