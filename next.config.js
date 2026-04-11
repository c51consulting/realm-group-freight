/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Railway deployment
  output: 'standalone',

  // Skip type checking during build (fix types incrementally)
  typescript: {
    ignoreBuildErrors: true,
  },

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
};

module.exports = nextConfig;
