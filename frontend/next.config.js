/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://partnernode-676480537087.europe-north2.run.app' : 'http://localhost:3001'),
  },
  async rewrites() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://partnernode-676480537087.europe-north2.run.app' : 'http://localhost:3001')).trim();
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
