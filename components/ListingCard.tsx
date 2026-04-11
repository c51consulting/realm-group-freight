'use client';

import Link from 'next/link';
import { MATERIAL_TYPES, UNIT_TYPES } from '@/lib/constants';

interface ListingCardProps {
  id: string;
  title: string;
  type: 'sell' | 'buy' | 'freight_only';
  materialType: string;
  unitType: string;
  pricePerUnit?: number;
  quantityAvailable?: number;
  qualityLevel: 'basic' | 'verified' | 'performance';
  pickupAddress?: { state?: string; postcode?: string };
  freightIncluded: boolean;
  pricingType: string;
  seller?: { businessName?: string; rating?: number };
  images?: string[];
}

const qualityBadgeColors = {
  basic: 'bg-gray-100 text-gray-700',
  verified: 'bg-blue-100 text-blue-700',
  performance: 'bg-green-100 text-green-700',
};

const typeBadgeColors = {
  sell: 'bg-emerald-100 text-emerald-700',
  buy: 'bg-amber-100 text-amber-700',
  freight_only: 'bg-purple-100 text-purple-700',
};

export default function ListingCard(props: ListingCardProps) {
  const {
    id, title, type, materialType, unitType, pricePerUnit,
    quantityAvailable, qualityLevel, pickupAddress, freightIncluded,
    pricingType, seller, images,
  } = props;

  const materialLabel = MATERIAL_TYPES.find(m => m.value === materialType)?.label || materialType;
  const unitLabel = UNIT_TYPES.find(u => u.value === unitType)?.label || unitType;

  return (
    <Link href={`/listings/${id}`} className="block">
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
        {/* Image placeholder */}
        <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          {images && images.length > 0 ? (
            <img src={images[0]} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">&#127807;</span>
          )}
        </div>

        <div className="p-4">
          {/* Badges */}
          <div className="flex gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColors[type]}`}>
              {type === 'sell' ? 'For Sale' : type === 'buy' ? 'Wanted' : 'Freight'}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${qualityBadgeColors[qualityLevel]}`}>
              {qualityLevel}
            </span>
            {freightIncluded && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Freight Incl.
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{title}</h3>

          {/* Material + Unit */}
          <p className="text-sm text-gray-500 mb-2">{materialLabel} &middot; {unitLabel}</p>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-2">
            {pricePerUnit ? (
              <>
                <span className="text-xl font-bold text-gray-900">
                  ${Number(pricePerUnit).toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">per {unitLabel}</span>
              </>
            ) : (
              <span className="text-sm font-medium text-amber-600">
                {pricingType === 'offers' ? 'Open to Offers' : pricingType === 'auction' ? 'Auction' : 'Contact for Price'}
              </span>
            )}
          </div>

          {/* Quantity */}
          {quantityAvailable && (
            <p className="text-sm text-gray-600 mb-2">
              Qty: {Number(quantityAvailable).toLocaleString()} available
            </p>
          )}

          {/* Location + Seller */}
          <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t">
            <span>{pickupAddress?.state || 'Australia'} {pickupAddress?.postcode || ''}</span>
            {seller && (
              <span className="flex items-center gap-1">
                {seller.businessName}
                {seller.rating ? ` (${seller.rating.toFixed(1)})` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
