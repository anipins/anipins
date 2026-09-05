/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'anipins-three.vercel.app' },
    ],
    unoptimized: true,
  },
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
