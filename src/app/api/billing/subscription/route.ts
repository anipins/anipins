import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createPremiumSubscription } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to start AniPins Premium." }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const planKey = body?.plan;
    if (!["weekly", "monthly", "yearly"].includes(planKey)) {
      return NextResponse.json({ error: "Choose a valid Premium billing plan." }, { status: 400 });
    }
    const subscription = await createPremiumSubscription(user, planKey);
    return NextResponse.json({ subscriptionId: subscription.id, keyId: subscription.keyId, name: "AniPins Premium", description: subscription.description });
  } catch (error: any) {
    if (error?.message === "INVALID_PREMIUM_PLAN") return NextResponse.json({ error: "Choose a valid Premium billing plan." }, { status: 400 });
    const message = error?.message === "RAZORPAY_NOT_CONFIGURED" ? "Payments are not configured yet." : error?.message || "Could not start the subscription.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
