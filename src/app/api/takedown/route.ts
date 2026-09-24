import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, artworkUrl, copyrightedWork, authority, reason, signature, goodFaith, accuracy } = await req.json();
  const cleanName = String(name || "").trim().slice(0, 120);
  const cleanEmail = String(email || "").trim().slice(0, 254);
  const cleanUrl = String(artworkUrl || "").trim().slice(0, 1000);
  const cleanWork = String(copyrightedWork || "").trim().slice(0, 1000);
  const cleanAuthority = String(authority || "").trim().slice(0, 80);
  const cleanReason = String(reason || "").trim().slice(0, 2000);
  const cleanSignature = String(signature || "").trim().slice(0, 120);
  if (!cleanName || !cleanEmail || !cleanUrl || !cleanWork || !cleanAuthority || !cleanReason || !cleanSignature || !goodFaith || !accuracy) {
    return NextResponse.json({ error: "Please complete every required declaration." }, { status: 400 });
  }
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== "https:" || !["anipins.com", "www.anipins.com"].includes(parsed.hostname)) throw new Error("invalid");
  } catch {
    return NextResponse.json({ error: "Enter a valid AniPins artwork URL." }, { status: 400 });
  }
  const completeReason = [`Copyrighted work: ${cleanWork}`, `Authority: ${cleanAuthority}`, `Details: ${cleanReason}`, `Good-faith statement: Confirmed`, `Accuracy and authority statement: Confirmed`, `Electronic signature: ${cleanSignature}`].join("\n\n").slice(0, 6000);
  await run("INSERT INTO takedowns (name,email,artwork_url,reason) VALUES (?,?,?,?)", cleanName, cleanEmail, cleanUrl, completeReason);
  return NextResponse.json({ ok: true });
}
