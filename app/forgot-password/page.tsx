'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        setError(error.message || 'Unable to send reset email. Please try again.')
        return
      }

      setInfo(
        'If an account exists for that email, a password reset link has been sent. Please check your inbox.'
      )
    } catch (err: any) {
      setError(err?.message || 'Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-2xl font-semibold mb-2 text-center">Forgot your password?</h1>
        <p className="text-sm text-white/80 mb-6 text-center">
          Enter your email and we'll send you a link to reset it.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 border border-white/30 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-sm text-red-200 bg-red-900/40 rounded-lg px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-sm text-emerald-100 bg-emerald-900/40 rounded-lg px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="underline hover:text-emerald-200">
              Back to sign in
            </Link>
            <Link href="/register" className="underline hover:text-emerald-200">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
