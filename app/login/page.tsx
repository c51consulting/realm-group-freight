'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  // Context line based on redirectTo
  const getContextLine = () => {
    if (redirectTo.includes('create')) return 'Sign in to post a listing'
    if (redirectTo.includes('listings')) return 'Sign in to browse all listings'
    return 'Access your marketplace account'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setShowResend(false)
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        const msg = String(result.error || '').toLowerCase()
        if (msg.includes('email not confirmed')) {
          setError('Your email has not been confirmed yet. Please check your inbox, or resend the confirmation email below.')
          setShowResend(true)
        } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          setError('Invalid email or password.')
        } else {
          setError(result.error || 'Unable to sign in. Please try again.')
        }
      } else {
        // Hard redirect ensures session cookies are included in the
        // server request — Next.js RSC fetches can miss freshly-set cookies
        window.location.href = redirectTo
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setInfo(null)
    if (!email) {
      setError('Enter your email above first, then click Resend.')
      return
    }
    const response = await fetch('/api/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const result = await response.json()
    if (!response.ok) setError(result.error || 'Unable to resend confirmation email.')
    else setInfo('Confirmation email re-sent to ' + email + '. Please check your inbox (and spam folder).')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Branding */}
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-4">
            <svg
              className="w-10 h-10"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="20" className="fill-brand-500" />
              <path
                d="M20 8v24M13 13c0 0 2.5 2.5 7 2.5s7-2.5 7-2.5M13 20c0 0 2.5 2.5 7 2.5s7-2.5 7-2.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900 tracking-tight">REALM Group Freight</p>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-1 text-base text-gray-500">{getContextLine()}</p>
        </div>

        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          {/* Yellow banner for create redirects */}
          {redirectTo.includes('create') && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                Create a free account or sign in to post your listing.{' '}
                <Link
                  href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="font-semibold underline hover:text-yellow-900"
                >
                  Register instead →
                </Link>
              </p>
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-brand-50 p-4">
              <p className="text-sm font-medium text-brand-800">{message}</p>
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">{info}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Email input — separated, with visible label */}
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-base focus:outline-none focus:ring-brand-500 focus:border-brand-500 shadow-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password input — separated, with visible label */}
          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-base focus:outline-none focus:ring-brand-500 focus:border-brand-500 shadow-sm"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors min-h-[52px]"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {showResend && (
            <button
              type="button"
              onClick={handleResend}
              className="w-full text-sm font-medium text-brand-600 hover:text-brand-500"
            >
              Resend confirmation email
            </button>
          )}

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-500">
              Forgot password?
            </Link>
            <Link href="/register" className="font-medium text-brand-600 hover:text-brand-500">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
