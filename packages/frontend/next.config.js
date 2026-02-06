/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-assets.clashofclans.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

