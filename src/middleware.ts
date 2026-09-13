import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const limits = [
  { path: "/api/auth/login", requests: 15, windowMs: 15 * 60_000 },
  { path: "/api/auth/register", requests: 6, windowMs: 60 * 60_000 },
  { path: "/api/takedown", requests: 5, windowMs: 60 * 60_000 },
  { path: "/api/reports", requests: 20, windowMs: 60 * 60_000 },
  { path: "/api/admin/upload", requests: 30, windowMs: 10 * 60_000 },
  { path: "/api/admin/security", requests: 40, windowMs: 10 * 60_000 },
  { path: "/api/telemetry", requests: 120, windowMs: 60_000 },
];

export function middleware(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return NextResponse.next();

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const requestHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
      if (new URL(origin).host !== requestHost) {
        return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  const rule = limits.find(item => req.nextUrl.pathname === item.path);
  if (!rule) return NextResponse.next();

  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const key = `${rule.path}:${ip}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + rule.windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (buckets.size > 5000) for (const [item, value] of buckets) if (value.resetAt <= now) buckets.delete(item);

  if (bucket.count > rule.requests) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
