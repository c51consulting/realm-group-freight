import type { Metadata } from 'next';
import Link from 'next/link';
import { OFFER_STATUS_LABELS } from '@/lib/constants';

interface OfferDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: OfferDetailPageProps): Promise<Metadata> {
  return {
    title: `Offer ${params.id}`,
    description: 'Offer detail and negotiation.',
  };
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = params;

  // TODO: const offer = await getOfferById(id);
  // if (!offer) notFound();

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/offers" className="hover:text-brand-600">Offers</Link></li>
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
                <h1 className="text-2xl font-bold text-gray-900">Offer Detail</h1>
                <p className="text-gray-500 text-sm mt-1">
                  On listing:{' '}
                  <Link href="/listings" className="text-brand-600 hover:underline">
                    View Listing
                  </Link>
                </p>
              </div>
              <span className="badge-yellow shrink-0">Pending</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              {[
                { label: 'Price / Unit',     value: '—' },
                { label: 'Quantity',         value: '—' },
                { label: 'Total Price',      value: '—' },
                { label: 'Freight Included', value: '—' },
                { label: 'Delivery Date',    value: '—' },
                { label: 'Expires',          value: '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Message</h2>
              <p className="text-gray-600 text-sm leading-relaxed">No message provided.</p>
            </div>
          </div>

          {/* Buyer info */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Buyer</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                ?
              </div>
              <div>
                <p className="font-medium text-gray-900">—</p>
                <p className="text-sm text-gray-500">—</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — actions */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button type="button" className="btn-primary w-full">
                Accept Offer
              </button>
              <button type="button" className="btn-secondary w-full">
                Reject Offer
              </button>
              <button type="button" className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50">
                Withdraw Offer
              </button>
            </div>

            <div className="section-divider" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">Pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expires</span>
                <span className="font-medium">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
