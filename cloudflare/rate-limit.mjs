const RULES = [
  { match: path => ["/api/auth/login", "/api/auth/google", "/api/auth/admin-mfa", "/api/auth/admin-mfa/recovery"].includes(path), binding: "AUTH_RATE_LIMITER" },
  { match: path => path === "/api/auth/register", binding: "SIGNUP_RATE_LIMITER" },
  { match: path => path === "/api/better-auth/sign-up/email" || path === "/__staging/auth/sign-up/email", binding: "SIGNUP_RATE_LIMITER" },
  { match: path => path === "/api/takedown" || path === "/api/reports", binding: "PUBLIC_FORM_RATE_LIMITER" },
  { match: path => path.startsWith("/api/better-auth/") || path.startsWith("/__staging/auth/"), binding: "AUTH_RATE_LIMITER" },
];

/** Apply Cloudflare's edge rate-limit binding before requests reach the container. */
export async function enforceEdgeRateLimit(request, env) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;
  const url = new URL(request.url);
  const rule = RULES.find(item => item.match(url.pathname));
  if (!rule) return null;

  const limiter = env?.[rule.binding];
  // Local development and configs that do not host this route retain the
  // application's middleware limiter; deployed Worker configs bind this edge guard.
  if (!limiter || typeof limiter.limit !== "function") return null;
  const ip = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  const key = `${url.hostname}:${url.pathname}:${ip}`;
  const result = await limiter.limit({ key });
  if (result?.success) return null;
  return Response.json({ error: "Too many requests. Please try again later." }, {
    status: 429,
    headers: { "Cache-Control": "no-store", "Retry-After": "60" },
  });
}
