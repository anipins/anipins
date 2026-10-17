const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../src/components/ArtLightbox.tsx"), "utf8");

test("desktop detail and recommendations render as one full-width Pinterest masonry stream", () => {
  const compositionStart = source.indexOf('<section aria-label="Artwork and more to explore"');
  const compositionEnd = source.indexOf('<section className="border-t border-paper/10 p-5 md:col-span-2 md:p-8 xl:hidden">', compositionStart);
  const desktop = source.slice(compositionStart, compositionEnd);
  assert.match(desktop, /<MasonryFeed[\s\S]*pinterestLayout=/, "the pin and related artwork should share one masonry feed and one pagination state");
  assert.equal((desktop.match(/<MasonryFeed/g) || []).length, 1, "desktop must not split the rail and bottom into separate loaders");
  assert.match(desktop, /mainColumnCount: 4/, "the pin should use four columns with two related columns beside it");
  assert.match(desktop, /sideItemCount: 8/, "the initial right rail should contain eight artworks");
  assert.match(desktop, /initialMainItemCount: 6/, "the same initial stream should continue with six artworks below the pin");
  assert.doesNotMatch(desktop, /<aside aria-label="More artwork to explore"/, "the right rail must not be a separate finite list");
});

test("the related rail and bottom feed share one details payload and one loading message", () => {
  const start = source.indexOf('<section aria-label="Artwork and more to explore"');
  const desktop = source.slice(start, source.indexOf('<section className="border-t border-paper/10 p-5 md:col-span-2 md:p-8 xl:hidden">', start));
  assert.match(desktop, /initialHasMore/);
  assert.match(desktop, /imagePriority=\{false\}/);
});

test("the unified masonry balances continuation cards across all six columns", () => {
  const { distributePinterestFeed } = require("../src/lib/pinterest-feed-layout.js");
  const cards = Array.from({ length: 50 }, (_, id) => ({ id, width: 800, height: 1200 }));
  const layout = distributePinterestFeed(cards, { totalColumns: 6, mainColumnCount: 4, sideItemCount: 8, initialMainItemCount: 6, leadingHeight: 2.6 });
  assert.equal(layout.sideColumns.flat().length + layout.mainColumns.flat().length, 50, "one feed must distribute every initial and paginated artwork exactly once");
  assert.ok(layout.sideColumns.every(column => column.length > 4), "new pages must keep both right columns loading");
  assert.ok(layout.mainColumns.every(column => column.length > 1), "the bottom feed should keep all four main columns filled");
  const heights = [...layout.mainHeights, ...layout.sideHeights];
  assert.ok(Math.max(...heights) - Math.min(...heights) < 1.6, "the six masonry stacks should stay visually balanced");
});

test("horizontal feed swipes do not hijack scrolling in the lightbox container", () => {
  assert.doesNotMatch(source, /className="fixed inset-0[\s\S]{0,300}onTouchStart/);
});

test("switching artwork reuses the detail panel instead of replaying its large-image entrance animation", () => {
  const panelStart = source.indexOf('<motion.div ref={panel}');
  const panelEnd = source.indexOf('className="min-h-full w-full max-w-none', panelStart);
  const panel = source.slice(panelStart, panelEnd);
  assert.doesNotMatch(panel, /key=\{id\}/, "a new key leaves the previous large image mounted during its exit animation");
  assert.doesNotMatch(panel, /initial=\{\{\s*scale:/, "switching pins must not replay a scale/fade that hides the selected artwork");
});

test("only the viewport-visible recommendation layout owns pagination scroll listeners", () => {
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/MasonryFeed.tsx"), "utf8");
  assert.match(feed, /layout === "desktop" \? "\(min-width: 1280px\)" : "\(max-width: 1279px\)"/);
  assert.match(feed, /if \(!activeLayout\) return;[\s\S]*addEventListener\("wheel"/);
  assert.match(source, /layout="desktop"/);
  assert.match(source, /layout="mobile"/);
});
