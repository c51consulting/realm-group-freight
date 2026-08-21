import Link from 'next/link'

export const dynamic = 'force-dynamic'

const MIN_PASSWORD_LENGTH = 8

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

function param(searchParams: PageProps['searchParams'], key: string) {
  const value = searchParams?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default function RegisterPage({ searchParams }: PageProps) {
  const error = param(searchParams, 'error')
  const info = param(searchParams, 'info')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" className="fill-brand-500" />
              <path d="M16 6v20M10 10c0 0 2 2 6 2s6-2 6-2M10 16c0 0 2 2 6 2s6-2 6-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold text-gray-900">REALM Group Freight</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Buy and sell hay, grain, livestock, and equipment across Australia.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form action="/api/auth/register" method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg px-3 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full rounded-lg px-3 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full rounded-lg px-3 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
            >
              Create account
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/login" className="text-brand-600 hover:underline">
                Already have an account? Sign in
              </Link>
              <Link href="/forgot-password" className="text-gray-500 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
