import type { Metadata } from 'next';
import Link from 'next/link';
import { FREIGHT_JOB_STATUS_LABELS, MATERIAL_TYPE_LABELS } from '@/lib/constants';

interface FreightDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: FreightDetailPageProps): Promise<Metadata> {
  return {
    title: `Freight Job ${params.id}`,
    description: 'Agricultural freight job detail.',
  };
}

export default async function FreightDetailPage({ params }: FreightDetailPageProps) {
  const { id } = params;

  // TODO: const job = await getFreightJobById(id);
  // if (!job) notFound();

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/freight" className="hover:text-brand-600">Freight</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{id}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Freight Job</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Posted by <span className="font-medium text-gray-700">Poster Name</span>
                </p>
              </div>
              <span className="badge-blue shrink-0">Open</span>
            </div>

            {/* Route */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pickup</p>
                  <p className="font-medium text-gray-900">—</p>
                </div>
                <div className="text-gray-400 text-2xl">→</div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery</p>
                  <p className="font-medium text-gray-900">—</p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              {[
                { label: 'Material',         value: '—' },
                { label: 'Est. Weight',      value: '—' },
                { label: 'Required By',      value: '—' },
                { label: 'Offered Rate',     value: '—' },
                { label: 'Status',           value: '—' },
                { label: 'Carrier',          value: 'Unassigned' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 text-sm leading-relaxed">No notes provided.</p>
            </div>
          </div>

          {/* Linked order */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Linked Order</h2>
            <p className="text-sm text-gray-500">No order linked to this freight job.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">$—</p>
              <p className="text-sm text-gray-500">offered rate</p>
            </div>

            <div className="space-y-3">
              <button type="button" className="btn-primary w-full">
                Accept Job
              </button>
              <button type="button" className="btn-secondary w-full">
                Make Counter Offer
              </button>
            </div>

            <div className="section-divider" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Required by</span>
                <span className="font-medium">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
