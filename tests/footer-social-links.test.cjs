const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "Footer.tsx"), "utf8");

test("footer keeps policy and account links out of the footer display", () => {
  assert.doesNotMatch(source, /const settingsLinks|settingsLinks\.map|Settings and information/);
  assert.doesNotMatch(source, /Browse|All artwork|Characters|AniPins Premium|href="\/explore"/);
});

test("footer centers working social links for the provided accounts", () => {
  for (const url of ["https://x.com/anipinsart", "https://www.instagram.com/anipins.verse", "https://pin.it/73R2HnARL"]) {
    assert.ok(source.includes(url), `missing ${url}`);
  }
  assert.match(source, /label: "X \(AniPins\)"/);
  assert.match(source, /label: "Instagram \(AniPins Verse\)"/);
  assert.match(source, /label: "Pinterest \(AniPins\)"/);
  assert.match(source, /aria-label=\{label\}/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /justify-center/);
  assert.match(source, /fill="none"/);
  assert.match(source, /justify-self-center/);
});

test("mobile footer reserves space above the fixed app navigation", () => {
  assert.match(source, /pb-\[calc\(7rem\+env\(safe-area-inset-bottom\)\)\]/);
});

test("settings page provides all information and account links", () => {
  const settings = fs.readFileSync(path.join(__dirname, "..", "src", "app", "settings", "page.tsx"), "utf8");
  for (const [label, href] of [
    ["About", "/about"],
    ["Help & Support", "/support"],
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["Copyright / Takedown", "/copyright"],
    ["Delete account", "/delete-account"],
  ]) {
    assert.ok(settings.includes(`"${label}"`), `Settings should link to ${label}`);
    assert.ok(settings.includes(`"${href}"`), `Settings should route ${label} to ${href}`);
  }
});
