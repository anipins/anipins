import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { canAccessPremium, getUserSubscription, refreshSubscriptionForUser } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ user: null, subscription: null, premium: false }, { status: 401 });
  const subscription = await getUserSubscription(user.id);
  return NextResponse.json({ subscription, premium: await canAccessPremium(user), adminPreview: user.role === "ADMIN" }, { headers: { "Cache-Control": "private, no-store" } });
}

// Payment confirmation is asynchronous at Razorpay. This endpoint is called
// only by the Premium page while a member already has a pending subscription;
// it keeps the normal page path local and fast.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to check your subscription." }, { status: 401 });
  const current = await getUserSubscription(user.id);
  if (!current) return NextResponse.json({ subscription: null, premium: false });
  try {
    const subscription = await refreshSubscriptionForUser(user.id, current.subscription_id);
    return NextResponse.json({ subscription, premium: await canAccessPremium(user) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    // Keep the page usable when Razorpay is temporarily slow. The webhook can
    // still activate the membership later without exposing an error screen.
    return NextResponse.json({ subscription: current, premium: await canAccessPremium(user), pending: true }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
