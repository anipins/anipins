const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const login = fs.readFileSync(path.join(root, "mobile/app/src/main/java/com/anipins/app/LoginActivity.java"), "utf8");
const api = fs.readFileSync(path.join(root, "mobile/app/src/main/java/com/anipins/app/ApiClient.java"), "utf8");
const vault = fs.readFileSync(path.join(root, "mobile/app/src/main/java/com/anipins/app/SessionVault.java"), "utf8");

test("native Android email sign-in and registration use Better Auth", () => {
  assert.match(login, /\/api\/better-auth\/sign-in\/email/);
  assert.match(login, /\/api\/better-auth\/sign-up\/email/);
  assert.doesNotMatch(login, /endpoint\s*=\s*register\s*\?\s*"\/api\/auth\/register"\s*:\s*"\/api\/auth\/login"/);
});

test("native Android Google sign-in uses Better Auth ID-token exchange", () => {
  assert.match(login, /\/api\/better-auth\/sign-in\/social/);
  assert.match(login, /"provider"\s*,\s*"google"/);
  assert.match(login, /"idToken"/);
});

test("native session vault retains Better Auth and admin MFA cookies returned by the server", () => {
  assert.match(api, /getHeaderFields\(\)/);
  assert.match(api, /anipins_better_auth/);
  assert.match(api, /anipins_admin_mfa/);
  assert.match(api, /session\.save\(result\.toString\(\)\)/);
  assert.match(vault, /AES\/GCM\/NoPadding/);
});
