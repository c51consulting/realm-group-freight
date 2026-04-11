'use client';

import { use } from 'react';
import Link from 'next/link';
import { useListing } from '@/lib/hooks/useListings';
import { useAuth } from '@/lib/context/AuthContext';
import OfferForm from '@/components/OfferForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { formatCurrency, formatDate, starRating } from '@/lib/client-utils';

interface FreightDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FreightDetailPage({ params }: FreightDetailPageProps) {
  const { id } = use(params);
  const { listing, loading, error, refresh } = useListing(id);
  const { user } = useAuth();

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !listing) {
    return (
      <div className="container-page section">
        <ErrorMessage message={error ?? 'Freight job not found'} />
        <Link href="/freight" className="btn-secondary mt-4">← Back to freight</Link>
      </div>
    );
  }

  const seller = listing.seller;
  const isSeller = user?.id === listing.sellerId;

  return (
    <div className="container-page section">
      <Link href="/freight" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← Back to freight jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="badge bg-indigo-100 text-indigo-700 mb-2">Freight Job</span>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          </div>

          <div className="card card-body">
            <h2 className="font-semibold text-gray-900 mb-3">Job Details</h2>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              {listing.pricePerUnit && (
                <div>
                  <dt className="text-gray-500">Budget</dt>
                  <dd className="font-bold text-lg text-brand-700">{formatCurrency(listing.pricePerUnit)}</dd>
                </div>
              )}
              {listing.deliveryRadius && (
                <div>
                  <dt className="text-gray-500">Distance</dt>
                  <dd className="font-medium">{listing.deliveryRadius} km</dd>
                </div>
              )}
              {listing.expiresAt && (
                <div>
                  <dt className="text-gray-500">Closes</dt>
                  <dd className="font-medium">{formatDate(listing.expiresAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {listing.description && (
            <div className="card card-body">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{listing.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {seller && (
            <div className="card card-body">
              <h3 className="font-semibold text-gray-900 mb-3">Posted by</h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                  {seller.businessName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{seller.businessName}</p>
                  {seller.rating > 0 && (
                    <p className="text-xs text-yellow-500">{starRating(seller.rating)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isSeller && listing.status === 'active' && (
            <OfferForm listing={listing} onSuccess={refresh} />
          )}
        </div>
      </div>
    </div>
  );
}
