const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const deletionRoute = fs.readFileSync(path.join(root, "src/app/api/account/route.ts"), "utf8");
const billing = fs.readFileSync(path.join(root, "src/lib/billing.ts"), "utf8");
const privacy = fs.readFileSync(path.join(root, "src/app/privacy/page.tsx"), "utf8");

test("account deletion cancels renewal before removing the user and keeps billing history", () => {
  assert.match(deletionRoute, /cancelSubscriptionForAccountDeletion/);
  const cancelPosition = deletionRoute.indexOf("cancelSubscriptionForAccountDeletion(user.id)");
  const firstDeletePosition = deletionRoute.indexOf('await run("DELETE FROM push_devices');
  assert.ok(cancelPosition >= 0 && firstDeletePosition > cancelPosition, "subscription cancellation must complete before account data is deleted");
  assert.doesNotMatch(deletionRoute, /DELETE FROM billing_subscriptions/);
  assert.match(billing, /export async function cancelSubscriptionForAccountDeletion/);
  assert.match(billing, /cancel_at_cycle_end/);
});

test("privacy policy explains Premium cancellation and limited retained billing records", () => {
  assert.match(privacy, /cancel.{0,100}(Premium|subscription)/i);
  assert.match(privacy, /billing transaction and subscription records/i);
  assert.match(privacy, /receipts, refunds, charge disputes, accounting, tax or other legal requirements/i);
});
