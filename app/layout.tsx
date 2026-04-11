import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} REALM Group Global. All rights reserved.</p>
              <p>
                Agricultural materials marketplace — hay, fodder, grain, silage, seed &amp; more.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
