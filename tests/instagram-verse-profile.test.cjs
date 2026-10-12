const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const link = "https://www.instagram.com/anipins.verse/";
const oldHandle = /(?:@anipins\.art|https:\/\/www\.instagram\.com\/anipins\.art\/|instagram:\/\/user\?username=anipins\.art)/;

test("Instagram link opens the stable anipins.verse profile and mobile native intent", () => {
  const source = read("src/components/InstagramLink.tsx");
  assert.ok(source.includes('INSTAGRAM_WEB_URL = "' + link + '"'));
  assert.ok(source.includes('INSTAGRAM_APP_URL = "instagram://user?username=anipins.verse"'));
  // The old APK bridge has the old profile hardcoded: never call it.
  assert.doesNotMatch(source, /nativeInstagram\(\)/);
  assert.ok(source.includes('window.location.href = "https://m.instagram.com/anipins.verse/"'));
  assert.ok(source.includes('? "https://m.instagram.com/anipins.verse/"'));
  assert.ok(source.includes(': INSTAGRAM_WEB_URL;'));
  assert.doesNotMatch(source, oldHandle);
});

test("visible website links and handle display are updated consistently", () => {
  const files = [
    "src/components/Footer.tsx",
    "src/components/Navbar.tsx",
    "src/components/ArtworkDetailClient.tsx",
    "src/app/support/page.tsx",
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, oldHandle, file);
    assert.match(source, /anipins\.verse/, file);
  }
  assert.match(read("src/components/ArtworkDetailClient.tsx"), /<InstagramLink/);
  assert.match(read("src/app/support/page.tsx"), /<InstagramLink/);
});

test("both Android entry points route Instagram actions to anipins.verse", () => {
  const files = [
    "mobile/app/src/main/java/com/anipins/app/MainActivity.java",
    "mobile/app/src/main/java/com/anipins/app/ArtworkActivity.java",
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /https:\/\/www\.instagram\.com\/anipins\.verse\//, file);
    assert.doesNotMatch(source, oldHandle, file);
  }
});

test("new database defaults and known-handle migration are aligned without replacing custom handles", () => {
  const schema = read("scripts/schema.sql");
  const settings = read("src/app/api/settings/route.ts");
  assert.ok(schema.includes("'instagram_handle','@anipins.verse'"));
  assert.ok(schema.includes("'instagram_url','" + link + "'"));
  assert.ok(settings.includes('"@anipins.verse"'));
  assert.ok(settings.includes('"' + link + '"'));
  assert.match(settings, /WHERE key='instagram_handle' AND value IN/);
  assert.match(settings, /WHERE key='instagram_url' AND value IN/);
});
