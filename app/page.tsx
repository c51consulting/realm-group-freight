import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_DESCRIPTION, MATERIAL_TYPE_LABELS, NAV_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} — Agricultural Materials Marketplace`,
  description: APP_DESCRIPTION,
};

const FEATURE_CARDS = [
  {
    icon: '🌾',
    title: 'Hay, Grain & Fodder',
    description:
      'Browse and post listings for hay, straw, silage, grain, seed, pellets, fertiliser and more.',
    href: '/listings',
    cta: 'Browse Listings',
  },
  {
    icon: '🚛',
    title: 'Freight Jobs',
    description:
      'Find carriers or post freight jobs for agricultural loads. Integrated with weighbridge data.',
    href: '/freight',
    cta: 'View Freight',
  },
  {
    icon: '🔬',
    title: 'Feed Testing & Quality',
    description:
      'AFIA-graded quality tiers with lab certificates, on-farm NIR results and verified feed tests.',
    href: '/quality',
    cta: 'Quality Tiers',
  },
  {
    icon: '🤝',
    title: 'Offers & Negotiations',
    description:
      'Submit, accept or negotiate offers directly on listings. Transparent pricing for all parties.',
    href: '/offers',
    cta: 'View Offers',
  },
  {
    icon: '📦',
    title: 'Escrow Orders',
    description:
      'Secure escrow payments held until delivery is confirmed. 5% platform fee on completion.',
    href: '/orders',
    cta: 'View Orders',
  },
  {
    icon: '⚖️',
    title: 'Weighbridge Integration',
    description:
      'Ingest weigh events via API, CSV, OCR photo or manual entry. Full audit trail per order.',
    href: '/orders',
    cta: 'Learn More',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Australia&apos;s Agricultural Materials Marketplace
            </h1>
            <p className="text-xl text-brand-100 mb-10 leading-relaxed">
              Trade hay, fodder, grain, silage, seed and bulk inputs by weight, bale, bag or tonne.
              Built-in weighbridge integration, feed-testing QA and escrow payments.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/listings"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-brand-700 font-semibold hover:bg-brand-50 transition-colors shadow-sm"
              >
                Browse Listings
              </Link>
              <Link
                href="/listings/create"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold border border-brand-400 hover:bg-brand-400 transition-colors"
              >
                Post a Listing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Material type quick-links */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
              <Link
                key={value}
                href={`/listings?materialType=${value}`}
                className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="page-container">
        <div className="page-header text-center">
          <h2 className="page-title">Everything you need to trade agricultural materials</h2>
          <p className="page-subtitle mt-2 text-base">
            From listing to delivery — quality-assured, weighbridge-verified, escrow-protected.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_CARDS.map((card) => (
            <div key={card.href + card.title} className="card p-6 flex flex-col gap-4">
              <div className="text-4xl">{card.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
              </div>
              <Link
                href={card.href}
                className="mt-auto text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {card.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Order flow */}
      <section className="bg-white border-t border-gray-200">
        <div className="page-container">
          <div className="page-header text-center">
            <h2 className="page-title">How it works</h2>
          </div>
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { step: '1', label: 'Post Listing' },
              { step: '2', label: 'Receive Offers' },
              { step: '3', label: 'Accept & Pay' },
              { step: '4', label: 'In Transit' },
              { step: '5', label: 'Weigh & Deliver' },
              { step: '6', label: 'Release Payment' },
            ].map(({ step, label }) => (
              <li key={step} className="flex flex-col items-center gap-2">
                <span className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm">
                  {step}
                </span>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
