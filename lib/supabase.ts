import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Data fetching will fail until these are configured.',
  );
}

/**
 * Create a new Supabase client instance.
 * Used by API routes to get a fresh client per request.
 */
export function createClient() {
  return supabaseCreateClient(
    supabaseUrl ?? '',
    supabaseAnonKey ?? '',
  );
}

/**
 * Browser-safe Supabase client singleton.
 * Uses the anon key - subject to Row Level Security policies.
 */
export const supabase = supabaseCreateClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
);

/**
 * Server-side Supabase client with the service-role key.
 * Bypasses RLS - only use in trusted server contexts.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      '[supabase] SUPABASE_SERVICE_ROLE_KEY is not set.',
    );
  }
  return supabaseCreateClient(supabaseUrl ?? '', serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
