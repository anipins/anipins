const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migration = fs.readFileSync(path.resolve(__dirname, "../migrations/d1/0002_better_auth_tables.sql"), "utf8");
const identityLinkMigration = fs.readFileSync(path.resolve(__dirname, "../migrations/d1/0004_better_auth_business_user_link.sql"), "utf8");

test("Better Auth uses separate tables during staged identity cutover", () => {
  for (const table of ["better_auth_user", "better_auth_session", "better_auth_account", "better_auth_verification"]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }
  assert.match(migration, /better_auth_session[\s\S]*?REFERENCES better_auth_user\(id\) ON DELETE CASCADE/);
  assert.match(migration, /email TEXT NOT NULL UNIQUE/);
  assert.match(migration, /token TEXT NOT NULL UNIQUE/);
  assert.match(migration, /better_auth_account_provider_account_idx/);
});

test("staged Better Auth migration does not replace AniPins business identity tables", () => {
  assert.doesNotMatch(migration, /DROP TABLE|ALTER TABLE\s+(users|sessions)\b/i);
  assert.doesNotMatch(migration, /DELETE FROM\s+(users|sessions)\b/i);
});

test("Better Auth identity mapping keeps business IDs unique and cascades orphan links", () => {
  assert.match(identityLinkMigration, /auth_user_id TEXT PRIMARY KEY NOT NULL REFERENCES better_auth_user\(id\) ON DELETE CASCADE/);
  assert.match(identityLinkMigration, /anipins_user_id INTEGER NOT NULL UNIQUE REFERENCES users\(id\) ON DELETE CASCADE/);
});
