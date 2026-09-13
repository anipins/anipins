/** @type {import('next').NextConfig} */
module.exports = {
  serverExternalPackages: ["better-sqlite3", "sharp", "pg"],
  outputFileTracingIncludes: { "/api/setup": ["./seed/**/*"] },
  outputFileTracingRoot: process.cwd(),
  images: { unoptimized: true },
  async headers() {
    const privateRoutes = ["/admin/:path*", "/login", "/register", "/settings", "/profile", "/saves/:path*", "/following", "/notifications", "/search", "/offline", "/u/:path*"];
    return privateRoutes.map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }));
  }
};
