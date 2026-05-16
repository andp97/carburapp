import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Empty turbopack config lets Next.js 16 run in Turbopack mode without errors
  turbopack: {},
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
