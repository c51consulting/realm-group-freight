import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import Link from 'next/link';

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Header />
        <main>{children}</main>
        <footer className="border-t bg-gray-900 text-gray-400 mt-16">
          <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" className="fill-brand-500" />
                    <path d="M16 6v20M10 10c0 0 2 2 6 2s6-2 6-2M10 16c0 0 2 2 6 2s6-2 6-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="font-bold text-white">REALM Group Freight</span>
                </div>
                <p className="text-sm leading-relaxed">Australia&apos;s agricultural trading platform. Buy and sell with confidence.</p>
                <p className="text-xs mt-3">Part of the <a href="https://realmgroup.global" className="text-brand-400 hover:text-brand-300">REALM Group</a> ecosystem.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Marketplace</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/listings" className="hover:text-white transition-colors">Listings</Link></li>
                  <li><Link href="/livestock" className="hover:text-white transition-colors">Livestock</Link></li>
                  <li><Link href="/equipment" className="hover:text-white transition-colors">Equipment</Link></li>
                  <li><Link href="/freight" className="hover:text-white transition-colors">Freight</Link></li>
                  <li><Link href="/listings/create" className="hover:text-white transition-colors">Post a Listing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Your Account</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                  <li><Link href="/offers" className="hover:text-white transition-colors">Offers</Link></li>
                  <li><Link href="/orders" className="hover:text-white transition-colors">Orders</Link></li>
                  <li><Link href="/quality" className="hover:text-white transition-colors">Quality Reports</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Legal &amp; Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/trust-and-safety" className="hover:text-white transition-colors">Trust &amp; Safety</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs">
              <p>&copy; {new Date().getFullYear()} REALM Group Freight. All rights reserved. Part of REALM Group Global.</p>
              <p>5% platform fee · Escrow via Stripe · AFIA quality grading</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}


