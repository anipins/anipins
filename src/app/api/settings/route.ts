import { NextResponse } from "next/server";
import { rows } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const r = await rows("SELECT key, value FROM settings");
  const s: Record<string, string> = {};
  for (const x of r) s[x.key] = x.value;
  return NextResponse.json({ settings: s });
}
