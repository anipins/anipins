const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("same-origin Worker uploads only require the signed content type header", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "app", "admin", "upload", "page.tsx"), "utf8");
  const signing = fs.readFileSync(path.join(__dirname, "..", "src", "lib", "media.ts"), "utf8");
  const worker = fs.readFileSync(path.join(__dirname, "..", "cloudflare", "worker.mjs"), "utf8");

  assert.match(source, /method:\s*"PUT",\s*headers:\s*\{\s*"Content-Type":\s*item\.file\.type\s*\}/s);
  assert.match(signing, /\/api\/storage-upload\?key=/);
  assert.match(worker, /ARTWORKS_PREMIUM/);
  assert.match(worker, /bucket\.put\(upload\.key, request\.body/);
  assert.match(worker, /streaming body without a\s*\/\/ Content-Length header/s);
  assert.doesNotMatch(source, /"x-upsert"/);
  assert.doesNotMatch(source, /"Cache-Control":\s*"public, max-age=31536000, immutable"/);
});
