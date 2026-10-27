import { NextResponse } from "next/server";
import { row, rows, run } from "@/lib/db";
import { ADMIN_EMAIL, getUser, isAdmin } from "@/lib/auth";
import { audit, requestInfo } from "@/lib/admin-security";
import { NextRequest } from "next/server";
import { readBoundedJson, RequestBodyError } from "@/lib/request-validation";
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
  return NextResponse.json({ users: users.map((user: any) => ({ ...user, isCurrentAdmin: Number(user.id) === Number(u.id) })), adminCount: users.filter((user: any) => user.role === "ADMIN").length });
}

export async function PATCH(req: NextRequest) {
  const admin = await getUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await readBoundedJson(req, 4 * 1024); }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: status === 413 ? "Request body is too large." : "Invalid request." }, { status });
  }
  const userId = Number(body?.userId);
  const role = String(body?.role || "").toUpperCase();
  if (!Number.isSafeInteger(userId) || userId < 1 || (role !== "USER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Choose a valid user and access role." }, { status: 400 });
  }
  if (userId === Number(admin.id)) return NextResponse.json({ error: "You cannot change your own administrator access." }, { status: 409 });
  const target = await row("SELECT id, email, role FROM users WHERE id=?", userId);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (role === "ADMIN" && String(target.email || "").trim().toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Administrator access is reserved for the site owner." }, { status: 403 });
  }
  if (target.role === role) return NextResponse.json({ ok: true, role });
  if (target.role === "ADMIN" && role === "USER") {
    const admins = Number((await row("SELECT COUNT(*) AS total FROM users WHERE role='ADMIN'"))?.total || 0);
    if (admins <= 1) return NextResponse.json({ error: "The last administrator cannot be removed." }, { status: 409 });
  }
  await run("UPDATE users SET role=? WHERE id=?", role, userId);
  const info = requestInfo(req);
  await audit(Number(admin.id), "USER_ACCESS_CHANGED", "user", String(userId), `${target.email}: ${target.role} → ${role}`, info.ip);
  return NextResponse.json({ ok: true, role });
}
