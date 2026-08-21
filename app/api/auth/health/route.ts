import { NextResponse } from 'next/server'

function mask(value: string | undefined) {
  if (!value) return null
  if (value.length <= 10) return `${value.slice(0, 2)}...`
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function parseSupabaseUrl(value: string | undefined) {
  if (!value) return { ok: false, error: 'NEXT_PUBLIC_SUPABASE_URL is missing' }

  try {
    const url = new URL(value)
    return {
      ok: url.protocol === 'https:',
      protocol: url.protocol,
      host: url.host,
      error: url.protocol === 'https:' ? null : 'Supabase URL must start with https://',
    }
  } catch {
    return { ok: false, error: 'NEXT_PUBLIC_SUPABASE_URL is not a valid URL' }
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const parsedUrl = parseSupabaseUrl(supabaseUrl)

  let authReachable = false
  let authStatus: number | null = null
  let authError: string | null = null

  if (supabaseUrl && anonKey && parsedUrl.ok) {
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, {
        headers: {
          apikey: anonKey,
          authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })
      authStatus = response.status
      authReachable = response.ok
      if (!response.ok) {
        authError = `Supabase auth responded with HTTP ${response.status}`
      }
    } catch (error) {
      authError = error instanceof Error ? error.message : 'Unable to reach Supabase auth'
    }
  }

  return NextResponse.json({
    ok: Boolean(parsedUrl.ok && anonKey && authReachable),
    environment: {
      supabaseUrlPresent: Boolean(supabaseUrl),
      supabaseUrl: parsedUrl,
      anonKeyPresent: Boolean(anonKey),
      anonKeyPreview: mask(anonKey),
      serviceRoleKeyPresent: Boolean(serviceKey),
    },
    supabaseAuth: {
      reachable: authReachable,
      status: authStatus,
      error: authError,
    },
    nextStep:
      parsedUrl.ok && anonKey && authReachable
        ? 'Supabase auth is reachable from Railway.'
        : 'Check Railway Variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must match Supabase Settings > API.',
  })
}
