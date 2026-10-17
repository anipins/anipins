import { NextRequest, NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { processMediaCleanupQueue } from "@/lib/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Retry object-storage cleanup after transient provider failures. */
export async function POST(_req: NextRequest) {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await processMediaCleanupQueue();
  return NextResponse.json({ ok: result.pending === 0, ...result }, { status: result.pending ? 202 : 200 });
}
