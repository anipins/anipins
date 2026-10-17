const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("Premium preview lookup does not block the initial sales page render", () => {
  const page = read("src/app/premium/page.tsx");
  const previews = read("src/components/PremiumPreviews.tsx");
  const endpoint = read("src/app/api/premium-preview/route.ts");

  assert.doesNotMatch(page, /await getPremiumPreviewCards/);
  assert.match(page, /<PremiumPreviews\s*\/>/);
  assert.match(previews, /fetch\("\/api\/premium-preview"/);
  assert.match(previews, /loading="lazy"/);
  assert.match(endpoint, /getPremiumPreviewCards\(3\)/);
});

test("public artwork lookup is request-memoized when metadata and page render ask for it", () => {
  const content = read("src/lib/content.ts");
  assert.match(content, /import \{ cache \} from "react"/);
  assert.match(content, /const getArtworkForRender = cache\(/);
  assert.match(content, /export function getArtwork\(id: number\)/);
});

test("artwork detail paints before the independently paginated related feed", () => {
  const content = read("src/lib/content.ts");
  const page = read("src/app/a/[id]/page.tsx");
  const route = read("src/app/api/artworks/[id]/route.ts");

  assert.match(content, /ARTWORK_DETAIL_PRELOAD_COUNT\s*=\s*14/);
  assert.match(content, /compact\?: boolean/);
  assert.doesNotMatch(page, /getArtworkCards/);
  assert.match(page, /related: \[\]/);
  assert.match(read("src/components/ArtworkDetailClient.tsx"), /<MasonryFeed[\s\S]*initialItems=\{data\?\.related \?\? \[\]\}/);
  assert.match(route, /RELATED_ARTWORK_INITIAL_COUNT/);
  assert.match(route, /LIMIT \?/);
});
