const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "Intro.tsx"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "src", "app", "globals.css"), "utf8");

test("the AniPins opening uses a compact brand lockup and a slow, readable reveal", () => {
  assert.match(source, /ap-symbol-intro\.png/);
  assert.match(source, /className="intro-logo-mark"/);
  assert.match(source, /intro-splash__lockup/);
  assert.match(source, /intro-splash__wordmark/);
  assert.match(source, /intro-splash__tagline/);
  assert.match(source, /INTRO_DURATION_MS = 3200/);
  assert.match(source, /REDUCED_MOTION_INTRO_DURATION_MS = 900/);
  assert.doesNotMatch(source, /intro-splash__piece/);
  assert.doesNotMatch(source, /framer-motion|logoFragments|CinematicIntroScene/);
  assert.match(source, /prefers-reduced-motion/);
  assert.doesNotMatch(source, /INTRO_SEEN_KEY|localStorage|sessionStorage/);
  assert.match(source, /const duration = reducedMotion \? REDUCED_MOTION_INTRO_DURATION_MS : INTRO_DURATION_MS/);
});

test("the AniPins intro fades the mark, then letters left-to-right without a shine effect", () => {
  assert.doesNotMatch(styles, /\.intro-splash::before|\.intro-splash::after|intro-splash__orbit|intro-splash__halo|intro-splash__piece/);
  assert.match(styles, /\.intro-splash__lockup\s*\{[^}]*display:\s*flex/);
  assert.match(styles, /intro-mark-fade-in/);
  assert.match(styles, /intro-letter-fade-in/);
  assert.doesNotMatch(styles, /glint|shine/);
  assert.match(styles, /intro-tagline-arrive/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[^\n]*\.intro-splash \* \{ animation: none !important;/);
});

test("reduced-motion users still see the complete logo and tagline immediately", () => {
  const reducedMotion = styles.match(/@media \(prefers-reduced-motion: reduce\)[^\n]*/)?.[0] || "";
  assert.match(reducedMotion, /\.intro-splash__wordmark\s*\{[^}]*opacity:\s*1/);
  assert.match(reducedMotion, /\.intro-splash__tagline\s*\{[^}]*opacity:\s*\.82/);
  assert.match(reducedMotion, /\.intro-splash__letter\s*\{[^}]*opacity:\s*1/);
});

test("the normal-motion splash staggers the wordmark letters after the logo fade", () => {
  assert.match(source, /\[\.\.\."AniPins"\]\.map/);
  assert.match(styles, /\.intro-splash__letter\s*\{[^}]*opacity:\s*0/);
  assert.match(styles, /animation-delay:\s*calc\(\.68s \+ var\(--letter-index\) \* \.065s\)/);
  assert.doesNotMatch(styles, /intro-wordmark-glint|intro-wordmark-reveal/);
});

test("the mobile intro mark stays proportionate and the reveal uses a smooth paced sweep", () => {
  assert.match(styles, /@media \(max-width: 380px\)[^\n]*\.intro-logo-mark \{ width: [4-9](?:\.\d+)?rem;/);
  assert.match(styles, /intro-letter-fade-in \.42s cubic-bezier\(/);
  assert.match(styles, /intro-mark-fade-in \.62s cubic-bezier\(/);
});
