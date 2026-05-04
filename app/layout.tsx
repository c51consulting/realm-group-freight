import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'hay marketplace',
    'fodder trading',
    'grain market',
    'agricultural marketplace',
    'feed testing',
    'weighbridge',
    'freight',
    'Australia',
  ],
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Header userEmail={user?.email ?? null} />
        <main>{children}</main>
        <footer className="border-t bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <nav className="flex gap-4">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/trust-and-safety">Trust &amp; Safety</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}


