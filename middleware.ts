import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public browse routes — no auth required:
// /listings, /livestock, /equipment, /freight (browse)
// Auth required only for transactional/personal routes:
const protectedRoutes = [
  '/dashboard',
  '/listings/create',
  '/livestock/create',
  '/equipment/create',
  '/freight/create',
  '/quality',
  '/offers',
  '/orders',
  '/post-listing',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only run auth check on protected routes
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtected) {
    return NextResponse.next()
  }

  // Skip auth check if env vars are missing (e.g., during build)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    // If auth check fails, allow request through (don't break the build)
    console.error('Auth middleware error:', error)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
