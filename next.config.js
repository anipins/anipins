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
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      ...privateRoutes.map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] })),
    ];
  }
};
