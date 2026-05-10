import type { Metadata } from 'next';
import Link from 'next/link';
import { AU_STATES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Listings — REALM Group Freight',
  description: 'Browse hay, grain, fodder and agricultural material listings across Australia.',
};

interface ListingsPageProps {
  searchParams?: {
    category?: string;
    state?: string;
    price?: string;
    listingType?: string;
    search?: string;
    page?: string;
  };
}

const CATEGORY_PILLS = [
  { value: '', label: 'All' },
  { value: 'hay', label: 'Hay' },
  { value: 'straw', label: 'Straw' },
  { value: 'silage', label: 'Silage' },
  { value: 'grain', label: 'Grain' },
  { value: 'seed', label: 'Seed' },
  { value: 'pellets', label: 'Pellets' },
  { value: 'fertiliser', label: 'Fertiliser' },
  { value: 'other', label: 'Other' },
];

// Shown only when DB returns 0 listings
const EXAMPLE_LISTINGS = [
  { id: 'ex1', title: 'Premium Lucerne Hay', materialType: 'Hay', quantity: '200 round bales', price: '$380/tonne', location: 'Warragul VIC', listingType: 'Selling', quality: 'Verified quality' },
  { id: 'ex2', title: 'Oaten Hay', materialType: 'Hay', quantity: '500 large square bales', price: '$280/tonne', location: 'Horsham VIC', listingType: 'Selling', quality: 'Basic quality' },
  { id: 'ex3', title: 'Grain Sorghum', materialType: 'Grain', quantity: '50 tonne', price: '$295/tonne', location: 'Dalby QLD', listingType: 'Selling', quality: 'Verified quality' },
  { id: 'ex4', title: 'Feed Barley (Buying)', materialType: 'Grain', quantity: '200 tonne', price: '$260/tonne', location: 'Wagga Wagga NSW', listingType: 'Buying', quality: null },
  { id: 'ex5', title: 'Silage (Maize)', materialType: 'Silage', quantity: '150 tonne', price: '$120/tonne', location: 'Hamilton VIC', listingType: 'Selling', quality: 'Basic quality' },
  { id: 'ex6', title: 'Canola Meal', materialType: 'Fertiliser', quantity: '80 tonne', price: '$580/tonne', location: 'Bordertown SA', listingType: 'Selling', quality: 'Performance quality' },
];

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { category, state, price, listingType, search } = searchParams ?? {};

  // ── Query real listings from DB ──
  let dbListings: any[] = [];
  let dbError: string | null = null;

  try {
    const supabase = await createClient();
    let query = (supabase as any)
      .from('listings')
      .select('id, title, material_type, listing_type, pricing_type, quality_level, quantity, unit, price_per_unit, suburb, state, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(48);

    if (category) query = query.eq('material_type', category);
    if (state) query = query.eq('state', state);
    if (price) query = query.eq('pricing_type', price);
    if (listingType) query = query.eq('listing_type', listingType === 'sell' ? 'sell' : 'buy');
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) {
      dbError = error.message;
    } else {
      dbListings = data ?? [];
    }
  } catch (e: any) {
    dbError = e.message;
  }

  const hasRealListings = dbListings.length > 0;

  const buildUrl = (params: Record<string, string | undefined>) => {
    const merged = { category, state, price, listingType, search, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&');
    return `/listings${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Listings</h1>
          <p className="page-subtitle">Browse hay, grain, fodder, silage, seed and agricultural materials.</p>
        </div>
        <Link href="/listings/create" className="btn-primary self-start sm:self-auto py-3 px-6 text-base">
          + Post Listing
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 space-y-4">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PILLS.map(({ value, label }) => {
            const isActive = (category ?? '') === value;
            return (
              <Link key={value} href={buildUrl({ category: value || undefined })}
                className={`px-5 py-3 text-base rounded-full font-medium border transition-colors ${isActive ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'}`}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-3">
          <select defaultValue={state ?? ''} className="input max-w-[180px] text-base py-2">
            <option value="">All states</option>
            {AU_STATES.map(({ value, label }) => <option key={value} value={value}>{value} — {label}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            {[{ value: '', label: 'Any price' }, { value: 'fixed', label: 'Fixed' }, { value: 'offers', label: 'Offers' }, { value: 'auction', label: 'Auction' }].map(({ value: v, label }) => (
              <Link key={v} href={buildUrl({ price: v || undefined })}
                className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${(price ?? '') === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'}`}>
                {label}
              </Link>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {[{ value: '', label: 'All' }, { value: 'sell', label: 'Selling' }, { value: 'buy', label: 'Buying' }].map(({ value: v, label }) => (
              <Link key={v} href={buildUrl({ listingType: v || undefined })}
                className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${(listingType ?? '') === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Search */}
        <input type="search" placeholder="Search listings — e.g. Lucerne hay…" defaultValue={search} className="input w-full text-base py-3" />

        {(category || state || price || listingType || search) && (
          <Link href="/listings" className="text-sm text-brand-600 hover:text-brand-800 font-medium">✕ Clear all filters</Link>
        )}
      </div>

      {/* Results */}
      {hasRealListings ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">{dbListings.length} listing{dbListings.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dbListings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}
                className="card p-5 flex flex-col gap-3 min-h-[200px] hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="badge badge-blue capitalize">{listing.material_type?.replace('_', ' ')}</span>
                  <span className={`badge ${listing.listing_type === 'sell' ? 'badge-green' : 'badge-yellow'}`}>
                    {listing.listing_type === 'sell' ? 'Selling' : 'Buying'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 leading-snug">{listing.title}</h3>
                <p className="text-xl font-bold text-brand-700">
                  {listing.price_per_unit ? `$${listing.price_per_unit.toLocaleString()}/${listing.unit || 'tonne'}` : 'Price on request'}
                </p>
                {listing.quantity && <p className="text-base text-gray-600">{listing.quantity} {listing.unit}</p>}
                <p className="text-base text-gray-500">📍 {listing.suburb ? `${listing.suburb}, ` : ''}{listing.state}</p>
                {listing.quality_level && (
                  <span className="badge badge-gray capitalize self-start">{listing.quality_level} quality</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {dbError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-5">
              ⚠️ Could not load listings ({dbError}). Showing examples below.
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg px-4 py-3 mb-5 text-sm text-gray-600">
              No listings yet — here&apos;s what REALM Group Freight listings look like:
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXAMPLE_LISTINGS.map((listing) => (
              <div key={listing.id} className="card p-5 flex flex-col gap-3 min-h-[200px] relative">
                <span className="absolute top-3 right-3 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Example</span>
                <span className="badge badge-blue">{listing.materialType}</span>
                <h3 className="text-lg font-semibold text-gray-900 leading-snug pr-16">{listing.title}</h3>
                <p className="text-xl font-bold text-brand-700">{listing.price}</p>
                <p className="text-base text-gray-600">{listing.quantity}</p>
                <p className="text-base text-gray-500">📍 {listing.location}</p>
                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  <span className={`badge ${listing.listingType === 'Selling' ? 'badge-green' : 'badge-yellow'}`}>{listing.listingType}</span>
                  {listing.quality && <span className="badge badge-gray">{listing.quality}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/listings/create" className="btn-primary py-4 px-8 text-lg rounded-xl">Post a Listing</Link>
          </div>
        </div>
      )}
    </div>
  );
}
