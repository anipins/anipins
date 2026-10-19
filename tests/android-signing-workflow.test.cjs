const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflow = fs.readFileSync(
  path.join(__dirname, "../.github/workflows/build-anipins-android.yml"),
  "utf8",
);

test("Android release CI signs through the existing Supabase OIDC signer without importing its private key", () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /audience=anipins-apk-signer/);
  assert.match(workflow, /functions\/v1\/anipins-apk-signer/);
  assert.match(workflow, /Sign release with existing private Supabase signer[\s\S]*?working-directory: \./);
  assert.doesNotMatch(workflow, /ANIPINS_UPLOAD_KEYSTORE_(?:BASE64|PASSWORD)/);
});

test("Android release CI only publishes an APK whose signature matches the current website download", () => {
  assert.match(workflow, /verify --print-certs/);
  assert.match(workflow, /AniPins-2\.5\.21\.apk/);
  assert.match(workflow, /certificate.*match|match.*certificate/i);
  assert.match(workflow, /AniPins-Android-2\.5\.22-\$\{\{ github\.run_number \}\}/);
  assert.doesNotMatch(workflow, /app-release-unsigned\.apk\s*$/m);
});
