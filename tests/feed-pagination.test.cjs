const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { shouldLoadFromFeedSignal } = require("../src/lib/feed-pagination");

test("requires a new visitor scroll gesture after the initial short-feed fill", () => {
  assert.equal(shouldLoadFromFeedSignal({ armed: false, canPrime: false }), false);
  assert.equal(shouldLoadFromFeedSignal({ armed: false, canPrime: true }), true);
  assert.equal(shouldLoadFromFeedSignal({ armed: true, canPrime: false }), true);
});

test("masonry feed arms pagination when the viewport moves via scrollbar", () => {
  const source = fs.readFileSync(require("node:path").join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(source, /const armFromScroll = \(\) => \{/);
  assert.match(source, /window\.addEventListener\("scroll", armFromScroll, \{ passive: true \}\)/);
  assert.match(source, /window\.removeEventListener\("scroll", armFromScroll\)/);
});
