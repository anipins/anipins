const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("live application code has no Supabase storage or database fallback", () => {
  const files = [
    "src/lib/media.ts",
    "src/app/api/setup/route.ts",
    "src/app/api/admin/upload/sign/route.ts",
    "src/app/api/img/[...p]/route.ts",
    "src/app/api/premium-preview/[id]/route.ts",
    "src/app/api/artworks/[id]/download/route.ts",
    "src/app/downloads/[filename]/route.ts",
    "cloudflare/worker.mjs",
    "cloudflare/container-runtime-env.mjs",
  ];
  for (const file of files) assert.doesNotMatch(read(file), /supabase|SUPABASE/i, file);
  assert.match(read("src/app/api/premium-preview/[id]/route.ts"), /r2Get\(key, true\)/, "Premium previews must load from the Premium R2 bucket");
});

test("Android signing uses the existing OIDC-protected signer without storing its key in GitHub", () => {
  const workflow = read(".github/workflows/build-anipins-android.yml");
  assert.match(workflow, /audience=anipins-apk-signer/);
  assert.ok(workflow.includes("functions/v1/anipins-apk-signer"));
  assert.doesNotMatch(workflow, /secrets\.ANIPINS_UPLOAD_KEYSTORE_/);
  assert.match(workflow, /apksigner.*verify/);
});
