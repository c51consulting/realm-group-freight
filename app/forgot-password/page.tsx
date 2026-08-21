import Link from 'next/link'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

function param(searchParams: PageProps['searchParams'], key: string) {
  const value = searchParams?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default function ForgotPasswordPage({ searchParams }: PageProps) {
  const error = param(searchParams, 'error')
  const info = param(searchParams, 'info')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-2xl font-semibold mb-2 text-center">Forgot your password?</h1>
        <p className="text-sm text-white/80 mb-6 text-center">
          Enter your email and we'll send you a link to reset it.
        </p>
        <form action="/api/auth/forgot-password" method="post" className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
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
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Send reset link
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
