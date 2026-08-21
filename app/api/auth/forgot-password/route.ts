import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getSafeOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const requestUrl = new URL(request.url)
  let protocol = forwardedProto ? `${forwardedProto}:` : requestUrl.protocol
  let host = forwardedHost || requestUrl.host

  if (host.startsWith('0.0.0.0')) {
    host = host.replace('0.0.0.0', 'localhost')
    protocol = 'http:'
  }

  if (host.startsWith('localhost')) {
    protocol = 'http:'
  }

  return `${protocol}//${host}`
}

function authErrorMessage(message: string) {
  if (message.toLowerCase().includes('fetch failed')) {
    return 'The authentication service could not be reached. Please check the Supabase settings in Railway.'
  }

  return message
}

export async function POST(request: NextRequest) {
  const isFormPost = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')
  const origin = getSafeOrigin(request)
  let email = ''
  let redirectTo = `${origin}/reset-password`

  if (isFormPost) {
    const form = await request.formData()
    email = String(form.get('email') || '')
  } else {
    const body = await request.json()
    email = body.email
    redirectTo = body.redirectTo || redirectTo
  }

  const redirectWith = (key: 'error' | 'info', value: string) => {
    const url = new URL('/forgot-password', origin)
    url.searchParams.set(key, value)
    return NextResponse.redirect(url, { status: 303 })
  }

  if (!email) {
    if (isFormPost) return redirectWith('error', 'Email is required.')
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    if (isFormPost) return redirectWith('error', authErrorMessage(error.message))
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (isFormPost) {
    return redirectWith('info', 'If an account exists for that email, a password reset link has been sent. Please check your inbox.')
  }

  return NextResponse.json({ success: true })
}
