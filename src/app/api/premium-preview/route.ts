import { NextResponse } from "next/server";
import { getPremiumPreviewCards } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const previews = await getPremiumPreviewCards(3);
  return NextResponse.json(
    { previews: previews.map(preview => ({ id: Number(preview.id) })) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
