const test = require("node:test");
const assert = require("node:assert/strict");
const { isInstagramInAppBrowser } = require("../src/lib/in-app-browser");

test("Instagram's embedded browser is detected before loading checkout", () => {
  assert.equal(isInstagramInAppBrowser("Mozilla/5.0 (Linux; Android 14) Instagram 355.0.0.0.70 Android"), true);
  assert.equal(isInstagramInAppBrowser("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36"), false);
});
