import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  MATERIAL_TYPE_LABELS,
  UNIT_TYPE_LABELS,
  QUALITY_LEVEL_LABELS,
  PRICING_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  AU_STATES,
} from '@/lib/constants';
import MakeOfferForm from './MakeOfferForm';
import AuctionPanel from './AuctionPanel';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from('listings')
    .select('title, material_type, pickup_address')
    .eq('id', params.id)
    .single();

  if (!listing) return { title: 'Listing not found' };

  const materialLabel = MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type;
  const suburb = listing.pickup_address?.suburb || '';
  const state = listing.pickup_address?.state || '';

  return {
    title: `${listing.title} — ${materialLabel} | REALM Group Freight`,
    description: `${materialLabel} listing${suburb ? ` near ${suburb}` : ''}${state ? `, ${state}` : ''}. Available on REALM Group Freight.`,
  };
}

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return 'POA';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

function getStateLabel(stateCode: string) {
  const found = AU_STATES.find(s => s.value === stateCode);
  return found ? found.label : stateCode;
}

export default async function ListingDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:users!seller_id(id, business_name, rating, review_count, verified, phone)
    `)
    .eq('id', params.id)
    .single();

  if (error || !listing) {
    notFound();
  }

  const materialLabel = MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type;
  const unitLabel = UNIT_TYPE_LABELS[listing.unit_type as keyof typeof UNIT_TYPE_LABELS] || listing.unit_type;
  const qualityLabel = QUALITY_LEVEL_LABELS[listing.quality_level as keyof typeof QUALITY_LEVEL_LABELS] || listing.quality_level;
  const pricingLabel = PRICING_TYPE_LABELS[listing.pricing_type as keyof typeof PRICING_TYPE_LABELS] || listing.pricing_type;
  const typeLabel = LISTING_TYPE_LABELS[listing.type as keyof typeof LISTING_TYPE_LABELS] || listing.type;
  const suburb = listing.pickup_address?.suburb || '';
  const state = listing.pickup_address?.state || '';
  const stateLabel = state ? getStateLabel(state) : '';
  const images: string[] = Array.isArray(listing.images) ? listing.images : [];

  const isSeller = user?.id === listing.seller_id;
  const isLoggedIn = !!user;

  return (
    <div className="page-container max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 flex-wrap">
          <li><Link href="/listings" className="hover:text-brand-600">Listings</Link></li>
          <li aria-hidden="true">/</li>
          {listing.material_type && (
            <>
              <li>
                <Link href={`/listings?materialType=${listing.material_type}`} className="hover:text-brand-600">
                  {materialLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li className="text-gray-900 font-medium truncate max-w-xs">{listing.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo gallery */}
          <div className="card overflow-hidden">
            {images.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                <img
                  src={images[0]}
                  alt={listing.title}
                  className="w-full h-72 object-cover"
                />
                {images.length > 1 && (
                  <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                    {images.slice(1).map((img, i) => (
                      <img key={i} src={img} alt={`${listing.title} photo ${i + 2}`} className="w-full h-32 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 h-64 flex items-center justify-center text-gray-300">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-2 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              </div>
            )}
          </div>

          {/* Title & type */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  listing.type === 'sell' ? 'bg-green-100 text-green-800' :
                  listing.type === 'buy' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {typeLabel}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                  {materialLabel}
                </span>
                {listing.material_subtype && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {listing.material_subtype}
                  </span>
                )}
              </div>
              {listing.status !== 'active' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                  {listing.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.title}</h1>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              {suburb && <span>{suburb}</span>}
              {state && <span className="font-medium">{stateLabel}</span>}
              {listing.created_at && (
                <>
                  <span>·</span>
                  <span>Listed {new Date(listing.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </>
              )}
            </div>

            {listing.description && (
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{listing.description}</p>
            )}
          </div>

          {/* Details grid */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 text-base">Listing Details</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Price</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(listing.price_per_unit)}
                  {listing.price_per_unit && unitLabel && (
                    <span className="text-sm font-normal text-gray-500 ml-1">/ {unitLabel}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Pricing Type</dt>
                <dd className="mt-1 font-medium text-gray-900 text-sm">{pricingLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Quantity</dt>
                <dd className="mt-1 font-medium text-gray-900 text-sm">
                  {listing.quantity_available ? `${listing.quantity_available} ${unitLabel || 'units'}` : '—'}
                </dd>
              </div>
              {listing.minimum_order && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Minimum Order</dt>
                  <dd className="mt-1 font-medium text-gray-900 text-sm">{listing.minimum_order} {unitLabel || 'units'}</dd>
                </div>
              )}
              {listing.estimated_weight_per_unit && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Est. Weight/Unit</dt>
                  <dd className="mt-1 font-medium text-gray-900 text-sm">{listing.estimated_weight_per_unit} kg</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Quality Level</dt>
                <dd className="mt-1 font-medium text-gray-900 text-sm">{qualityLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Freight Included</dt>
                <dd className="mt-1 font-medium text-gray-900 text-sm">{listing.freight_included ? 'Yes' : 'No'}</dd>
              </div>
              {listing.delivery_radius && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Delivery Radius</dt>
                  <dd className="mt-1 font-medium text-gray-900 text-sm">{listing.delivery_radius} km</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Loading Available</dt>
                <dd className="mt-1 font-medium text-gray-900 text-sm">{listing.loading_available ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          {/* Pickup location */}
          {listing.pickup_address && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3 text-base">Pickup Location</h2>
              <p className="text-gray-700 text-base">
                {[
                  listing.pickup_address.street,
                  listing.pickup_address.suburb,
                  listing.pickup_address.state,
                  listing.pickup_address.postcode,
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price card */}
          <div className="card p-6 sticky top-24">
            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(listing.price_per_unit)}
                {listing.price_per_unit && <span className="text-lg font-normal text-gray-500 ml-1">/ {unitLabel}</span>}
              </p>
              <p className="text-sm text-gray-500 mt-1">{pricingLabel}</p>
            </div>

            {listing.quantity_available && (
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">Available</span>
                <span className="text-sm font-semibold text-gray-900">{listing.quantity_available} {unitLabel}</span>
              </div>
            )}
            {listing.freight_included && (
              <div className="flex items-center gap-2 py-2 border-t border-gray-100">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Freight included</span>
              </div>
            )}
            {listing.loading_available && (
              <div className="flex items-center gap-2 py-2 border-t border-gray-100">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Loading available on-site</span>
              </div>
            )}

            {/* Trust signal */}
            <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
              <p className="text-xs text-brand-700 font-medium">🔒 Funds held in trust</p>
              <p className="text-xs text-brand-600 mt-0.5">Payment is held securely until delivery is confirmed.</p>
            </div>

            {/* CTA */}
            {isSeller ? (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">This is your listing</p>
              </div>
            ) : listing.status !== 'active' ? (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500 capitalize">Listing is {listing.status}</p>
              </div>
            ) : listing.listing_mode === 'auction' ? (
              <AuctionPanel
                listingId={listing.id}
                sellerId={listing.seller_id}
                currentUserId={user?.id ?? null}
                startsAt={listing.auction_starts_at}
                endsAt={listing.auction_ends_at}
                startingPrice={listing.auction_starting_price ? Number(listing.auction_starting_price) : null}
                currentBid={listing.auction_current_bid ? Number(listing.auction_current_bid) : null}
                increment={listing.auction_increment ? Number(listing.auction_increment) : 10}
                buyNowPrice={listing.auction_buy_now_price ? Number(listing.auction_buy_now_price) : null}
                status={listing.auction_status}
                bidCount={listing.auction_bid_count}
                isWinner={!!user && user.id === listing.auction_winner_id}
              />
            ) : isLoggedIn ? (
              <MakeOfferForm listingId={listing.id} sellerId={listing.seller_id} pricePerUnit={listing.price_per_unit} unitLabel={unitLabel} />
            ) : (
              <div className="mt-4 space-y-2">
                <Link href={`/login?redirectTo=/listings/${listing.id}`} className="btn-primary w-full text-center block">
                  Sign in to make an offer
                </Link>
                <Link href={`/register?redirectTo=/listings/${listing.id}`} className="btn-secondary w-full text-center block">
                  Create free account
                </Link>
              </div>
            )}
          </div>

          {/* Seller info */}
          {listing.seller && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-base">
                  {(listing.seller.business_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{listing.seller.business_name || 'Verified Seller'}</p>
                  {listing.seller.rating > 0 && (
                    <p className="text-xs text-gray-500">★ {listing.seller.rating.toFixed(1)} · {listing.seller.review_count} reviews</p>
                  )}
                  {listing.seller.verified && (
                    <p className="text-xs text-green-600 font-medium">✓ Verified</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
