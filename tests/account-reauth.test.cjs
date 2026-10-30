const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../src/lib/account-reauth.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const { createGoogleReauthProof, verifyGoogleReauthProof } = loaded.exports;
const secret = "test-only-account-reauth-secret-32-bytes-minimum";

test("Google reauthentication proof is bound to one user and expires quickly", () => {
  const now = 1_800_000_000_000;
  const proof = createGoogleReauthProof(17, secret, now);
  assert.equal(verifyGoogleReauthProof(proof, 17, secret, now + 299_999), true);
  assert.equal(verifyGoogleReauthProof(proof, 18, secret, now), false);
  assert.equal(verifyGoogleReauthProof(proof, 17, secret, now + 300_000), false);
});

test("Google reauthentication proof rejects tampering and malformed values", () => {
  const proof = createGoogleReauthProof(17, secret, 1_800_000_000_000);
  assert.equal(verifyGoogleReauthProof(`${proof}x`, 17, secret, 1_800_000_000_000), false);
  assert.equal(verifyGoogleReauthProof("not-a-proof", 17, secret, 1_800_000_000_000), false);
});

test("Google account deletion requires a credential linked to the signed-in user", () => {
  const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/account/reauth/google/route.ts"), "utf8");
  assert.match(route, /provider_subject=\? AND user_id=\?/);
  assert.match(route, /createGoogleReauthProof\(user\.id/);
  const deletion = fs.readFileSync(path.resolve(__dirname, "../src/app/api/account/route.ts"), "utf8");
  assert.match(deletion, /verifyGoogleReauthProof\(proof, user\.id/);
  assert.match(deletion, /!passwordConfirmed && !googleConfirmed/);
});

test("Google sign-in uses a rounded click-to-start button without an auto-prompt", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../src/components/GoogleSignInButton.tsx"), "utf8");
  assert.match(source, /if \(credentialOnly\)[\s\S]*?onCredential\?\.\(credential\)/);
  assert.match(source, /shape: "pill"/);
  assert.doesNotMatch(source, /accounts\.id\.prompt\s*\(/);
});
