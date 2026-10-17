const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("desktop artwork opens from the tapped feed preview before related metadata arrives", () => {
  const lightbox = read("src/components/ArtLightbox.tsx");
  assert.match(lightbox, /const art = data\?\.art\?\.id === id \? preserveArtworkPreview\(data\.art, preview\?\.id === id \? preview : null\) : preview/);
  assert.match(lightbox, /art && <section aria-label="Artwork and more to explore"/);
  assert.match(lightbox, /src=\{fullImage \|\| previewImage!/);
});

test("related artwork keeps wallpaper pins inside the wallpaper collection", () => {
  const route = read("src/app/api/artworks/[id]/route.ts");
  const lightbox = read("src/components/ArtLightbox.tsx");
  assert.match(route, /wallpaperFilter/);
  assert.match(route, /nonWallpaperFilter/);
  assert.match(route, /relatedFilter/);
  assert.match(route, /isWallpaperArtwork\(art\)/);
  assert.match(lightbox, /wallpaperOnly \? \{ wallpaper: "1" \}/);
});

test("the Following feed excludes wallpaper records like the normal discovery feed", () => {
  const route = read("src/app/api/artworks/route.ts");
  const following = route.match(/if \(sort === "following"\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.match(following, /nonWallpaperFilter\(\)/);
});

test("signed-out navigation exposes one normal sign-in action, not a public admin login", () => {
  const navbar = read("src/components/Navbar.tsx");
  assert.doesNotMatch(navbar, />Admin Login</);
  assert.match(navbar, /href="\/login"[^>]*>Sign in</);
});

test("masonry cards do not translate on hover and paint over neighboring artwork", () => {
  const css = read("src/app/globals.css");
  assert.doesNotMatch(css, /\.art-card:hover\s*\{[^}]*transform\s*:/s);
});

test("Android download metadata points at a checked-in APK", () => {
  const route = read("src/app/api/app-version/route.ts");
  const apk = route.match(/apk:\s*"\/downloads\/([^\"]+\.apk)"/);
  assert.ok(apk, "app-version route should publish an APK URL");
  assert.ok(fs.existsSync(path.join(__dirname, "..", "public", "downloads", apk[1])), `${apk[1]} must exist in public/downloads`);
});

test("Windows can install AniPins as a standalone live website", () => {
  const layout = read("src/app/layout.tsx");
  const manifest = read("src/app/manifest.ts");
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /ap-symbol-512\.png/);
});
