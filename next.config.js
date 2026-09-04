/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "sharp", "pg"],
    outputFileTracingIncludes: { "/api/setup": ["./seed/**/*"] }
  },
  images: { unoptimized: true }
};
