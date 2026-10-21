const PREMIUM_PLANS = Object.freeze({
  weekly: Object.freeze({
    key: "weekly",
    amount: 9900,
    period: "weekly",
    interval: 1,
    totalCount: 520,
    label: "₹99 / week",
    description: "₹99 per week",
    planName: "AniPins Premium Weekly",
  }),
  monthly: Object.freeze({
    key: "monthly",
    amount: 19900,
    period: "monthly",
    interval: 1,
    totalCount: 120,
    label: "₹199 / month",
    description: "₹199 per month",
    planName: "AniPins Premium Monthly",
  }),
  yearly: Object.freeze({
    key: "yearly",
    amount: 199900,
    period: "yearly",
    interval: 1,
    totalCount: 10,
    label: "₹1,999 / year",
    description: "₹1,999 per year",
    planName: "AniPins Premium Yearly",
  }),
});

function getPremiumPlan(key) {
  return Object.hasOwn(PREMIUM_PLANS, key) ? PREMIUM_PLANS[key] : null;
}

module.exports = { PREMIUM_PLANS, getPremiumPlan };
