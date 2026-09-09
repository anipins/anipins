import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, rows, run } from "@/lib/db";
import { deleteFile, saveAvatar, saveCover } from "@/lib/media";

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
  const collections = await rows(
    `SELECT c.id, c.name, COUNT(s.id) AS count,
      (SELECT a.thumb FROM saves sx JOIN artworks a ON a.id=sx.artwork_id WHERE sx.collection_id=c.id ORDER BY sx.id DESC LIMIT 1) AS cover
     FROM collections c LEFT JOIN saves s ON s.collection_id=c.id WHERE c.user_id=? GROUP BY c.id, c.name ORDER BY c.id DESC LIMIT 12`,
    user.id,
  );
  const liked = await rows(
    `SELECT a.id, a.title, a.character_name, a.anime_name, a.thumb, a.width, a.height
     FROM likes l JOIN artworks a ON a.id=l.artwork_id WHERE l.user_id=? AND a.published=1 ORDER BY l.id DESC LIMIT 12`,
    user.id,
  );
  return NextResponse.json({ user, stats, collections, liked });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit your profile." }, { status: 401 });

  const form = await req.formData();
  const nickname = String(form.get("nickname") || "").trim();
  const bio = String(form.get("bio") || "").trim();
  const isPublic = form.get("isPublic") === "1" ? 1 : 0;
  if (nickname.length < 2 || nickname.length > 40) {
    return NextResponse.json({ error: "Nickname must be between 2 and 40 characters." }, { status: 400 });
  }
  if (bio.length > 240) return NextResponse.json({ error: "Bio must be 240 characters or fewer." }, { status: 400 });

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

  let cover = user.cover || "";
  const coverFile = form.get("cover");
  if (coverFile instanceof File && coverFile.size > 0) {
    if (!coverFile.type.startsWith("image/") || coverFile.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Cover must be an image smaller than 12 MB." }, { status: 400 });
    }
    const nextCover = await saveCover(Buffer.from(await coverFile.arrayBuffer()), user.id);
    const previousCover = cover;
    cover = nextCover;
    if (previousCover) await deleteFile(previousCover);
  }

  await run("UPDATE users SET nickname=?, avatar=?, cover=?, bio=?, is_public=? WHERE id=?", nickname, avatar, cover, bio, isPublic, user.id);
  return NextResponse.json({ ok: true, user: { ...user, nickname, avatar, cover, bio, is_public: isPublic } });
}
