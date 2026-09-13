import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { audit, requestInfo } from "@/lib/admin-security";
export const dynamic = "force-dynamic";

const USE_PG = !!process.env.DATABASE_URL;

export async function PATCH(req: NextRequest) {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const allowed = ["site_name", "tagline", "instagram_handle", "instagram_url"];
  for (const k of allowed) if (body[k] !== undefined) {
    if (USE_PG) await run("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", k, String(body[k]));
    else await run("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", k, String(body[k]));
  }
  await audit(u!.id,"SETTINGS_UPDATED","settings","site",allowed.filter(k=>body[k]!==undefined).join(","),requestInfo(req).ip);
  return NextResponse.json({ ok: true });
}
