const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const layout = fs.readFileSync(path.join(root, "src", "app", "admin", "layout.tsx"), "utf8");

test("admin permission is decided on the server before the mobile dashboard hydrates", () => {
  assert.doesNotMatch(layout, /^"use client";/);
  assert.match(layout, /await getUser\(\)/);
  assert.match(layout, /redirect\("\/login"\)/);
});

test("the mobile admin shell does not request dashboard statistics a second time", () => {
  const shell = fs.readFileSync(path.join(root, "src", "app", "admin", "AdminShell.tsx"), "utf8");
  assert.match(shell, /min-width: 768px/);
  assert.match(shell, /requestIdleCallback/);
});
