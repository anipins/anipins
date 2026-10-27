const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../src/lib/session-tokens.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const { sessionStorageToken, sessionTokenMatches } = loaded.exports;

test("D1 session tokens are stored as SHA-256 digests, with compatibility for legacy rows", () => {
  const token = "a".repeat(64);
  const digest = sessionStorageToken(token);
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.notEqual(digest, token);
  assert.equal(sessionStorageToken(token), digest);
  assert.equal(sessionTokenMatches(digest, token), true);
  assert.equal(sessionTokenMatches(token, token), true);
  assert.equal(sessionTokenMatches("b".repeat(64), token), false);
});
