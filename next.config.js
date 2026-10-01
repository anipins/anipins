/** @type {import('next').NextConfig} */
module.exports = {
  serverExternalPackages: ["better-sqlite3", "sharp", "pg"],
  outputFileTracingIncludes: { "/api/setup": ["./seed/**/*"] },
  outputFileTracingRoot: process.cwd(),
  images: { unoptimized: true },
  async headers() {
    const privateRoutes = ["/admin/:path*", "/login", "/register", "/settings", "/profile", "/saves/:path*", "/following", "/notifications", "/search", "/offline", "/u/:path*"];
    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      {
        key: "Content-Security-Policy",
        value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://accounts.google.com https://*.supabase.co; frame-src https://accounts.google.com; worker-src 'self' blob:; upgrade-insecure-requests",
      },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/favicon.png", headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" }] },
      ...privateRoutes.map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] })),
    ];
  }
};
