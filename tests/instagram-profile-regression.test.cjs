const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const read = relative => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("every public and app Instagram entry point targets AniPins Verse", () => {
  const link = read("src/components/InstagramLink.tsx");
  const footer = read("src/components/Footer.tsx");
  const navbar = read("src/components/Navbar.tsx");
  const artwork = read("src/components/ArtworkDetailClient.tsx");
  const support = read("src/app/support/page.tsx");
  const settingsApi = read("src/app/api/settings/route.ts");
  const schema = read("src/lib/pgschema.ts");
  const android = fs.readFileSync(path.join(__dirname, "..", "mobile", "app", "src", "main", "java", "com", "anipins", "app", "MainActivity.java"), "utf8");

  assert.match(link, /INSTAGRAM_WEB_URL = "https:\/\/www\.instagram\.com\/anipins\.verse\//);
  assert.match(link, /INSTAGRAM_APP_URL = "instagram:\/\/user\?username=anipins\.verse"/);
  assert.match(footer, /https:\/\/www\.instagram\.com\/anipins\.verse/);
  assert.match(navbar, /Instagram — @anipins\.verse/);
  assert.match(artwork, /title="@anipins\.verse"/);
  assert.match(support, /@anipins\.verse on Instagram/);
  assert.doesNotMatch(settingsApi, /UPDATE settings/);
  assert.match(schema, /'@anipins\.verse'/);
  assert.match(android, /instagram\.com\/anipins\.verse\//);
  assert.match(android, /https:\/\/www\.instagram\.com\/anipins\.verse\//);

  for (const source of [link, footer, navbar, artwork, support, schema, android]) {
    assert.doesNotMatch(source, /(?:instagram\.com\/(?:_u\/)?_?anipins\.art|username=anipins\.art|@anipins\.art)/);
  }
});
