import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://realm-ag-marketplace-production.up.railway.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/carriers', '/carriers/'],
        disallow: ['/api/', '/admin', '/login', '/signup', '/dashboard', '/account'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
