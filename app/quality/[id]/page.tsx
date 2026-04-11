import type { Metadata } from 'next';
import Link from 'next/link';
import { QUALITY_LEVEL_LABELS, AFIA_GRADE_LABELS } from '@/lib/constants';

interface QualityDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: QualityDetailPageProps): Promise<Metadata> {
  return {
    title: `Quality Tier ${params.id}`,
    description: 'Feed test and quality tier detail.',
  };
}

export default async function QualityDetailPage({ params }: QualityDetailPageProps) {
  const { id } = params;

  // TODO: const tier = await getQualityTierById(id);
  // if (!tier) notFound();

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/quality" className="hover:text-brand-600">Quality</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{id}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier summary */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quality Tier</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Linked to listing:{' '}
                  <Link href="/listings" className="text-brand-600 hover:underline">
                    View Listing
                  </Link>
                </p>
              </div>
              <span className="badge-green shrink-0">Verified</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
              {[
                { label: 'Quality Level', value: '—' },
                { label: 'AFIA Grade',    value: '—' },
                { label: 'Compliant',     value: '—' },
                { label: 'Feed Tests',    value: '—' },
                { label: 'Created',       value: '—' },
                { label: 'Updated',       value: '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feed test results */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Feed Test Results</h2>

            {/* Nutritional table placeholder */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Parameter</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Value</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Unit</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { param: 'Dry Matter',             unit: '%' },
                    { param: 'Moisture',               unit: '%' },
                    { param: 'Crude Protein',          unit: '% DM' },
                    { param: 'Metabolisable Energy',   unit: 'MJ/kg DM' },
                    { param: 'NDF',                    unit: '% DM' },
                    { param: 'ADF',                    unit: '% DM' },
                    { param: 'Digestibility',          unit: '%' },
                    { param: 'RFV',                    unit: '' },
                    { param: 'Ash',                    unit: '% DM' },
                  ].map(({ param, unit }) => (
                    <tr key={param} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">{param}</td>
                      <td className="px-4 py-3 text-gray-500">—</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{unit}</td>
                      <td className="px-4 py-3 text-gray-500">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Certificate</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500 mb-4">
              No certificate uploaded
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Lab Name</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Test Date</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verified</span>
                <span className="font-medium">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
