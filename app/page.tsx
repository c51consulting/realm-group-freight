import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'REALM Group Freight — Australia\'s Agricultural Marketplace',
  description:
    'Buy and sell hay, grain, silage, livestock, and equipment across Australia. Verified quality testing, integrated freight, and secure escrow payments.',
  keywords: [
    'hay marketplace Australia',
    'grain trading platform',
    'livestock marketplace',
    'agricultural equipment',
    'farm fodder marketplace',
    'escrow payments agriculture',
  ],
};

const CATEGORIES = [
  {
    title: 'Hay, Grain & Fodder',
    emoji: '🌾',
    description: 'Browse and post listings for hay, straw, silage, grain, seed, pellets and fertiliser.',
    href: '/listings',
    cta: 'Browse Listings',
    colour: 'bg-amber-50 border-amber-200',
  },
  {
    title: 'Livestock',
    emoji: '🐄',
    description: 'Connect with verified buyers and sellers for cattle, sheep, goats, and other livestock.',
    href: '/livestock',
    cta: 'View Livestock',
    colour: 'bg-green-50 border-green-200',
  },
  {
    title: 'Equipment',
    emoji: '🚜',
    description: 'Buy and sell agricultural machinery — tractors, balers, trailers, spreaders and more.',
    href: '/equipment',
    cta: 'View Equipment',
    colour: 'bg-blue-50 border-blue-200',
  },
  {
    title: 'Freight & Logistics',
    emoji: '🚛',
    description: 'Arrange transport with integrated weighbridge data and real-time delivery tracking.',
    href: '/freight',
    cta: 'Plan Freight',
    colour: 'bg-purple-50 border-purple-200',
  },
];

const TRUST_ITEMS = [
  {
    icon: '🔒',
    title: 'Secure Escrow Payments',
    desc: 'Funds are held in trust by Stripe until delivery is verified. Sellers receive payment only after the buyer confirms receipt. 5% platform fee applies.',
  },
  {
    icon: '🧪',
    title: 'Verified Quality Testing',
    desc: 'Three quality tiers: Basic (on-farm NIR), Verified (lab feed test + NIR), and Performance (mandatory AFIA-graded lab test). Listings display grade prominently.',
  },
  {
    icon: '⚖️',
    title: 'Weighbridge Integration',
    desc: 'Actual delivered weights captured via certified weighbridge integration. Buyers pay for what\'s delivered, not what\'s listed.',
  },
  {
    icon: '⚡',
    title: 'Fast Dispute Resolution',
    desc: 'Quality or weight disputes are handled within 48 hours. Evidence is collected at weighbridge and delivery. Both parties are protected.',
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Register & verify', desc: 'Create your account as a buyer, seller, or both. ABN verification is required for selling.' },
  { step: '2', title: 'Post or browse', desc: 'List your product with quality grade, price, and location — or browse listings by category, region, and quality.' },
  { step: '3', title: 'Make or receive an offer', desc: 'Negotiate via offers or accept a fixed price. All offers are tracked and timestamped.' },
  { step: '4', title: 'Arrange freight', desc: 'Organise your own transport or use our integrated freight marketplace. Weighbridge data is captured at load.' },
  { step: '5', title: 'Payment held in escrow', desc: 'Buyer\'s funds are held securely by Stripe until delivery is confirmed. No risk on either side.' },
  { step: '6', title: 'Confirm and complete', desc: 'Buyer confirms delivery and quality. Funds released to seller. Both parties rate the transaction.' },
];

const STATS = [
  { value: '11', label: 'Material categories' },
  { value: '5%', label: 'Platform fee' },
  { value: 'AFIA', label: 'Quality grading' },
  { value: 'Stripe', label: 'Secure payments' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-brand-200 text-sm font-semibold tracking-wider uppercase mb-4">
              Part of the REALM Group ecosystem
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Australia&apos;s Agricultural<br />Marketplace
            </h1>
            <p className="mt-5 text-xl text-brand-100 leading-relaxed max-w-2xl">
              Buy and sell hay, grain, silage, livestock, and equipment across Australia —
              with verified quality testing, integrated freight, and secure escrow payments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/listings"
                className="inline-flex items-center rounded-lg bg-white text-brand-700 px-6 py-3 font-semibold hover:bg-brand-50 transition-colors"
              >
                Browse Listings
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-lg border-2 border-white/60 px-6 py-3 font-semibold hover:bg-white/10 transition-colors"
              >
                Post a Listing →
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/20 pt-10">
            {STATS.map((s) => (
              <div key={s.value}>
                <div className="text-3xl font-black">{s.value}</div>
                <div className="text-brand-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What you can trade</h2>
        <p className="text-gray-500 mb-8">Choose a category to browse listings or post your own.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`group rounded-xl border-2 ${cat.colour} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">
                {cat.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{cat.description}</p>
              <span className="text-sm font-semibold text-brand-600">{cat.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How it works</h2>
            <p className="text-gray-500">From listing to payment — a clear, protected process on both sides.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Built for trust</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Agricultural trade involves real money and real risk. Every feature on {APP_NAME} is designed to protect both sides of the transaction.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex gap-4 p-6 rounded-xl border border-gray-200 bg-white">
              <span className="text-3xl flex-shrink-0">{item.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/trust-and-safety" className="text-brand-600 font-semibold hover:underline text-sm">
            Read the full Trust & Safety policy →
          </Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-brand-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to start trading?</h2>
          <p className="text-brand-200 mb-8 text-lg">
            Create a free account and post your first listing in minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-white text-brand-700 px-8 py-3 font-semibold hover:bg-brand-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/listings"
              className="inline-flex items-center rounded-lg border-2 border-white/50 px-8 py-3 font-semibold hover:bg-white/10 transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
