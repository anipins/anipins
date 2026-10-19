const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const page = readFileSync(join(__dirname, "../src/app/admin/security/page.tsx"), "utf8");

test("authenticator setup reauthenticates with the linked Google account", () => {
  const route = readFileSync(join(__dirname, "../src/app/api/admin/security/route.ts"), "utf8");

  assert.match(page, /import GoogleSignInButton from "@\/components\/GoogleSignInButton"/);
  assert.match(page, /credentialOnly/);
  assert.match(page, /action:"begin-google",credential/);
  assert.match(page, /Replace authenticator/);
  assert.match(page, /reauthEntry\?[\s\S]*data\.twoFactorEnabled\?/);
  assert.doesNotMatch(page, /aria-label="Administrator password"/);
  assert.match(route, /verifyGoogleCredential\(/);
  assert.match(route, /better_auth_user_link/);
  assert.match(route, /better_auth_account/);
  assert.match(route, /accountId=\?/);
});
