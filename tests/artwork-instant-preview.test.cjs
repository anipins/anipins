const test = require("node:test");
const assert = require("node:assert/strict");
const { makeArtworkPreview, preserveArtworkPreview } = require("../src/lib/artwork-preview.js");

test("opening a feed card reuses its already-decoded thumbnail instead of an expiring feed URL", () => {
  const card = { id: 41, thumb_url: "/api/img/t/41.webp?expired=1" };
  const preview = makeArtworkPreview(card, {
    currentSrc: "/_next/image?url=%2Fapi%2Fimg%2Ft%2F41.webp&cached=1",
    src: "/api/img/t/41.webp?expired=1",
  });

  assert.equal(preview.thumb_url, "/_next/image?url=%2Fapi%2Fimg%2Ft%2F41.webp&cached=1");
  assert.equal(card.thumb_url, "/api/img/t/41.webp?expired=1", "the feed's original data stays untouched");
});

test("fresh artwork details retain the clicked card preview while the original loads", () => {
  const detail = { id: 41, title: "Fresh title", thumb_url: "/api/img/t/41.webp?fresh=2", orig_url: "/api/img/o/41.jpg" };
  const preview = { id: 41, thumb_url: "/_next/image?url=%2Fapi%2Fimg%2Ft%2F41.webp&cached=1" };
  const merged = preserveArtworkPreview(detail, preview);

  assert.equal(merged.title, "Fresh title");
  assert.equal(merged.orig_url, "/api/img/o/41.jpg");
  assert.equal(merged.thumb_url, preview.thumb_url);
  assert.equal(preserveArtworkPreview(detail, { id: 42, thumb_url: "/wrong.webp" }), detail, "a different pin must not reuse this preview");
});
