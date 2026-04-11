'use client';

import type { ListingFilters, MaterialType, QualityLevel, PricingType } from '@/lib/types';

interface SearchFiltersProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

const MATERIAL_OPTIONS: { value: MaterialType | ''; label: string }[] = [
  { value: '', label: 'All materials' },
  { value: 'hay', label: 'Hay' },
  { value: 'straw', label: 'Straw' },
  { value: 'silage', label: 'Silage' },
  { value: 'grain', label: 'Grain' },
  { value: 'seed', label: 'Seed' },
  { value: 'pellets', label: 'Pellets' },
  { value: 'fertiliser', label: 'Fertiliser' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'drums', label: 'Drums' },
  { value: 'bulk_liquid', label: 'Bulk Liquid' },
  { value: 'other', label: 'Other' },
];

const QUALITY_OPTIONS: { value: QualityLevel | ''; label: string }[] = [
  { value: '', label: 'Any quality' },
  { value: 'basic', label: 'Basic' },
  { value: 'verified', label: 'Verified' },
  { value: 'performance', label: 'Performance' },
];

const PRICING_OPTIONS: { value: PricingType | ''; label: string }[] = [
  { value: '', label: 'Any pricing' },
  { value: 'fixed', label: 'Fixed price' },
  { value: 'offers', label: 'Offers invited' },
  { value: 'auction', label: 'Auction' },
  { value: 'urgent', label: 'Urgent' },
];

/**
 * SearchFilters — sidebar/top filter controls for the listings browse page.
 */
export default function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const set = (key: keyof ListingFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <aside aria-label="Listing filters" className="space-y-5">
      {/* Material type */}
      <div>
        <label htmlFor="filter-material" className="label">
          Material Type
        </label>
        <select
          id="filter-material"
          className="input"
          value={filters.materialType ?? ''}
          onChange={(e) => set('materialType', e.target.value as MaterialType)}
        >
          {MATERIAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quality level */}
      <div>
        <label htmlFor="filter-quality" className="label">
          Quality Level
        </label>
        <select
          id="filter-quality"
          className="input"
          value={filters.qualityLevel ?? ''}
          onChange={(e) => set('qualityLevel', e.target.value as QualityLevel)}
        >
          {QUALITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing type */}
      <div>
        <label htmlFor="filter-pricing" className="label">
          Pricing Type
        </label>
        <select
          id="filter-pricing"
          className="input"
          value={filters.pricingType ?? ''}
          onChange={(e) => set('pricingType', e.target.value as PricingType)}
        >
          {PRICING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <p className="label">Price Range (AUD)</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="filter-min-price" className="sr-only">Min price</label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              placeholder="Min"
              className="input"
              value={filters.minPrice ?? ''}
              onChange={(e) => set('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="filter-max-price" className="sr-only">Max price</label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              placeholder="Max"
              className="input"
              value={filters.maxPrice ?? ''}
              onChange={(e) => set('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      {/* Listing type */}
      <div>
        <p className="label">Listing Type</p>
        <div className="flex flex-col gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'sell', label: 'Selling' },
            { value: 'buy', label: 'Buying (WTB)' },
            { value: 'freight_only', label: 'Freight only' },
          ].map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="listing-type"
                value={o.value}
                checked={(filters.type ?? '') === o.value}
                onChange={() => set('type', o.value)}
                className="text-brand-600 focus:ring-brand-500"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={() => onChange({ page: 1, limit: 20 })}
        className="btn-ghost btn-sm w-full"
      >
        Clear Filters
      </button>
    </aside>
  );
}
