const test = require("node:test");
const assert = require("node:assert/strict");
const { mobileNavItems } = require("../src/lib/mobile-nav-utils");

test("the compact mobile dock keeps the four most useful destinations", () => {
  assert.deepEqual(
    mobileNavItems().map((item) => item.href),
    ["/", "/search", "/saves", "/profile"],
  );
});

test("the compact mobile dock is icon-only but remains accessible", () => {
  assert.equal(mobileNavItems().every((item) => item.label && !item.showLabel), true);
});
