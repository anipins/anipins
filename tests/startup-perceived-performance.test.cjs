const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = relative => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("the AniPins wordmark reveal follows the reference pacing and keeps its mark prioritized", () => {
  const intro = read("src/components/Intro.tsx");
  assert.match(intro, /const INTRO_DURATION_MS = 3200/);
  assert.match(intro, /const REDUCED_MOTION_INTRO_DURATION_MS = 900/);
  assert.doesNotMatch(intro, /INTRO_SEEN_KEY|localStorage|sessionStorage/);
  assert.match(intro, /const duration = reducedMotion \? REDUCED_MOTION_INTRO_DURATION_MS : INTRO_DURATION_MS/);
  assert.match(intro, /duration - EXIT_FADE_MS/);
  assert.match(intro, /className="intro-logo-mark/);
  assert.match(intro, /intro-splash__wordmark/);
  assert.match(intro, /intro-splash__tagline/);
  assert.doesNotMatch(intro, /intro-splash__piece/);
  assert.match(intro, /ap-symbol-intro\.png\?v=gold-20261016/);
});

test("route changes do not wait on a decorative fade before rendering their destination", () => {
  const template = read("src/app/template.tsx");
  assert.doesNotMatch(template, /framer-motion|transition=\{\{\s*duration:\s*0\.4/);
  assert.match(template, /return children/);
  const loading = read("src/app/loading.tsx");
  assert.match(loading, /role="status"/);
  assert.match(loading, /aria-label="Loading page"/);
  assert.match(loading, /skeleton/);
});

test("the browser can discover and prioritize the single intro mark before hydration", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /rel="preload"[^>]+as="image"[^>]+ap-symbol-intro\.png\?v=gold-20261016/);
});
