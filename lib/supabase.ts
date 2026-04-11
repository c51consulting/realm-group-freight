import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!isConfigured && typeof window === 'undefined') {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Data fetching will fail until these are configured.',
  );
}

/**
 * Create a new Supabase client instance.
 */
export function createClient() {
  return supabaseCreateClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Browser-safe Supabase client singleton.
 */
export const supabase = supabaseCreateClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client with the service-role key.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('[supabase] SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return supabaseCreateClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
