'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

const NAV_LINKS = [
  { href: '/listings', label: 'Listings' },
  { href: '/freight', label: 'Freight' },
  { href: '/quality', label: 'Quality Tiers' },
];

const AUTH_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/offers', label: 'My Offers' },
  { href: '/orders', label: 'My Orders' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-brand-700 text-lg">
            <span className="text-2xl">🌾</span>
            <span className="hidden sm:inline">REALM Ag</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                {AUTH_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(l.href)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="btn-secondary btn-sm ml-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav
            className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-1"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(l.href) ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="border-t border-gray-100 my-2" />
                {AUTH_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(l.href) ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-100 my-2" />
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-lg">
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
