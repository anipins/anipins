const test = require("node:test");
const assert = require("node:assert/strict");
const { nativeRefreshUrl, shouldReloadDocumentForRefresh } = require("../src/lib/native-refresh");

test("Android WebView refreshes the document so a deployed gallery bundle is picked up", () => {
  assert.equal(shouldReloadDocumentForRefresh(true), true);
});

test("browser pull-to-refresh keeps the lightweight client refresh", () => {
  assert.equal(shouldReloadDocumentForRefresh(false), false);
});

test("native refresh adds a one-time cache-busting marker without changing the route", () => {
  assert.equal(nativeRefreshUrl("https://anipins.com/premium?filter=latest", 123), "https://anipins.com/premium?filter=latest&anipins_refresh=123");
});
