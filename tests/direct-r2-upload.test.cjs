const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("direct R2 browser uploads only require the signed content type header", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "app", "admin", "upload", "page.tsx"), "utf8");

  assert.match(source, /method:\s*"PUT",\s*headers:\s*\{\s*"Content-Type":\s*item\.file\.type\s*\}/s);
  assert.doesNotMatch(source, /"x-upsert"/);
  assert.doesNotMatch(source, /"Cache-Control":\s*"public, max-age=31536000, immutable"/);
});
