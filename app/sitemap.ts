import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://realm-ag-marketplace-production.up.railway.app';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/carriers`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return staticRoutes;

  try {
    const sb = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await sb
      .from('carrier_directory')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(5000);
    if (error || !data) return staticRoutes;

    const carrierRoutes: MetadataRoute.Sitemap = data.map((row: any) => ({
      url: `${baseUrl}/carriers/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...carrierRoutes];
  } catch {
    return staticRoutes;
  }
}
