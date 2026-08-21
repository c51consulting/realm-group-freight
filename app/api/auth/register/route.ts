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
  let password = ''
  let confirmPassword = ''
  let emailRedirectTo = `${origin}/login`

  if (isFormPost) {
    const form = await request.formData()
    email = String(form.get('email') || '')
    password = String(form.get('password') || '')
    confirmPassword = String(form.get('confirmPassword') || '')
  } else {
    const body = await request.json()
    email = body.email
    password = body.password
    confirmPassword = body.confirmPassword ?? body.password
    emailRedirectTo = body.emailRedirectTo || emailRedirectTo
  }

  const redirectWith = (path: string, key: 'error' | 'info', value: string) => {
    const url = new URL(path, origin)
    url.searchParams.set(key, value)
    return NextResponse.redirect(url, { status: 303 })
  }

  if (!email || !password) {
    if (isFormPost) return redirectWith('/register', 'error', 'Email and password are required.')
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  if (password.length < 8) {
    if (isFormPost) return redirectWith('/register', 'error', 'Password must be at least 8 characters.')
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    if (isFormPost) return redirectWith('/register', 'error', 'Passwords do not match.')
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  })

  if (error) {
    if (isFormPost) return redirectWith('/register', 'error', authErrorMessage(error.message))
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (isFormPost && data.user && !data.session) {
    return redirectWith('/register', 'info', 'Account created. Please check your inbox for a confirmation email before signing in.')
  }

  if (isFormPost) {
    return NextResponse.redirect(new URL('/dashboard', origin), { status: 303 })
  }

  return NextResponse.json({ success: true, needsConfirmation: Boolean(data.user && !data.session) })
}
