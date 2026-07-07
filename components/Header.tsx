'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from './Navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/Screenshot_25-12-2025_234539_chatgpt.com.jpeg"
              alt="REALM Group Global"
              width={160}
              height={48}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Navigation />
          </div>

          {/* Desktop CTA / Auth */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://www.payintime.global"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-yellow-300 bg-yellow-300 px-3 py-2 text-sm font-extrabold uppercase text-gray-950 shadow-sm transition-colors hover:border-lime-300 hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400"
              aria-label="Need finance - check out Pay In Time"
            >
              <span className="lg:hidden">Finance</span>
              <span className="hidden lg:inline xl:hidden">Need finance</span>
              <span className="hidden xl:inline">Need finance - Pay In Time</span>
            </a>
            {user ? (
              <>
                <Link
                  href="/listings/new"
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  + Post Listing
                </Link>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4">
          <Navigation mobile onNavigate={() => setMobileOpen(false)} />
          <a
            href="https://www.payintime.global"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-center px-4 py-4 rounded-md border border-yellow-300 bg-yellow-300 text-base font-extrabold uppercase text-gray-950 shadow-sm transition-colors hover:border-lime-300 hover:bg-lime-300 mt-4"
          >
            Need finance - check out Pay In Time
          </a>
          {user ? (
            <>
              <Link
                href="/listings/new"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-4 rounded-lg bg-brand-600 text-white text-base font-medium hover:bg-brand-700 transition-colors mt-2"
              >
                + Post Listing
              </Link>
              <p className="text-sm text-gray-600 text-center mt-2">{user.email}</p>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-center px-4 py-4 rounded-lg border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-4 rounded-lg border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors mt-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-4 rounded-lg bg-brand-600 text-white text-base font-medium hover:bg-brand-700 transition-colors mt-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
