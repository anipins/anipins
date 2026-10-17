const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("PostgreSQL connections verify server certificates by default", () => {
  const source = fs.readFileSync(path.join(root, "src/lib/db.ts"), "utf8");
  assert.match(source, /rejectUnauthorized:\s*true/);
});

test("PostgreSQL sessions are protected from API roles", () => {
  const source = fs.readFileSync(path.join(root, "src/lib/pgschema.ts"), "utf8");
  assert.match(source, /ALTER TABLE public\.sessions ENABLE ROW LEVEL SECURITY/);
  assert.match(source, /REVOKE ALL ON TABLE public\.sessions FROM anon, authenticated/);
});

test("PostgreSQL mobile sign-in tickets are protected when the table is created", () => {
  const source = fs.readFileSync(path.join(root, "src/app/api/auth/mobile-ticket/route.ts"), "utf8");
  assert.match(source, /ALTER TABLE public\.mobile_auth_tickets ENABLE ROW LEVEL SECURITY/);
  assert.match(source, /REVOKE ALL ON TABLE public\.mobile_auth_tickets FROM anon, authenticated/);
});
