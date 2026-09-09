import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "").slice(0, 40);
  if (!kind) return NextResponse.json({ ok: false }, { status: 400 });
  await run("INSERT INTO telemetry (kind,path,value,detail) VALUES (?,?,?,?)", kind, String(body.path || "").slice(0, 300), Math.max(0, Math.round(Number(body.value) || 0)), String(body.detail || "").slice(0, 500));
  return NextResponse.json({ ok: true });
}
