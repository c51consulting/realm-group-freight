import Link from 'next/link';
import type { Listing } from '@/lib/types';
import {
  formatCurrency,
  materialLabel,
  unitLabel,
  qualityLabel,
  qualityColour,
  timeAgo,
  starRating,
} from '@/lib/client-utils';

interface ListingCardProps {
  listing: Listing;
}

/**
 * ListingCard — compact card for listing browse pages.
 * Shows price, material, quality badge, seller info and age.
 */
export default function ListingCard({ listing }: ListingCardProps) {
  const seller = listing.seller;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card block hover:border-brand-400 hover:shadow-md transition-all group"
    >
      {/* Image placeholder / first image */}
      <div className="h-40 bg-gradient-to-br from-earth-100 to-earth-200 rounded-t-xl flex items-center justify-center overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-40">🌾</span>
        )}
      </div>

      <div className="p-4">
        {/* Quality + type badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`badge ${qualityColour(listing.qualityLevel)}`}>
            {qualityLabel(listing.qualityLevel)}
          </span>
          <span className="badge bg-gray-100 text-gray-600 capitalize">
            {listing.type}
          </span>
          {listing.pricingType === 'urgent' && (
            <span className="badge bg-red-100 text-red-700">Urgent</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 mb-1">
          {listing.title}
        </h3>

        {/* Material */}
        <p className="text-xs text-gray-500 mb-3">
          {materialLabel(listing.materialType)}
          {listing.materialSubtype ? ` · ${listing.materialSubtype}` : ''}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-1">
          {listing.pricePerUnit ? (
            <>
              <span className="text-xl font-bold text-brand-700">
                {formatCurrency(listing.pricePerUnit)}
              </span>
              <span className="text-sm text-gray-500">
                / {unitLabel(listing.unitType, listing.unitLabel)}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-500 italic">
              {listing.pricingType === 'offers' ? 'Offers invited' : 'Price on request'}
            </span>
          )}
        </div>

        {listing.pricePerTonneEquiv && (
          <p className="text-xs text-gray-400 mb-3">
            ≈ {formatCurrency(listing.pricePerTonneEquiv)} / tonne
          </p>
        )}

        {/* Quantity */}
        {listing.quantityAvailable && (
          <p className="text-xs text-gray-500 mb-3">
            {listing.quantityAvailable} {listing.quantityUnit || unitLabel(listing.unitType)} available
          </p>
        )}

        {/* Seller + age */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
              {seller?.businessName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 leading-none">
                {seller?.businessName ?? 'Unknown'}
              </p>
              {seller && seller.rating > 0 && (
                <p className="text-xs text-yellow-500 leading-none">
                  {starRating(seller.rating)} ({seller.reviewCount})
                </p>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
