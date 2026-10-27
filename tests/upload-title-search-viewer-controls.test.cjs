const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("upload cards start without filename-derived titles and can clear all titles", () => {
  const upload = read("src/app/admin/upload/page.tsx");
  assert.match(upload, /title:\s*""/);
  assert.match(upload, /title:\s*previous\[0\]\.title/);
  assert.match(upload, /const clearAllTitles\s*=\s*\(\)\s*=>\s*setItems\(previous\s*=>\s*previous\.map\(item\s*=>\s*\(\{\s*\.\.\.item,\s*title:\s*""/);
  assert.match(upload, />Clear all titles</);
});

test("search input exposes a clear button for a nonempty query", () => {
  const navbar = read("src/components/Navbar.tsx");
  assert.match(navbar, /q\.trim\(\)\s*\?\s*<button/);
  assert.match(navbar, /aria-label="Clear search"/);
  assert.match(navbar, /setQ\(""\)/);
});

test("artwork viewers show Back and Close controls again when scrolling upward", () => {
  for (const file of ["src/components/ArtLightbox.tsx", "src/components/ArtworkDetailClient.tsx"]) {
    const viewer = read(file);
    assert.match(viewer, /setToolbarVisible\(scroll(?:Top|Y)\s*<\s*previous(?:Top|Y)\)/);
    assert.match(viewer, /aria-label="Go back"/);
    assert.match(viewer, /aria-label="Close"/);
  }
});
