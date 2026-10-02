import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { refreshSubscriptionForUser, userHasPremium } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to verify your subscription." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const subscriptionId = String(body.razorpay_subscription_id || "");
  if (!subscriptionId) return NextResponse.json({ error: "Subscription details are missing." }, { status: 400 });
  try {
    const subscription = await refreshSubscriptionForUser(user.id, subscriptionId);
    return NextResponse.json({ subscription, premium: await userHasPremium(user.id) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message === "SUBSCRIPTION_NOT_FOUND" ? "That subscription does not belong to this account." : "Could not verify the subscription yet." }, { status: 400 });
  }
}
