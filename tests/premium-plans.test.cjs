const test = require("node:test");
const assert = require("node:assert/strict");
const { PREMIUM_PLANS, getPremiumPlan } = require("../src/lib/premium-plans.js");

test("weekly, monthly, and yearly plans expose the requested INR recurring prices", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(PREMIUM_PLANS).map(([key, plan]) => [key, [plan.amount, plan.period, plan.interval]])),
    {
      weekly: [9900, "weekly", 1],
      monthly: [19900, "monthly", 1],
      yearly: [199900, "yearly", 1],
    },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(PREMIUM_PLANS).map(([key, plan]) => [key, plan.totalCount])),
    { weekly: 520, monthly: 120, yearly: 10 },
  );
});

test("plan lookup rejects unknown keys", () => {
  assert.equal(getPremiumPlan("lifetime"), null);
  assert.equal(getPremiumPlan("monthly").label, "₹199 / month");
});
