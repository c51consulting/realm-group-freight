import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'REALM Ag Marketplace — Trade Hay, Grain & Fodder',
};

const MATERIAL_TYPES = [
  { label: 'Hay', emoji: '🌾', href: '/listings?materialType=hay' },
  { label: 'Grain', emoji: '🌽', href: '/listings?materialType=grain' },
  { label: 'Silage', emoji: '🌿', href: '/listings?materialType=silage' },
  { label: 'Straw', emoji: '🪨', href: '/listings?materialType=straw' },
  { label: 'Pellets', emoji: '🟤', href: '/listings?materialType=pellets' },
  { label: 'Fertiliser', emoji: '🧪', href: '/listings?materialType=fertiliser' },
  { label: 'Seed', emoji: '🌱', href: '/listings?materialType=seed' },
  { label: 'Supplements', emoji: '💊', href: '/listings?materialType=supplement' },
];

const FEATURES = [
  {
    title: 'Weighbridge Integration',
    description:
      'Connect directly to your weighbridge software, upload CSV exports, or photograph dockets for OCR parsing.',
    icon: '⚖️',
  },
  {
    title: 'Feed Test QA',
    description:
      'Attach lab certificates or on-farm NIR results. Listings auto-upgrade to Verified or Performance grade.',
    icon: '🔬',
  },
  {
    title: 'Escrow Payments',
    description:
      'Payment is held until delivery is confirmed. 5% platform fee only on completed trades.',
    icon: '🔒',
  },
  {
    title: 'Freight Marketplace',
    description:
      'Post freight jobs or find loads. Carriers bid on jobs and are paid through the same escrow system.',
    icon: '🚛',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-page py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Australia&apos;s Agricultural Marketplace
          </h1>
          <p className="text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto mb-8">
            Trade hay, grain, fodder, silage and bulk inputs by weight, bale, bag or tonne.
            Built-in weighbridge integration, feed testing QA, and escrow payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/listings" className="btn btn-lg bg-white text-brand-700 hover:bg-brand-50">
              Browse Listings
            </Link>
            <Link href="/listings/create" className="btn btn-lg border border-white text-white hover:bg-brand-600">
              Post a Listing
            </Link>
          </div>
        </div>
      </section>

      {/* Material categories */}
      <section className="section bg-white border-b border-gray-100">
        <div className="container-page">
          <h2 className="text-center mb-8 text-gray-800">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MATERIAL_TYPES.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className="card card-body flex flex-col items-center gap-2 hover:border-brand-400 hover:shadow-md transition-all text-center"
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="font-medium text-gray-700">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container-page">
          <h2 className="text-center mb-2 text-gray-800">Why REALM?</h2>
          <p className="text-center text-gray-500 mb-10">
            Purpose-built for Australian agricultural trade
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-body">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-earth-50 border-t border-earth-100">
        <div className="container-page text-center">
          <h2 className="mb-3">Ready to trade?</h2>
          <p className="text-gray-500 mb-6">
            Join thousands of Australian farmers, traders and carriers on REALM.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary btn-lg">
              Create Free Account
            </Link>
            <Link href="/auth/login" className="btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
