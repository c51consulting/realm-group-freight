/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Railway deployment. Local Windows builds can set
  // NEXT_OUTPUT=default to avoid symlink restrictions in standalone tracing.
  output: process.env.NEXT_OUTPUT === 'default' ? undefined : 'standalone',

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow images from common agricultural/storage domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
