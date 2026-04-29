import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import Link from 'next/link';

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
                          <main className="flex-1">{children}</main>main>
                          <footer className="bg-white border-t border-gray-200 mt-auto">
                                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                                              <div className="col-span-1 md:col-span-1">
                                                                              <h3 className="text-lg font-bold text-gray-900 mb-4">{APP_NAME}</h3>h3>
                                                                              <p className="text-sm text-gray-500 leading-relaxed">
                                                                                                Australia&apos;s trusted agricultural materials marketplace. 
                                                                                    </body>
