import { NextRequest, NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { createSignedArtworkUpload, newArtworkUploadKey, USE_R2_MEDIA, USE_SUPABASE_STORAGE } from "@/lib/media";

export const runtime = "nodejs";

const MAX_ARTWORK_BYTES = 40 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Issues one short-lived, single-object upload capability. This keeps binary
 * image data off the Vercel request path (which is what produced HTTP 413),
 * without exposing the Supabase service role key to the browser.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const name = String(body?.name || "");
    const type = String(body?.type || "").toLowerCase();
    const size = Number(body?.size || 0);
    const premium = body?.premium === true;
    if (!name || !ALLOWED_TYPES.has(type) || !Number.isFinite(size) || size < 1 || size > MAX_ARTWORK_BYTES) {
      return NextResponse.json({ error: "Each artwork must be a JPG, PNG or WebP image no larger than 40 MB." }, { status: 400 });
    }

    // Local development can continue using the existing multipart path. In
    // production this is always direct storage, avoiding the platform body cap.
    if (!USE_R2_MEDIA && !USE_SUPABASE_STORAGE) return NextResponse.json({ direct: false });
    const signed = await createSignedArtworkUpload(newArtworkUploadKey(name), premium);
    if (!signed) return NextResponse.json({ direct: false });
    return NextResponse.json({ direct: true, ...signed });
  } catch (error) {
    console.error("Unable to sign artwork upload", error);
    return NextResponse.json({ error: "The upload service is temporarily unavailable. Please retry this image." }, { status: 503 });
  }
}
