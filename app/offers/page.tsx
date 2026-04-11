import type { Metadata } from 'next';
import Link from 'next/link';
import { OFFER_STATUS_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Offers',
  description: 'Manage your offers and negotiations.',
};

interface OffersPageProps {
  searchParams?: {
    status?: string;
    listingId?: string;
    page?: string;
  };
}

export default function OffersPage({ searchParams }: OffersPageProps) {
  const { status, listingId } = searchParams ?? {};

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">
            Track and manage offers on listings.
          </p>
        </div>
        <Link href="/listings" className="btn-secondary self-start sm:self-auto">
          Browse Listings
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { value: '',          label: 'All' },
          { value: 'pending',   label: 'Pending' },
          { value: 'accepted',  label: 'Accepted' },
          { value: 'rejected',  label: 'Rejected' },
          { value: 'withdrawn', label: 'Withdrawn' },
          { value: 'expired',   label: 'Expired' },
        ].map(({ value, label }) => {
          const active = (status ?? '') === value;
          return (
            <Link
              key={value}
              href={value ? `/offers?status=${value}` : '/offers'}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
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

      {listingId && (
        <div className="mb-4">
          <span className="badge-blue">
            Filtered by listing: {listingId}
          </span>
          <Link href="/offers" className="ml-2 text-xs text-gray-500 hover:text-gray-700">
            ✕ Clear
          </Link>
        </div>
      )}

      {/* Empty state — replace with real data fetch */}
      <div className="empty-state card py-20">
        <span className="text-5xl mb-4">🤝</span>
        <p className="empty-state-title">No offers found</p>
        <p className="empty-state-description">
          Offers you make or receive on listings will appear here.
        </p>
        <Link href="/listings" className="btn-primary mt-6">
          Browse Listings
        </Link>
      </div>

      {/*
        TODO: Replace with real data fetch.
        const { data: offers } = await getOffers(page, pageSize);
        offers.map(offer => <OfferRow key={offer.id} offer={offer} />)
      */}
    </div>
  );
}
