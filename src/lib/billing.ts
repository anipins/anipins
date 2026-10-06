import { row, run } from "@/lib/db";
import { isPremiumSubscriptionStatus } from "@/lib/billing-utils";

const PLAN_AMOUNT = 19900; // paise
// Razorpay plans are immutable. Including the amount in this key ensures a
// price change creates a new plan for future members rather than reusing the
// previous ₹99 plan. Existing subscriptions retain their agreed price.
const PLAN_KEY_PREFIX = `razorpay_premium_plan:${PLAN_AMOUNT}:`;
let schemaReady: Promise<void> | null = null;

export type BillingSubscription = {
  subscription_id: string;
  user_id: number;
  status: string;
  payment_id: string;
  current_end: number;
  cancel_at_cycle_end: number;
};

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("RAZORPAY_NOT_CONFIGURED");
  return { keyId, keySecret };
}

async function razorpay(path: string, init: RequestInit = {}) {
  const { keyId, keySecret } = credentials();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, { ...init, headers, cache: "no-store" });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error?.description || "Razorpay could not complete this request.");
  return json;
}

export async function ensureBillingSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await run(`CREATE TABLE IF NOT EXISTS billing_subscriptions (
        subscription_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'created',
        payment_id TEXT DEFAULT '', current_end BIGINT DEFAULT 0, cancel_at_cycle_end INTEGER DEFAULT 0,
        created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
      )`);
      await run("CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user ON billing_subscriptions(user_id, updated_at)");
    })();
  }
  return schemaReady;
}

export async function storeSubscription(subscription: Partial<BillingSubscription> & { subscription_id: string; user_id: number; status: string }) {
  await ensureBillingSchema();
  const now = Date.now();
  await run(
    `INSERT INTO billing_subscriptions (subscription_id,user_id,status,payment_id,current_end,cancel_at_cycle_end,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT (subscription_id) DO UPDATE SET status=excluded.status,payment_id=excluded.payment_id,current_end=excluded.current_end,cancel_at_cycle_end=excluded.cancel_at_cycle_end,updated_at=excluded.updated_at`,
    subscription.subscription_id,
    subscription.user_id,
    subscription.status,
    subscription.payment_id || "",
    subscription.current_end || 0,
    subscription.cancel_at_cycle_end ? 1 : 0,
    now,
    now,
  );
}

export async function getUserSubscription(userId: number): Promise<BillingSubscription | null> {
  await ensureBillingSchema();
  return row("SELECT subscription_id,user_id,status,payment_id,current_end,cancel_at_cycle_end FROM billing_subscriptions WHERE user_id=? ORDER BY updated_at DESC LIMIT 1", userId) as Promise<BillingSubscription | null>;
}

export async function userHasPremium(userId: number) {
  const subscription = await getUserSubscription(userId);
  return !!subscription && isPremiumSubscriptionStatus(subscription.status) && (!subscription.current_end || subscription.current_end * 1000 > Date.now());
}

export async function canAccessPremium(user: { id: number; role?: string }) {
  return user.role === "ADMIN" || userHasPremium(user.id);
}

async function getPlanId() {
  // A legacy RAZORPAY_PLAN_ID may point to the old ₹99 plan, so only accept a
  // price-specific override for the current offering.
  const configured = process.env.RAZORPAY_PREMIUM_PLAN_ID_199?.trim();
  if (configured) return configured;
  const { keyId } = credentials();
  const settingKey = `${PLAN_KEY_PREFIX}${keyId}`;
  const saved = await row("SELECT value FROM settings WHERE key=?", settingKey);
  if (saved?.value) return String(saved.value);
  const plan = await razorpay("plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: { name: "AniPins Premium", amount: PLAN_AMOUNT, currency: "INR", description: "Exclusive anime reference collections, HD downloads and early access." },
      notes: { product: "anipins-premium" },
    }),
  });
  await run("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT (key) DO UPDATE SET value=excluded.value", settingKey, plan.id);
  return String(plan.id);
}

export async function createPremiumSubscription(user: { id: number; email: string; name: string }) {
  await ensureBillingSchema();
  const current = await getUserSubscription(user.id);
  if (current && ["created", "authenticated", "active", "pending"].includes(current.status)) return { id: current.subscription_id, keyId: credentials().keyId };
  const planId = await getPlanId();
  const subscription = await razorpay("subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { user_id: String(user.id), email: user.email, product: "anipins-premium" },
    }),
  });
  await storeSubscription({ subscription_id: subscription.id, user_id: user.id, status: subscription.status || "created", current_end: subscription.current_end || 0, cancel_at_cycle_end: Number(!!subscription.cancel_at_cycle_end) });
  return { id: String(subscription.id), keyId: credentials().keyId };
}

export async function refreshSubscriptionForUser(userId: number, subscriptionId: string) {
  await ensureBillingSchema();
  // A member can have an earlier cancelled subscription. Verify ownership of
  // the exact Razorpay subscription instead of assuming the newest row is it.
  const current = await row(
    "SELECT subscription_id,user_id,status,payment_id,current_end,cancel_at_cycle_end FROM billing_subscriptions WHERE user_id=? AND subscription_id=?",
    userId,
    subscriptionId,
  ) as BillingSubscription | null;
  if (!current) throw new Error("SUBSCRIPTION_NOT_FOUND");
  const subscription = await razorpay(`subscriptions/${encodeURIComponent(subscriptionId)}`);
  await storeSubscription({ subscription_id: subscription.id, user_id: userId, status: subscription.status || "created", current_end: subscription.current_end || 0, cancel_at_cycle_end: Number(!!subscription.cancel_at_cycle_end) });
  return getUserSubscription(userId);
}

export async function cancelUserSubscription(userId: number) {
  const current = await getUserSubscription(userId);
  if (!current || !["active", "authenticated"].includes(current.status)) throw new Error("SUBSCRIPTION_NOT_FOUND");
  const subscription = await razorpay(`subscriptions/${encodeURIComponent(current.subscription_id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  });
  await storeSubscription({ subscription_id: current.subscription_id, user_id: userId, status: subscription.status || current.status, current_end: subscription.current_end || current.current_end, cancel_at_cycle_end: 1 });
  return getUserSubscription(userId);
}
