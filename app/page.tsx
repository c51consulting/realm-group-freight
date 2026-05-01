import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} — Agricultural Materials Marketplace`,
  description: APP_DESCRIPTION,
};

const FEATURE_CARDS = [
  {
    title: 'Hay, Grain & Fodder',
    description:
      'Browse and post listings for hay, straw, silage, grain, seed, pellets and fertiliser.',
    href: '/listings',
    cta: 'Browse Listings',
  },
  {
    title: 'Livestock',
    description:
      'Connect with verified buyers and sellers for cattle, sheep, and other livestock.',
    href: '/livestock',
    cta: 'View Livestock',
  },
    {
  title: 'Equipment',
  description: 'Buy and sell agricultural equipment and machinery — tractors, balers, trailers, spreaders and more.',
  href: '/equipment',
  cta: 'View Equipment',
},
  {
    title: 'Freight & Logistics',
    description:
      'Arrange freight with integrated weighbridge data and tracked deliveries.',
    href: '/freight',
    cta: 'Plan Freight',
  },
  {
    title: 'Secure Payments',
    description:
      'Funds held in trust until delivery is verified. Powered by Stripe.',
    href: '/trust-and-safety',
    cta: 'Learn More',
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-50">
            {APP_DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center rounded-md bg-white text-brand-700 px-5 py-3 font-semibold hover:bg-brand-50"
            >
              Browse Listings
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-white/60 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          What you can do on {APP_NAME}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 flex-1">
                {card.description}
              </p>
              <Link
                href={card.href}
                className="mt-4 inline-flex items-center text-brand-700 font-medium hover:text-brand-800"
              >
                {card.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

