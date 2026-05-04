import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// No-op stub client for when Supabase is unavailable
const createStubClient = () => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: null, error: null }),
  },
})

export const createClient = async () => {
  // Return stub if env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createStubClient()
  }

  try {
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Handle cookie setting errors in read-only contexts
            }
          },
        },
      }
    )
  } catch (error) {
    // If client creation fails, return stub
    console.warn('Failed to create Supabase server client:', error)
    return createStubClient()
  }
}
