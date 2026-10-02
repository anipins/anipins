import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { canAccessPremium, getUserSubscription } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ user: null, subscription: null, premium: false }, { status: 401 });
  const subscription = await getUserSubscription(user.id);
  return NextResponse.json({ subscription, premium: await canAccessPremium(user), adminPreview: user.role === "ADMIN" }, { headers: { "Cache-Control": "private, no-store" } });
}
