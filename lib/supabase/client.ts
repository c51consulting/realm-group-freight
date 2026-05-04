import { createBrowserClient } from '@supabase/ssr'

// No-op stub client for when Supabase is unavailable
const createStubClient = () => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
})

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
