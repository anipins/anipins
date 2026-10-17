const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const sourceSchema = fs.readFileSync(path.join(projectRoot, "scripts/schema.sql"), "utf8");
const migrationDir = path.join(projectRoot, "migrations/d1");
const d1Migrations = fs.readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => fs.readFileSync(path.join(migrationDir, file), "utf8"))
  .join("\n");

test("D1 migrations include every table in AniPins' current application schema", () => {
  const sourceTables = [...sourceSchema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/gi)]
    .map((match) => match[1].toLowerCase());
  const migratedTables = new Set(
    [...d1Migrations.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/gi)]
      .map((match) => match[1].toLowerCase()),
  );
  const missingTables = sourceTables.filter((table) => !migratedTables.has(table));

  assert.deepEqual(missingTables, []);
});

test("D1 migration provisions one-time mobile auth tickets without runtime DDL", () => {
  assert.match(d1Migrations, /CREATE TABLE IF NOT EXISTS mobile_auth_tickets\s*\([\s\S]*?code_hash TEXT PRIMARY KEY[\s\S]*?used_at INTEGER[\s\S]*?\)/i);
  assert.match(d1Migrations, /idx_mobile_auth_tickets_expiry/);
});

test("D1 migration includes the source-only build chunk table", () => {
  assert.match(d1Migrations, /CREATE TABLE IF NOT EXISTS anipins_build_chunks\s*\([\s\S]*?build_name TEXT[\s\S]*?chunk_index INTEGER[\s\S]*?chunk_data TEXT/i);
});
