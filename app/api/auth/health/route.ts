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

function getKeyKind(value: string | undefined) {
  if (!value) return 'missing'
  if (value.startsWith('sb_publishable_')) return 'publishable'
  if (value.split('.').length === 3) return 'legacy_jwt'
  return 'unknown'
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const parsedUrl = parseSupabaseUrl(supabaseUrl)

  let authHealthReachable = false
  let authHealthStatus: number | null = null
  let authHealthError: string | null = null
  let dataApiReachable = false
  let dataApiStatus: number | null = null
  let dataApiError: string | null = null

  if (supabaseUrl && anonKey && parsedUrl.ok) {
    const baseUrl = supabaseUrl.replace(/\/$/, '')

    try {
      const response = await fetch(`${baseUrl}/auth/v1/settings`, {
        headers: {
          apikey: anonKey,
        },
        cache: 'no-store',
      })
      authHealthStatus = response.status
      authHealthReachable = response.ok
      if (!response.ok) {
        authHealthError = `Supabase auth settings responded with HTTP ${response.status}`
      }
    } catch (error) {
      authHealthError = error instanceof Error ? error.message : 'Unable to reach Supabase auth settings'
    }

    try {
      const response = await fetch(`${baseUrl}/rest/v1/`, {
        headers: {
          apikey: anonKey,
        },
        cache: 'no-store',
      })
      dataApiStatus = response.status
      dataApiReachable = response.ok
      if (!response.ok) {
        dataApiError = `Supabase Data API responded with HTTP ${response.status}`
      }
    } catch (error) {
      dataApiError = error instanceof Error ? error.message : 'Unable to reach Supabase Data API'
    }
  }

  const ok = Boolean(parsedUrl.ok && anonKey && authHealthReachable && dataApiReachable)

  return NextResponse.json({
    ok,
    environment: {
      supabaseUrlPresent: Boolean(supabaseUrl),
      supabaseUrl: parsedUrl,
      anonKeyPresent: Boolean(anonKey),
      anonKeyPreview: mask(anonKey),
      anonKeyKind: getKeyKind(anonKey),
      serviceRoleKeyPresent: Boolean(serviceKey),
    },
    supabaseAuthHealth: {
      reachable: authHealthReachable,
      status: authHealthStatus,
      error: authHealthError,
    },
    supabaseDataApi: {
      reachable: dataApiReachable,
      status: dataApiStatus,
      error: dataApiError,
    },
    nextStep:
      ok
        ? 'Supabase Auth and Data API are reachable from Railway.'
        : 'Check Railway Variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must match Supabase Settings > API.',
  })
}
