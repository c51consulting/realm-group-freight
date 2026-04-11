import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MATERIAL_TYPE_LABELS,
  QUALITY_LEVEL_LABELS,
  PRICING_TYPE_LABELS,
  LISTING_TYPE_LABELS,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Listings',
  description: 'Browse hay, grain, fodder and agricultural material listings.',
};

interface ListingsPageProps {
  searchParams?: {
    materialType?: string;
    qualityLevel?: string;
    pricingType?: string;
    search?: string;
    page?: string;
  };
}

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  const { materialType, qualityLevel, pricingType, search } = searchParams ?? {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Listings</h1>
          <p className="page-subtitle">
            Browse hay, grain, fodder, silage, seed and agricultural materials.
          </p>
        </div>
        <Link href="/listings/create" className="btn-primary self-start sm:self-auto">
          + Post Listing
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="card p-5 space-y-5">
            <h2 className="font-semibold text-gray-900">Filters</h2>

            {/* Search */}
            <div>
              <label htmlFor="search" className="label">Search</label>
              <input
                id="search"
                type="search"
                placeholder="e.g. Lucerne hay…"
                defaultValue={search}
                className="input"
              />
            </div>

            {/* Material type */}
            <div>
              <label htmlFor="materialType" className="label">Material Type</label>
              <select id="materialType" defaultValue={materialType ?? ''} className="input">
                <option value="">All types</option>
                {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Quality level */}
            <div>
              <label htmlFor="qualityLevel" className="label">Quality Level</label>
              <select id="qualityLevel" defaultValue={qualityLevel ?? ''} className="input">
                <option value="">All levels</option>
                {Object.entries(QUALITY_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Pricing type */}
            <div>
              <label htmlFor="pricingType" className="label">Pricing Type</label>
              <select id="pricingType" defaultValue={pricingType ?? ''} className="input">
                <option value="">All pricing</option>
                {Object.entries(PRICING_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <button type="button" className="btn-primary w-full">Apply Filters</button>
            <Link href="/listings" className="btn-secondary w-full text-center">
              Clear Filters
            </Link>
          </div>
        </aside>

        {/* Listings grid */}
        <div className="flex-1">
          {/* Active filter chips */}
          {(materialType || qualityLevel || pricingType || search) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {materialType && (
                <span className="badge-blue">
                  {MATERIAL_TYPE_LABELS[materialType as keyof typeof MATERIAL_TYPE_LABELS] ?? materialType}
                </span>
              )}
              {qualityLevel && (
                <span className="badge-green">
                  {QUALITY_LEVEL_LABELS[qualityLevel as keyof typeof QUALITY_LEVEL_LABELS] ?? qualityLevel}
                </span>
              )}
              {pricingType && (
                <span className="badge-yellow">
                  {PRICING_TYPE_LABELS[pricingType as keyof typeof PRICING_TYPE_LABELS] ?? pricingType}
                </span>
              )}
              {search && <span className="badge-gray">"{search}"</span>}
            </div>
          )}

          {/* Empty state — replace with real data fetch */}
          <div className="empty-state card py-20">
            <span className="text-5xl mb-4">🌾</span>
            <p className="empty-state-title">No listings found</p>
            <p className="empty-state-description">
              Be the first to post a listing, or adjust your filters.
            </p>
            <Link href="/listings/create" className="btn-primary mt-6">
              Post a Listing
            </Link>
          </div>

          {/*
            TODO: Replace the empty state above with a real data fetch.
            Example:
              const { data: listings } = await getListings({ materialType, qualityLevel, ... });
              listings.map(listing => <ListingCard key={listing.id} listing={listing} />)
          */}
        </div>
      </div>
    </div>
  );
}
