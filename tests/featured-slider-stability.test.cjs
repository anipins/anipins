const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "FeaturedSlider.tsx"),
  "utf8",
);

test("featured artwork advances automatically and respects reduced-motion and visibility", () => {
  assert.match(source, /setInterval\([\s\S]*?setIdx/);
  assert.match(source, /}, 1500\);/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /onPointerEnter/);
  assert.match(source, /onPointerLeave/);
});

test("artwork card download action has a visible accessible download icon", () => {
  const button = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "components", "DownloadButton.tsx"),
    "utf8",
  );
  const card = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "components", "ArtCard.tsx"),
    "utf8",
  );
  assert.match(button, /iconOnly\?: boolean/);
  assert.match(button, /aria-label=.*Download artwork/);
  assert.match(button, /d="M12 3v12"/);
  assert.match(button, /d="m7 10 5 5 5-5"/);
  assert.match(card, /<DownloadButton[^>]*iconOnly/);
  assert.doesNotMatch(card, /text-\[0\]/);
});

test("navbar search expands on interaction with motion-safe transitions", () => {
  const navbar = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "components", "Navbar.tsx"),
    "utf8",
  );
  assert.match(navbar, /lg:max-w-\[300px\]/);
  assert.match(navbar, /lg:max-w-\[390px\]/);
  assert.match(navbar, /transition-\[max-width\]/);
  assert.match(navbar, /data-search-active/);
});

test("featured art uses its original image and shows only the character name", () => {
  assert.match(source, /art\.orig_url\s*\|\|\s*\(art\.orig\s*\?\s*`\/api\/img\/\$\{art\.orig\}`/);
  assert.match(source, /quality=\{9[0-9]\}/);
  assert.match(source, /\{a\.character_name\s*\|\|\s*"Featured artwork"\}/);
  assert.doesNotMatch(source, /AniPins archive \/ \{a\.category/);
  assert.doesNotMatch(source, /\{a\.anime_name\}/);
});

test("artwork feed previews do not reveal names before the artwork is opened", () => {
  const card = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "components", "ArtCard.tsx"),
    "utf8",
  );
  assert.doesNotMatch(card, /<p[^>]*>\{art\.character_name\}<\/p>/);
  assert.doesNotMatch(card, /<p[^>]*>\{art\.anime_name\}<\/p>/);
});

test("home Explore introduction is concise", () => {
  const home = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "app", "page.tsx"),
    "utf8",
  );
  assert.match(home, /Explore anime artwork, save inspiration, and discover your next favorite\./);
});
