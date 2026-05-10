import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OFFER_STATUS_LABELS, MATERIAL_TYPE_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Offers',
  description: 'Manage your offers and negotiations.',
};

interface PageProps {
  searchParams?: { status?: string };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    accepted:  'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-600',
    expired:   'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS] || status}
    </span>
  );
}

export default async function OffersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/offers');

  const status = searchParams?.status || '';

  let query = supabase
    .from('offers')
    .select(`
      *,
      listing:listings!listing_id(id, title, material_type, price_per_unit, unit_type, pickup_address)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data: offers, error } = await query;

  const statusTabs = [
    { value: '',          label: 'All' },
    { value: 'pending',   label: 'Pending' },
    { value: 'accepted',  label: 'Accepted' },
    { value: 'rejected',  label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'expired',   label: 'Expired' },
  ];

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">Track and manage your offers on listings.</p>
        </div>
        <Link href="/listings" className="btn-secondary self-start sm:self-auto">
          Browse Listings
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {statusTabs.map(({ value, label }) => {
          const active = status === value;
          return (
            <Link
              key={value}
              href={value ? `/offers?status=${value}` : '/offers'}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                active
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm mb-4">
          Error loading offers: {error.message}
        </div>
      )}

      {!offers || offers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {status ? `No ${OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS]?.toLowerCase() || status} offers` : 'No offers yet'}
          </h2>
          <p className="text-gray-500 mb-4 text-sm">
            Browse listings and make an offer to get started.
          </p>
          <Link href="/listings" className="btn-primary inline-block">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const listing = offer.listing as any;
            const materialLabel = listing?.material_type
              ? MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type
              : '';
            const suburb = listing?.pickup_address?.suburb || '';
            const state = listing?.pickup_address?.state || '';

            return (
              <div key={offer.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={offer.status} />
                      {materialLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                          {materialLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {listing?.title || 'Listing'}
                    </h3>
                    {(suburb || state) && (
                      <p className="text-xs text-gray-500 mt-0.5">{[suburb, state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(offer.total_price || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-medium text-gray-900">{offer.quantity} {listing?.unit_type || 'units'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price/Unit</p>
                    <p className="font-medium text-gray-900">
                      {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(offer.price_per_unit || 0)}
                    </p>
                  </div>
                  {offer.freight_price > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Freight</p>
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(offer.freight_price)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {new Date(offer.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {offer.message && (
                  <p className="mt-3 text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">{offer.message}</p>
                )}

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  {listing?.id && (
                    <Link href={`/listings/${listing.id}`} className="text-sm text-brand-600 hover:underline">
                      View listing →
                    </Link>
                  )}
                  <Link href={`/offers/${offer.id}`} className="text-sm text-gray-500 hover:text-gray-700">
                    Offer details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
