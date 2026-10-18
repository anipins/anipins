const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const stagingClientId = "903834125575-u9f1i64m3knfvoo1h309ruh8fiufcfh1.apps.googleusercontent.com";

test("migration staging uses one Google OAuth client across Worker and container config", () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, "wrangler.migration-staging.jsonc"), "utf8"));
  const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");

  assert.equal(config.name, "anipins-migration-staging");
  assert.equal(config.vars.GOOGLE_CLIENT_ID, stagingClientId);
  assert.equal(config.vars.BETTER_AUTH_GOOGLE_CLIENT_ID, stagingClientId);
  assert.equal(config.vars.NEXT_PUBLIC_GOOGLE_CLIENT_ID, stagingClientId);
  assert.equal(config.containers[0].images.base.build_vars.NEXT_PUBLIC_GOOGLE_CLIENT_ID, stagingClientId);
  assert.match(dockerfile, /^ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID$/m);
  assert.match(dockerfile, /^ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=\$\{NEXT_PUBLIC_GOOGLE_CLIENT_ID\}$/m);
});
