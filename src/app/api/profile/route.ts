import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, run } from "@/lib/db";
import { deleteFile, saveAvatar } from "@/lib/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

  const stats = await row(
    `SELECT
      (SELECT COUNT(DISTINCT artwork_id) FROM saves WHERE user_id=?) AS saved_count,
      (SELECT COUNT(*) FROM likes WHERE user_id=?) AS liked_count,
      (SELECT COUNT(*) FROM collections WHERE user_id=?) AS collection_count`,
    user.id, user.id, user.id
  );
  return NextResponse.json({ user, stats });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit your profile." }, { status: 401 });

  const form = await req.formData();
  const nickname = String(form.get("nickname") || "").trim();
  if (nickname.length < 2 || nickname.length > 40) {
    return NextResponse.json({ error: "Nickname must be between 2 and 40 characters." }, { status: 400 });
  }

  let avatar = user.avatar || "";
  const file = form.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Profile image must be an image file." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Profile image must be smaller than 8 MB." }, { status: 400 });
    }
    const nextAvatar = await saveAvatar(Buffer.from(await file.arrayBuffer()), user.id);
    const previousAvatar = avatar;
    avatar = nextAvatar;
    if (previousAvatar) await deleteFile(previousAvatar);
  }

  await run("UPDATE users SET nickname=?, avatar=? WHERE id=?", nickname, avatar, user.id);
  return NextResponse.json({ ok: true, user: { ...user, nickname, avatar } });
}
