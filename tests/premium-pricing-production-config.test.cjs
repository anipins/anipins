const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("live pricing deploy config routes AniPins to the production D1-backed Worker", () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, "wrangler.approved-prod.jsonc"), "utf8"));
  assert.equal(config.name, "anipins-staging");
  assert.ok(config.routes.some(route => route.pattern === "anipins.com/*"));
  assert.ok(config.routes.some(route => route.pattern === "www.anipins.com/*"));
  assert.deepEqual(config.d1_databases.map(binding => [binding.binding, binding.database_name]), [["DB", "anipins-production-db"]]);
  assert.ok(config.containers.some(container => container.class_name === "AniPinsContainer"));
  assert.deepEqual(config.exports.AniPinsContainer, { type: "durable-object", storage: "sqlite" });
});

test("the Worker forwards optional price-specific plan IDs into the app container", () => {
  const worker = fs.readFileSync(path.join(root, "cloudflare/worker.mjs"), "utf8");
  for (const key of [
    "RAZORPAY_PREMIUM_PLAN_ID_99_WEEKLY",
    "RAZORPAY_PREMIUM_PLAN_ID_199_MONTHLY",
    "RAZORPAY_PREMIUM_PLAN_ID_1999_YEARLY",
  ]) assert.match(worker, new RegExp(`\\"${key}\\"`));
  assert.match(worker, /CONTAINER_BOOT_VERSION = "[0-9]{4}-[0-9]{2}-[0-9]{2}-.+"/);
});
