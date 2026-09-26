import { NextResponse } from "next/server";
import { rows, run } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  // One-time-safe migration for deployments created before the profile rename.
  // It deliberately changes only the known previous AniPins values, never a
  // custom Instagram profile entered by an administrator.
  await run(
    "UPDATE settings SET value=? WHERE key='instagram_handle' AND value IN (?, ?)",
    "@anipins.art", "@_anipins_", "@_anipinss_"
  );
  await run(
    "UPDATE settings SET value=? WHERE key='instagram_url' AND value IN (?, ?)",
    "https://www.instagram.com/anipins.art/",
    "https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=",
    "https://www.instagram.com/_anipinss_/"
  );
  const r = await rows("SELECT key, value FROM settings");
  const s: Record<string, string> = {};
  for (const x of r) s[x.key] = x.value;
  return NextResponse.json({ settings: s });
}
