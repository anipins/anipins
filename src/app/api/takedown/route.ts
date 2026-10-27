import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/db";
import { readBoundedJson, RequestBodyError } from "@/lib/request-validation";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await readBoundedJson(req, 16 * 1024); }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: status === 413 ? "Request body is too large." : "Invalid request." }, { status });
  }
  const { name, email, artworkUrl, copyrightedWork, authority, reason, signature, website, goodFaith, accuracy } = body;
  // Hidden field: real users never see or fill it, while basic form bots do.
  if (String(website || "").trim()) return NextResponse.json({ ok: true });
  const cleanName = String(name || "").trim().slice(0, 120);
  const cleanEmail = String(email || "").trim().slice(0, 254);
  const cleanUrl = String(artworkUrl || "").trim().slice(0, 1000);
  const cleanWork = String(copyrightedWork || "").trim().slice(0, 1000);
  const cleanAuthority = String(authority || "").trim().slice(0, 80);
  const cleanReason = String(reason || "").trim().slice(0, 2000);
  const cleanSignature = String(signature || "").trim().slice(0, 120);
  if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanUrl || !cleanWork || !cleanAuthority || !cleanReason || !cleanSignature || !goodFaith || !accuracy) {
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
