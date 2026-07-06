import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const createQueryStub = () => {
  const query = {
    select: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    upsert: () => query,
    eq: () => query,
    in: () => query,
    gte: () => query,
    lte: () => query,
    ilike: () => query,
    filter: () => query,
    or: () => query,
    order: () => query,
    limit: () => query,
    range: () => query,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: (value: { data: null; error: null; count: number }) => unknown) =>
      Promise.resolve({ data: null, error: null, count: 0 }).then(resolve),
  }
  return query
}

// No-op stub client for when Supabase is unavailable
const createStubClient = () => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: null }),
    resend: async () => ({ data: null, error: null }),
    updateUser: async () => ({ data: null, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: createQueryStub,
  storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
}) as unknown as SupabaseClient<any>

export const createClient = () => {
  // Return stub if env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createStubClient()
  }

  try {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  } catch (error) {
    // If client creation fails, return stub
    console.warn('Failed to create Supabase client:', error)
    return createStubClient()
  }
}
