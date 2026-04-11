import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn at module load time so misconfiguration is obvious in logs.
  // We don't throw here so the app can still render static/non-data pages.
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Data fetching will fail until these are configured.',
  );
}

/**
 * Browser-safe Supabase client.
 * Uses the anon key — subject to Row Level Security policies.
 * Import this in Client Components and API routes that act on behalf of a user.
 */
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
);

/**
 * Server-side Supabase client with the service-role key.
 * Bypasses RLS — only use in trusted server contexts (API routes, Server Actions).
 * Never expose this client to the browser.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      '[supabase] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'This client must only be used in server-side code.',
    );
  }

  return createClient(supabaseUrl ?? '', serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
