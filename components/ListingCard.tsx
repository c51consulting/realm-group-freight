'use client';

/**
 * ListingCard — displays a marketplace listing summary with price,
 * material type, quality tier, and seller info.
 */

import React from 'react';
import type { Listing } from '@/lib/client';

// ─── Label Maps ───────────────────────────────────────────────────────────────

const MATERIAL_LABELS: Record<string, string> = {
  hay: 'Hay',
  straw: 'Straw',
  silage: 'Silage',
  grain: 'Grain',
  seed: 'Seed',
  pellets: 'Pellets',
  fertiliser: 'Fertiliser',
  supplement: 'Supplement',
  drums: 'Drums',
  bulk_liquid: 'Bulk Liquid',
  other: 'Other',
};

const UNIT_LABELS: Record<string, string> = {
  bale_small: 'small bale',
  bale_large: 'large bale',
  bale_round: 'round bale',
  bag: 'bag',
  drum: 'drum',
  tonne: 'tonne',
  kg: 'kg',
  load: 'load',
  pallet: 'pallet',
  cubic_metre: 'm³',
  litre: 'litre',
  custom: 'unit',
};

const QUALITY_CONFIG: Record<string, { label: string; className: string }> = {
  basic: { label: 'Basic', className: 'bg-gray-100 text-gray-700' },
  verified: { label: 'Verified', className: 'bg-blue-100 text-blue-700' },
  performance: { label: 'Performance', className: 'bg-green-100 text-green-700' },
};

const PRICING_CONFIG: Record<string, { label: string; className: string }> = {
  fixed: { label: 'Fixed Price', className: 'bg-slate-100 text-slate-700' },
  offers: { label: 'Offers', className: 'bg-amber-100 text-amber-700' },
  auction: { label: 'Auction', className: 'bg-purple-100 text-purple-700' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface ListingCardProps {
  listing: Listing;
  /** Called when the card or CTA button is clicked. */
  onClick?: (listing: Listing) => void;
  /** Show a compact version without description. */
  compact?: boolean;
  className?: string;
}

/**
 * Displays a marketplace listing card with price, material type, quality tier,
 * seller info, and freight details.
 *
 * @example
 * <ListingCard listing={listing} onClick={(l) => router.push(`/listings/${l.id}`)} />
 */
export function ListingCard({ listing, onClick, compact = false, className = '' }: ListingCardProps) {
  const quality = QUALITY_CONFIG[listing.qualityLevel] ?? QUALITY_CONFIG.basic;
  const pricing = PRICING_CONFIG[listing.pricingType] ?? PRICING_CONFIG.fixed;
  const materialLabel = MATERIAL_LABELS[listing.materialType] ?? listing.materialType;
  const unitLabel = listing.unitLabel ?? UNIT_LABELS[listing.unitType] ?? listing.unitType;

  const handleClick = () => onClick?.(listing);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  };

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={`${listing.title} — ${materialLabel}`}
      className={[
        'group relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow',
        onClick ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500' : '',
        className,
      ].join(' ')}
    >
      {/* Image */}
      {listing.images && listing.images.length > 0 ? (
        <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-gray-100">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Urgent badge overlay */}
          {listing.pricingType === 'urgent' && (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
              URGENT
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center rounded-t-xl bg-gradient-to-br from-green-50 to-emerald-100">
          <span className="text-4xl" aria-hidden>🌾</span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${quality.className}`}>
            {quality.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pricing.className}`}>
            {pricing.label}
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {materialLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">
          {listing.title}
        </h3>

        {/* Description (non-compact) */}
        {!compact && listing.description && (
          <p className="line-clamp-2 text-xs text-gray-500">{listing.description}</p>
        )}

        {/* Price */}
        <div className="mt-auto pt-2">
          {listing.pricePerUnit ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                ${Number(listing.pricePerUnit).toFixed(2)}
              </span>
              <span className="text-xs text-gray-500">/ {unitLabel}</span>
              {listing.pricePerTonneEquiv && (
                <span className="ml-1 text-xs text-gray-400">
                  (${Number(listing.pricePerTonneEquiv).toFixed(0)}/t)
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-amber-600">Price on application</span>
          )}
        </div>

        {/* Quantity & freight */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {listing.quantityAvailable && (
            <span>
              {Number(listing.quantityAvailable).toLocaleString()} {unitLabel}s available
            </span>
          )}
          {listing.freightIncluded && (
            <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700 font-medium">
              Freight incl.
            </span>
          )}
        </div>

        {/* Seller */}
        {listing.seller && (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-2 mt-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              {(listing.seller.businessName ?? 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-700">
                {listing.seller.businessName ?? 'Unknown seller'}
              </p>
              <div className="flex items-center gap-1">
                {listing.seller.verified && (
                  <span className="text-blue-500 text-xs" title="Verified seller">✓</span>
                )}
                {listing.seller.rating !== undefined && listing.seller.rating > 0 && (
                  <span className="text-xs text-gray-400">
                    ★ {Number(listing.seller.rating).toFixed(1)}
                    {listing.seller.reviewCount ? ` (${listing.seller.reviewCount})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default ListingCard;
