const test = require("node:test");
const assert = require("node:assert/strict");
const { decodeArtworkCursor, encodeArtworkCursor } = require("../src/lib/artwork-cursor");

test("artwork cursors preserve the exact latest-feed boundary", () => {
  const boundary = { createdAt: "2026-10-08T08:00:00.123Z", id: 1812 };
  assert.deepEqual(decodeArtworkCursor(encodeArtworkCursor(boundary)), boundary);
});

test("invalid artwork cursors are rejected instead of restarting a later page", () => {
  assert.equal(decodeArtworkCursor("not-a-cursor"), null);
  assert.equal(decodeArtworkCursor(encodeArtworkCursor({ createdAt: "", id: 0 })), null);
});

test("a new upload above the boundary does not displace older artwork", () => {
  const boundary = { createdAt: "2026-10-08T08:00:00.000Z", id: 1812 };
  const libraryAfterUpload = [
    { id: 1848, createdAt: "2026-10-08T08:01:00.000Z" },
    { id: 1812, createdAt: "2026-10-08T08:00:00.000Z" },
    { id: 1811, createdAt: "2026-10-08T07:59:00.000Z" },
    { id: 1810, createdAt: "2026-10-08T07:58:00.000Z" },
  ];
  const nextPage = libraryAfterUpload.filter(item => item.createdAt < boundary.createdAt || (item.createdAt === boundary.createdAt && item.id < boundary.id));
  assert.deepEqual(nextPage.map(item => item.id), [1811, 1810]);
});
