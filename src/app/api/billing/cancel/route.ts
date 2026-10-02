import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { cancelUserSubscription } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage your subscription." }, { status: 401 });
  try {
    return NextResponse.json({ subscription: await cancelUserSubscription(user.id) });
  } catch {
    return NextResponse.json({ error: "No active subscription could be cancelled." }, { status: 400 });
  }
}
