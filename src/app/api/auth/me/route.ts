import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, getUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getUser();
  const hasSessionCookie = Boolean((await cookies()).get(COOKIE)?.value);
  if (!user && hasSessionCookie) {
    const response = NextResponse.json({ user: null, sessionExpired: true }, { status: 401 });
    response.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }
  return NextResponse.json({ user });
}
