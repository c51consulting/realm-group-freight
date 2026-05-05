'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const MIN_PASSWORD_LENGTH = 8

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase emits PASSWORD_RECOVERY when arriving from a reset link.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // Also flip ready=true if there is already a session (token exchange done)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message || 'Unable to update password. Please try again.')
        return
      }
      setInfo('Password updated. Redirecting to sign in...')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) {
      setError(err?.message || 'Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-2xl font-semibold mb-2 text-center">Set a new password</h1>
        <p className="text-sm text-white/80 mb-6 text-center">
          Choose a new password for your account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">New password</label>
            <input
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 border border-white/30 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm new password</label>
            <input
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 border border-white/30 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          {!ready && (
            <p className="text-sm text-amber-100 bg-amber-900/40 rounded-lg px-3 py-2">
              Waiting for password recovery session... please open this page from the link in your email.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-200 bg-red-900/40 rounded-lg px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-sm text-emerald-100 bg-emerald-900/40 rounded-lg px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>

          <div className="text-center text-sm">
            <Link href="/login" className="underline hover:text-emerald-200">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
