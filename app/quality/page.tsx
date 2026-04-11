import type { Metadata } from 'next';
import Link from 'next/link';
import {
  QUALITY_LEVEL_LABELS,
  QUALITY_LEVEL_DESCRIPTIONS,
  QUALITY_LEVEL_REQUIREMENTS,
  AFIA_GRADE_LABELS,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Quality Tiers',
  description: 'Feed-testing quality tiers and AFIA grades for agricultural materials.',
};

export default function QualityPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Quality Tiers &amp; Feed Testing</h1>
        <p className="page-subtitle">
          AFIA-graded quality assurance for hay, fodder and grain listings.
        </p>
      </div>

      {/* Quality tier overview */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Levels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(QUALITY_LEVEL_LABELS).map(([level, label]) => {
            const req = QUALITY_LEVEL_REQUIREMENTS[level as keyof typeof QUALITY_LEVEL_REQUIREMENTS];
            const colorMap: Record<string, string> = {
              basic: 'border-gray-200 bg-gray-50',
              verified: 'border-blue-200 bg-blue-50',
              performance: 'border-brand-200 bg-brand-50',
            };
            const badgeMap: Record<string, string> = {
              basic: 'badge-gray',
              verified: 'badge-blue',
              performance: 'badge-green',
            };
            return (
              <div key={level} className={`card p-6 border-2 ${colorMap[level]}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <span className={badgeMap[level]}>{label}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {QUALITY_LEVEL_DESCRIPTIONS[level as keyof typeof QUALITY_LEVEL_DESCRIPTIONS]}
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>
                    ✓ Lab tests required:{' '}
                    <span className="font-medium text-gray-700">
                      {req.minLabTests === 0 ? 'None' : `${req.minLabTests}+`}
                    </span>
                  </li>
                  <li>
                    ✓ On-farm NIR:{' '}
                    <span className="font-medium text-gray-700">
                      {req.nirRequired ? 'Required' : 'Optional'}
                    </span>
                  </li>
                  <li>
                    ✓ AFIA grade:{' '}
                    <span className="font-medium text-gray-700">
                      {req.afiaRequired ? 'Required' : 'Optional'}
                    </span>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* AFIA grades reference */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AFIA Grade Reference</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Grade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(AFIA_GRADE_LABELS).map(([grade, label]) => (
                <tr key={grade} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="badge-gray font-mono">{grade}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quality tier records */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quality Tier Records</h2>
          <Link href="/listings" className="text-sm text-brand-600 hover:text-brand-700">
            View Listings →
          </Link>
        </div>

        {/* Empty state — replace with real data fetch */}
        <div className="empty-state card py-20">
          <span className="text-5xl mb-4">🔬</span>
          <p className="empty-state-title">No quality tier records</p>
          <p className="empty-state-description">
            Quality tiers are created when feed tests are attached to listings.
          </p>
          <Link href="/listings" className="btn-primary mt-6">
            Browse Listings
          </Link>
        </div>

        {/*
          TODO: Replace with real data fetch.
          const { data: tiers } = await getQualityTiers();
          tiers.map(tier => <QualityTierCard key={tier.id} tier={tier} />)
        */}
      </section>
    </div>
  );
}
