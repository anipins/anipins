import { NextResponse } from "next/server";
import { rows } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await rows(
    `SELECT u.id, u.email, u.name, u.role, u.created_at,
      (SELECT COUNT(*) FROM collections c WHERE c.user_id=u.id) AS collections,
      (SELECT COUNT(*) FROM saves s WHERE s.user_id=u.id) AS saves,
      (SELECT COUNT(*) FROM likes l WHERE l.user_id=u.id) AS likes
     FROM users u ORDER BY u.id ASC`);
  return NextResponse.json({ users });
}
