import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const isFormPost = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')
  const origin = new URL(request.url).origin
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
    const url = new URL('/forgot-password', request.url)
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
    if (isFormPost) return redirectWith('error', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (isFormPost) {
    return redirectWith('info', 'If an account exists for that email, a password reset link has been sent. Please check your inbox.')
  }

  return NextResponse.json({ success: true })
}
