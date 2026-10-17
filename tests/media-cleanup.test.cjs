const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../src/lib/media-cleanup.ts");
const source = fs.readFileSync(filename, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const { drainMediaCleanupQueue } = loaded.exports;
const readProjectFile = relative => fs.readFileSync(path.resolve(__dirname, "..", relative), "utf8");

test("media cleanup leaves referenced objects queued and never deletes them", async () => {
  const deleted = [];
  const removed = [];

  const result = await drainMediaCleanupQueue(
    [{ key: "o/current.webp", premium: false }, { key: "o/old.webp", premium: false }],
    {
      isReferenced: async ({ key }) => key === "o/current.webp",
      deleteObject: async ({ key }) => deleted.push(key),
      removeFromQueue: async ({ key }) => removed.push(key),
    },
  );

  assert.deepEqual(deleted, ["o/old.webp"]);
  assert.deepEqual(removed, ["o/current.webp", "o/old.webp"]);
  assert.deepEqual(result, { deleted: 1, pending: 0, stillReferenced: 1 });
});

test("media cleanup keeps a failed storage deletion queued for retry", async () => {
  const removed = [];
  const result = await drainMediaCleanupQueue(
    [{ key: "t/retry.webp", premium: true }],
    {
      isReferenced: async () => false,
      deleteObject: async () => { throw new Error("storage unavailable"); },
      removeFromQueue: async ({ key }) => removed.push(key),
    },
  );

  assert.deepEqual(removed, []);
  assert.deepEqual(result, { deleted: 0, pending: 1, stillReferenced: 0 });
});

test("SQLite and Postgres setup both create the durable cleanup queue", () => {
  assert.match(readProjectFile("scripts/schema.sql"), /CREATE TABLE IF NOT EXISTS media_cleanup_queue/);
  assert.match(readProjectFile("src/lib/pgschema.ts"), /CREATE TABLE IF NOT EXISTS media_cleanup_queue/);
});

test("artwork and profile mutations enqueue media before changing database references", () => {
  const artwork = readProjectFile("src/app/api/admin/artworks/[id]/route.ts");
  const profile = readProjectFile("src/app/api/profile/route.ts");
  const bulk = readProjectFile("src/app/api/admin/bulk/route.ts");

  assert.ok(artwork.indexOf("enqueueMediaCleanup(cleanup)") < artwork.indexOf("UPDATE artworks SET"));
  assert.ok(artwork.indexOf("enqueueMediaCleanup([") < artwork.indexOf('DELETE FROM saves'));
  assert.ok(profile.indexOf("enqueueMediaCleanup(cleanup)") < profile.indexOf("UPDATE users SET"));
  assert.ok(bulk.indexOf("enqueueMediaCleanup(arts.flatMap") < bulk.indexOf('DELETE FROM saves'));
  assert.match(readProjectFile("src/app/api/admin/media-cleanup/route.ts"), /processMediaCleanupQueue/);
});
