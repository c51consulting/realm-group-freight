'use client';

import { use } from 'react';
import Link from 'next/link';
import { useListing } from '@/lib/hooks/useListings';
import { useAuth } from '@/lib/context/AuthContext';
import OfferForm from '@/components/OfferForm';
import FeedTestUpload from '@/components/FeedTestUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import {
  formatCurrency,
  materialLabel,
  unitLabel,
  qualityLabel,
  qualityColour,
  formatDate,
  starRating,
} from '@/lib/client-utils';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = use(params);
  const { listing, loading, error, refresh } = useListing(id);
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container-page section">
        <ErrorMessage message={error ?? 'Listing not found'} />
        <Link href="/listings" className="btn-secondary mt-4">← Back to listings</Link>
      </div>
    );
  }

  const seller = listing.seller;
  const isSeller = user?.id === listing.sellerId;

  return (
    <div className="container-page section">
      <Link href="/listings" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← Back to listings
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {listing.images && listing.images.length > 0 ? (
            <div className="rounded-xl overflow-hidden bg-gray-100 h-64 sm:h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-earth-100 to-earth-200 h-48 flex items-center justify-center">
              <span className="text-6xl opacity-30">🌾</span>
            </div>
          )}

          {/* Title & badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`badge ${qualityColour(listing.qualityLevel)}`}>
                {qualityLabel(listing.qualityLevel)}
              </span>
              <span className="badge bg-gray-100 text-gray-600 capitalize">{listing.type}</span>
              {listing.pricingType === 'urgent' && (
                <span className="badge bg-red-100 text-red-700">Urgent</span>
              )}
              {listing.freightIncluded && (
                <span className="badge bg-blue-100 text-blue-700">Freight included</span>
              )}
              {listing.loadingAvailable && (
                <span className="badge bg-purple-100 text-purple-700">Loading available</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="text-gray-500 mt-1">
              {materialLabel(listing.materialType)}
              {listing.materialSubtype ? ` · ${listing.materialSubtype}` : ''}
            </p>
          </div>

          {/* Price */}
          <div className="card card-body">
            <div className="flex items-baseline gap-2">
              {listing.pricePerUnit ? (
                <>
                  <span className="text-3xl font-bold text-brand-700">
                    {formatCurrency(listing.pricePerUnit)}
                  </span>
                  <span className="text-gray-500">/ {unitLabel(listing.unitType, listing.unitLabel)}</span>
                </>
              ) : (
                <span className="text-xl font-medium text-gray-500 italic">
                  {listing.pricingType === 'offers' ? 'Offers invited' : 'Price on request'}
                </span>
              )}
            </div>
            {listing.pricePerTonneEquiv && (
              <p className="text-sm text-gray-400 mt-1">
                ≈ {formatCurrency(listing.pricePerTonneEquiv)} / tonne
              </p>
            )}

            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {listing.quantityAvailable && (
                <div>
                  <dt className="text-gray-500">Available</dt>
                  <dd className="font-medium">{listing.quantityAvailable} {unitLabel(listing.unitType)}</dd>
                </div>
              )}
              {listing.minimumOrder && (
                <div>
                  <dt className="text-gray-500">Min. order</dt>
                  <dd className="font-medium">{listing.minimumOrder} {unitLabel(listing.unitType)}</dd>
                </div>
              )}
              {listing.estimatedWeightPerUnit && (
                <div>
                  <dt className="text-gray-500">Est. weight/unit</dt>
                  <dd className="font-medium">{listing.estimatedWeightPerUnit} kg</dd>
                </div>
              )}
              {listing.deliveryRadius && (
                <div>
                  <dt className="text-gray-500">Delivery radius</dt>
                  <dd className="font-medium">{listing.deliveryRadius} km</dd>
                </div>
              )}
              {listing.expiresAt && (
                <div>
                  <dt className="text-gray-500">Expires</dt>
                  <dd className="font-medium">{formatDate(listing.expiresAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="card card-body">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Feed tests */}
          {listing.feedTests && listing.feedTests.length > 0 && (
            <div className="card card-body">
              <h2 className="font-semibold text-gray-900 mb-3">Feed Test Results</h2>
              <div className="space-y-3">
                {listing.feedTests.map((ft) => (
                  <div key={ft.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{ft.source.replace('_', ' ')}</span>
                      {ft.afiaGrade && (
                        <span className="badge bg-brand-100 text-brand-700">AFIA {ft.afiaGrade}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                      {ft.crudeProtein && <span>CP: {ft.crudeProtein}%</span>}
                      {ft.metabolisableEnergy && <span>ME: {ft.metabolisableEnergy} MJ/kg</span>}
                      {ft.dryMatter && <span>DM: {ft.dryMatter}%</span>}
                      {ft.ndf && <span>NDF: {ft.ndf}%</span>}
                      {ft.rfv && <span>RFV: {ft.rfv}</span>}
                    </div>
                    {ft.labName && <p className="text-xs text-gray-400 mt-1">Lab: {ft.labName}</p>}
                    {ft.certificateUrl && (
                      <a href={ft.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                        View certificate →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add feed test (seller only) */}
          {isSeller && (
            <div className="card card-body">
              <h2 className="font-semibold text-gray-900 mb-3">Add Feed Test</h2>
              <FeedTestUpload listingId={listing.id} onSuccess={refresh} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller info */}
          {seller && (
            <div className="card card-body">
              <h3 className="font-semibold text-gray-900 mb-3">Seller</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                  {seller.businessName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{seller.businessName}</p>
                  {seller.verified && (
                    <span className="badge bg-green-100 text-green-700 text-xs">✓ Verified</span>
                  )}
                </div>
              </div>
              {seller.rating > 0 && (
                <p className="text-sm text-yellow-500">
                  {starRating(seller.rating)}{' '}
                  <span className="text-gray-500">({seller.reviewCount})</span>
                </p>
              )}
              {seller.phone && (
                <p className="text-sm text-gray-600 mt-2">📞 {seller.phone}</p>
              )}
              <Link href={`/profile/${seller.id}`} className="btn-ghost btn-sm mt-3 w-full">
                View Profile
              </Link>
            </div>
          )}

          {/* Offer form */}
          {!isSeller && listing.status === 'active' && (
            <OfferForm listing={listing} onSuccess={refresh} />
          )}

          {/* Seller actions */}
          {isSeller && (
            <div className="card card-body space-y-2">
              <h3 className="font-semibold text-gray-900">Manage Listing</h3>
              <Link href={`/listings/${listing.id}/edit`} className="btn-secondary w-full">
                Edit Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
