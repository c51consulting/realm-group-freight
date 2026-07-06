import type { Metadata } from 'next';
import Link from 'next/link';
import { AU_STATES, UNIT_TYPE_LABELS, MATERIAL_TYPE_LABELS } from '@/lib/constants';
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
    mode?: string;
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
  const { category, state, price, listingType, mode, search } = searchParams ?? {};

  // ── Query real listings from DB ──
  let dbListings: any[] = [];
  let dbError: string | null = null;

  try {
    const supabase = await createClient();
    let query = (supabase as any)
      .from('listings')
      .select('id, title, material_type, type, pricing_type, quality_level, quantity_available, unit_type, unit_label, price_per_unit, pickup_address, status, created_at, listing_mode, auction_ends_at, auction_current_bid, auction_starting_price, auction_status, auction_bid_count')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(48);

    if (category) query = query.eq('material_type', category);
    if (price) query = query.eq('pricing_type', price);
    if (listingType) query = query.eq('type', listingType === 'sell' ? 'sell' : 'buy');
    if (mode) query = query.eq('listing_mode', mode);
    if (state) query = query.filter('pickup_address->>state', 'eq', state);
    if (search) {
      const normalizedSearch = search.trim();
      if (normalizedSearch) {
        query = query.or(`title.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%,material_subtype.ilike.%${normalizedSearch}%`);
      }
    }

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
    const merged = { category, state, price, listingType, mode, search, ...params };
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

      {/* Mode tabs: All / List It / Sell It / Auction It */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {([
            { value: '', label: 'All listings' },
            { value: 'sell', label: 'Sell It' },
            { value: 'list', label: 'List It' },
            { value: 'auction', label: 'Auctions 🔥' },
          ] as const).map(({ value, label }) => {
            const active = (mode ?? '') === value;
            return (
              <Link
                key={value || 'all'}
                href={buildUrl({ mode: value || undefined })}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
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

        {/* Search and state filters */}
        <form action="/listings" method="get" className="flex flex-wrap gap-3 items-end">
          {category && <input type="hidden" name="category" value={category} />}
          {price && <input type="hidden" name="price" value={price} />}
          {listingType && <input type="hidden" name="listingType" value={listingType} />}
          {mode && <input type="hidden" name="mode" value={mode} />}
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            State
            <select name="state" defaultValue={state ?? ''} className="input max-w-[180px] text-base py-2">
              <option value="">All states</option>
              {AU_STATES.map(({ value, label }) => <option key={value} value={value}>{value} - {label}</option>)}
            </select>
          </label>
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
            Search
            <input
              type="search"
              name="search"
              placeholder="Search listings - e.g. Lucerne hay..."
              defaultValue={search ?? ''}
              className="input w-full text-base py-3"
            />
          </label>
          <button type="submit" className="btn-primary py-3 px-5 text-base">Apply</button>
        </form>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-3">
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
        {(category || state || price || listingType || mode || search) && (
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
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge-blue">{MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type}</span>
                  {listing.listing_mode === 'auction' ? (
                    <span className="badge bg-amber-100 text-amber-900 border border-amber-200">🔥 Auction</span>
                  ) : (
                    <span className={`badge ${listing.type === 'sell' ? 'badge-green' : listing.type === 'freight_only' ? 'badge-blue' : 'badge-yellow'}`}>
                      {listing.type === 'sell' ? 'Selling' : listing.type === 'freight_only' ? 'Freight' : 'Buying'}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 leading-snug">{listing.title}</h3>
                {listing.listing_mode === 'auction' ? (
                  <div>
                    <p className="text-xl font-bold text-brand-700">
                      {listing.auction_current_bid != null
                        ? `$${Number(listing.auction_current_bid).toLocaleString()}`
                        : listing.auction_starting_price != null
                          ? `$${Number(listing.auction_starting_price).toLocaleString()} (start)`
                          : 'No bids'}
                    </p>
                    <p className="text-xs text-gray-500">{listing.auction_bid_count || 0} bid{listing.auction_bid_count === 1 ? '' : 's'} · ends {listing.auction_ends_at ? new Date(listing.auction_ends_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</p>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-brand-700">
                    {listing.price_per_unit ? `$${Number(listing.price_per_unit).toLocaleString()}/${UNIT_TYPE_LABELS[listing.unit_type as keyof typeof UNIT_TYPE_LABELS] || listing.unit_type || 'unit'}` : 'Price on request'}
                  </p>
                )}
                {listing.quantity_available && (
                  <p className="text-base text-gray-600">{listing.quantity_available} {UNIT_TYPE_LABELS[listing.unit_type as keyof typeof UNIT_TYPE_LABELS] || listing.unit_type}</p>
                )}
                {listing.pickup_address && (
                  <p className="text-base text-gray-500">📍 {typeof listing.pickup_address === 'object'
                    ? [listing.pickup_address.suburb, listing.pickup_address.state].filter(Boolean).join(', ')
                    : listing.pickup_address}
                  </p>
                )}
                {listing.quality_level && (
                  <span className="badge badge-gray self-start">{listing.quality_level === 'verified' ? 'Verified Quality' : listing.quality_level === 'performance' ? 'Performance Quality' : 'Basic Quality'}</span>
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
