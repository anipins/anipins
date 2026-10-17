import { NextRequest, NextResponse } from "next/server";
import { COOKIE, checkPassword, getUser, hashPassword } from "@/lib/auth";
import { verifyGoogleReauthProof } from "@/lib/account-reauth";
import { cancelSubscriptionForAccountDeletion } from "@/lib/billing";
import { row, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage your account." }, { status: 401 });
  const body = await req.json();
  if (body.action === "preferences") {
    const following = body.notifyFollowing ? 1 : 0;
    const updates = body.notifyUpdates ? 1 : 0;
    await run("UPDATE users SET notify_following=?, notify_updates=? WHERE id=?", following, updates, user.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "password") {
    const current = String(body.currentPassword || "");
    const next = String(body.newPassword || "");
    const record = await row("SELECT password_hash FROM users WHERE id=?", user.id);
    if (!record || !checkPassword(current, record.password_hash)) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    if (next.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    await run("UPDATE users SET password_hash=? WHERE id=?", hashPassword(next), user.id);
    await run("DELETE FROM sessions WHERE user_id=? AND token != ?", user.id, req.cookies.get(COOKIE)?.value || "");
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown account action." }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage your account." }, { status: 401 });
  const body = await req.json();
  if (body.action !== "logout-all") return NextResponse.json({ error: "Unknown account action." }, { status: 400 });
  await run("DELETE FROM sessions WHERE user_id=?", user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage your account." }, { status: 401 });
  const body = await req.json();
  const record = await row("SELECT password_hash, role FROM users WHERE id=?", user.id);
  if (!record) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (record.role === "ADMIN") return NextResponse.json({ error: "The owner account cannot be deleted here." }, { status: 400 });
  const passwordConfirmed = Boolean(body.password) && checkPassword(String(body.password), record.password_hash);
  const proof = req.cookies.get("anipins_account_reauth")?.value || "";
  const googleConfirmed = verifyGoogleReauthProof(proof, user.id, process.env.NEXTAUTH_SECRET || "");
  if (!passwordConfirmed && !googleConfirmed) {
    return NextResponse.json({ error: "Confirm with your password or verify the Google account linked to AniPins." }, { status: 400 });
  }
  try {
    // Stop renewal before deleting the AniPins identity. If Razorpay cannot
    // confirm cancellation, keep the account intact so the member can retry.
    await cancelSubscriptionForAccountDeletion(user.id);
  } catch {
    return NextResponse.json({ error: "We could not cancel Premium yet, so your account was not deleted. Please try again or contact support." }, { status: 503 });
  }
  await run("DELETE FROM push_devices WHERE user_id=?", user.id);
  await run("DELETE FROM notifications WHERE user_id=?", user.id);
  await run("DELETE FROM follows WHERE user_id=?", user.id);
  await run("DELETE FROM interactions WHERE user_id=?", user.id);
  await run("DELETE FROM hidden_artworks WHERE user_id=?", user.id);
  await run("DELETE FROM likes WHERE user_id=?", user.id);
  await run("DELETE FROM saves WHERE user_id=?", user.id);
  await run("DELETE FROM collections WHERE user_id=?", user.id);
  await run("DELETE FROM sessions WHERE user_id=?", user.id);
  await run("DELETE FROM users WHERE id=?", user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set("anipins_account_reauth", "", { path: "/api/account", maxAge: 0 });
  return res;
}
