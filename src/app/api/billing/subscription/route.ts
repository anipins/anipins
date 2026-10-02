import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createPremiumSubscription } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to start AniPins Premium." }, { status: 401 });
  try {
    const subscription = await createPremiumSubscription(user);
    return NextResponse.json({ subscriptionId: subscription.id, keyId: subscription.keyId, name: "AniPins Premium", description: "₹99 per month" });
  } catch (error: any) {
    const message = error?.message === "RAZORPAY_NOT_CONFIGURED" ? "Payments are not configured yet." : error?.message || "Could not start the subscription.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
