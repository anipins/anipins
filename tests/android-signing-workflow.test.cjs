const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflow = fs.readFileSync(
  path.join(__dirname, "../.github/workflows/build-anipins-android.yml"),
  "utf8",
);
const signerPackage = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../scripts/android-signer/package.json"),
  "utf8",
));

test("Android release CI signs locally using encrypted GitHub secrets, not Supabase", () => {
  assert.doesNotMatch(workflow, /id-token:\s*write|ACTIONS_ID_TOKEN_REQUEST|supabase\.co|functions\/v1\/anipins-apk-signer/i);
  assert.match(workflow, /secrets\.ANIPINS_SIGNING_KEY_DATA/);
  assert.match(workflow, /secrets\.ANIPINS_SIGNING_PASSWORD/);
  assert.match(workflow, /scripts\/sign-android-apk\.cjs/);
  assert.equal(signerPackage.dependencies["android-package-signer"], "0.2.1");
  assert.match(workflow, /npm ci --prefix scripts\/android-signer/);
  assert.match(workflow, /working-directory: \.|working-directory: \$\{\{ github\.workspace \}\}/);
  assert.doesNotMatch(workflow, /echo .*ANIPINS_SIGNING_(?:KEY_B64|PASSWORD)/);
  assert.match(workflow, /ANIPINS_SIGNING_(?:KEY_B64|PASSWORD)/);
});

test("Android release CI only publishes an APK whose signature matches the current website download", () => {
  assert.match(workflow, /verify --print-certs/);
  assert.match(workflow, /AniPins-2\.5\.21\.apk/);
  assert.match(workflow, /certificate.*match|match.*certificate/i);
  assert.match(workflow, /AniPins-Android-2\.5\.22-\$\{\{ github\.run_number \}\}/);
  assert.doesNotMatch(workflow, /app-release-unsigned\.apk\s*$/m);
});
