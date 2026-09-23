import { NextResponse } from "next/server";
import { googleClientId } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = googleClientId();
  if (!clientId) return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  return NextResponse.json({ clientId }, { headers: { "Cache-Control": "public, max-age=300" } });
}
