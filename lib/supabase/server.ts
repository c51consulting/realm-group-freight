import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

type CookieToSet = {
  name: string
  value: string
  options: Record<string, unknown>
}

const createQueryStub = () => {
  const query = {
    select: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    upsert: () => query,
    eq: () => query,
    in: () => query,
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

// Minimal stub for when Supabase env vars are unavailable (e.g. during static analysis)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStubClient = () => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: null, error: null }),
    resend: async () => ({ data: null, error: null }),
  },
  from: createQueryStub,
  storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  rpc: async () => ({ data: null, error: null }),
}) as unknown as SupabaseClient<any>

export const createClient = async (): Promise<SupabaseClient<any>> => {
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
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore cookie errors in read-only server contexts
            }
          },
        },
      }
    ) as SupabaseClient<any>
  } catch (error) {
    console.warn('Failed to create Supabase server client:', error)
    return createStubClient()
  }
}
