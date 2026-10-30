const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { profileImageSource, profileMediaCleanupKeys } = require("../src/lib/profile-media.mjs");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("profile photos render both uploaded media keys and trusted Google profile URLs", () => {
  assert.equal(profileImageSource("avatars/42-abcd.webp"), "/api/img/avatars/42-abcd.webp");
  assert.equal(profileImageSource("https://lh3.googleusercontent.com/a/profile"), "https://lh3.googleusercontent.com/a/profile");
  assert.equal(profileImageSource("https://untrusted.example/avatar.png"), "");
});

test("profile replacement queues only safe previous media keys for cleanup", () => {
  assert.deepEqual(profileMediaCleanupKeys([
    "avatars/42-old.webp",
    "https://lh3.googleusercontent.com/a/profile",
    "",
    "covers/42-old.webp",
  ]), ["avatars/42-old.webp", "covers/42-old.webp"]);
  const route = read("src/app/api/profile/route.ts");
  assert.match(route, /profileMediaCleanupKeys\(\[previousAvatar\]\)/);
  assert.match(route, /profileMediaCleanupKeys\(\[previousCover\]\)/);
  assert.doesNotMatch(route, /cleanup\.push\(\{ key: next(?:Avatar|Cover)/);
});
