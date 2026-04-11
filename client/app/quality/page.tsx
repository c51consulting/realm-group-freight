import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quality Tiers',
  description: 'REALM Ag Marketplace quality assurance tiers — Basic, Verified, and Performance.',
};

const TIERS = [
  {
    level: 'basic',
    label: 'Basic',
    colour: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    icon: '📋',
    description: 'Suitable for spot trades and small volumes. Seller-provided estimates or on-farm NIR results.',
    requirements: [
      'On-farm NIR result or vendor estimate',
      'No independent verification required',
      'Suitable for small/spot trades',
    ],
    dealSize: 'Small / spot',
  },
  {
    level: 'verified',
    label: 'Verified',
    colour: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: '🔬',
    description: 'At least one independent lab feedtest attached. Listing auto-upgrades when a lab test is added.',
    requirements: [
      'Minimum 1 accredited lab feedtest',
      'On-farm NIR result also accepted',
      'Certificate uploaded to listing',
      'Suitable for medium / seasonal volumes',
    ],
    dealSize: 'Medium / seasonal',
  },
  {
    level: 'performance',
    label: 'Performance',
    colour: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
    icon: '🏆',
    description: 'Highest standard. Lab feedtest mandatory with AFIA grade. Required for large or performance-based contracts.',
    requirements: [
      'Accredited lab feedtest mandatory',
      'AFIA grade (A1–D) required',
      'Full nutritional panel (CP, ME, NDF, ADF)',
      'Suitable for large / performance contracts',
    ],
    dealSize: 'Large / performance',
  },
];

const AFIA_GRADES = [
  { grade: 'A1', description: 'Premium — highest nutritional value' },
  { grade: 'A2', description: 'Good — high nutritional value' },
  { grade: 'B1', description: 'Fair — moderate nutritional value' },
  { grade: 'B2', description: 'Fair — moderate nutritional value' },
  { grade: 'C1', description: 'Low — lower nutritional value' },
  { grade: 'C2', description: 'Low — lower nutritional value' },
  { grade: 'D', description: 'Poor — minimal nutritional value' },
  { grade: 'Ungraded', description: 'Not graded by AFIA standard' },
];

export default function QualityPage() {
  return (
    <div className="container-page section">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Quality Assurance Tiers</h1>
          <p className="mt-3 text-gray-500">
            REALM uses three quality tiers to match the level of evidence to the size and risk of each trade.
          </p>
        </div>

        {/* Tiers */}
        <div className="space-y-4 mb-12">
          {TIERS.map((tier) => (
            <div key={tier.level} className={`card border-2 ${tier.colour}`}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{tier.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{tier.label}</h2>
                      <span className={`badge ${tier.badge}`}>{tier.dealSize}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{tier.description}</p>
                    <ul className="space-y-1">
                      {tier.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AFIA grades */}
        <div className="card card-body mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">AFIA Hay Grades</h2>
          <p className="text-sm text-gray-500 mb-4">
            The Australian Fodder Industry Association (AFIA) grading system is used for Performance-tier listings.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {AFIA_GRADES.map((g) => (
              <div key={g.grade} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <span className="font-bold text-brand-700 w-12">{g.grade}</span>
                <span className="text-sm text-gray-600">{g.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/listings" className="btn-primary btn-lg">
            Browse Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
