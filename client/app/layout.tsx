import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { NotificationProvider } from '@/lib/context/NotificationContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: {
    default: 'REALM Ag Marketplace',
    template: '%s | REALM Ag Marketplace',
  },
  description:
    'Trade hay, grain, fodder, silage and agricultural inputs by weight, bale, bag or tonne. Built-in weighbridge integration, feed testing QA, and escrow payments.',
  keywords: ['hay', 'grain', 'fodder', 'agricultural marketplace', 'Australia', 'REALM'],
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: 'REALM Ag Marketplace',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <footer className="bg-white border-t border-gray-200 mt-16">
              <div className="container-page py-8 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} REALM Group Global. All rights reserved.
              </div>
            </footer>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
