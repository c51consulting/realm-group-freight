'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MATERIAL_TYPE_LABELS,
  UNIT_TYPE_LABELS,
  PRICING_TYPE_LABELS,
  QUALITY_LEVEL_LABELS,
  QUALITY_LEVEL_DESCRIPTIONS,
  AU_STATES,
} from '@/lib/constants';
import { supabase } from '@/lib/supabase';

type ListingMode = 'list' | 'sell' | 'auction';

export default function CreateListingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [listingMode, setListingMode] = useState<ListingMode>('sell');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v === null || v === '' ? undefined : Number(v);
    };
    const str = (k: string) => {
      const v = fd.get(k);
      return v === null || v === '' ? undefined : String(v);
    };

    const mode = listingMode; // 'list' | 'sell' | 'auction'

    const payload: Record<string, unknown> = {
      type: str('type') ?? 'sell',
      listingMode: mode,
      materialType: str('materialType'),
      materialSubtype: str('materialSubtype'),
      title: str('title'),
      description: str('description'),
      unitType: str('unitType'),
      pricingType: mode === 'auction' ? 'auction' : (mode === 'list' ? 'offers' : 'fixed'),
      pricePerUnit: mode === 'sell' ? num('pricePerUnit') : (mode === 'list' ? num('pricePerUnit') : undefined),
      quantityAvailable: num('quantityAvailable'),
      minimumOrder: num('minimumOrder'),
      estimatedWeightPerUnit: num('estimatedWeightPerUnit'),
      qualityLevel: str('qualityLevel') ?? 'basic',
      pickupLocation: {
        street: str('street'),
        suburb: str('suburb'),
        state: str('state'),
        postcode: str('postcode'),
      },
      deliveryRadius: num('deliveryRadius'),
      freightIncluded: fd.get('freightIncluded') === 'on',
      loadingAvailable: fd.get('loadingAvailable') === 'on',
    };

    // Auction-only fields
    if (mode === 'auction') {
      const startsRaw = str('auctionStartsAt');
      const endsRaw = str('auctionEndsAt');
      const startingPrice = num('auctionStartingPrice');
      if (!startsRaw || !endsRaw) {
        setError('Auction start and end times are required');
        setSubmitting(false);
        return;
      }
      if (startingPrice == null || startingPrice <= 0) {
        setError('Starting price is required and must be greater than 0');
        setSubmitting(false);
        return;
      }
      if (new Date(endsRaw) <= new Date(startsRaw)) {
        setError('Auction end time must be after start time');
        setSubmitting(false);
        return;
      }
      payload.auctionStartsAt = new Date(startsRaw).toISOString();
      payload.auctionEndsAt = new Date(endsRaw).toISOString();
      payload.auctionStartingPrice = startingPrice;
      const reserve = num('auctionReservePrice');
      const buyNow = num('auctionBuyNowPrice');
      const increment = num('auctionIncrement');
      if (reserve != null) payload.auctionReservePrice = reserve;
      if (buyNow != null) payload.auctionBuyNowPrice = buyNow;
      payload.auctionIncrement = increment != null && increment > 0 ? increment : 10;
    }
    // Validate at least one photo and upload to Supabase Storage
    const files = photos.filter((f): f is File => !!f);
    if (files.length === 0) {
      setError('At least 1 photo is required');
      setSubmitting(false);
      return;
    }
    let imageUrls: string[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to upload photos');
      for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        const up = await supabase.storage.from('listing-images').upload(path, file, { upsert: false, contentType: file.type });
        if (up.error) throw new Error('Photo upload failed: ' + up.error.message);
        const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
      setSubmitting(false);
      return;
    }


    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, images: imageUrls }),      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (Array.isArray(data.errors) ? data.errors.join(', ') : null) || ('Request failed (' + res.status + ')'));
      }
      const data = await res.json();
      router.push(data && data.id ? '/listings/' + data.id : '/listings');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container max-w-3xl">
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/listings" className="hover:text-brand-600">Listings</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium">Create Listing</li>
        </ol>
      </nav>

      <div className="page-header">
        <h1 className="page-title">Post a Listing</h1>
        <p className="page-subtitle">List your agricultural materials for sale, or post a buy request.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Listing Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'sell', label: 'Selling', desc: 'I have stock to sell' },
              { value: 'buy', label: 'Buying', desc: 'I want to buy' },
              { value: 'freight_only', label: 'Freight Only', desc: 'Transport job only' },
            ].map(({ value, label, desc }) => (
              <label key={value} className="flex flex-col gap-1 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-brand-400 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="type" value={value} defaultChecked={value === 'sell'} className="sr-only" />
                <span className="font-medium text-sm text-gray-900">{label}</span>
                <span className="text-xs text-gray-500">{desc}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">How do you want to sell it?</h2>
          <p className="text-xs text-gray-500 mb-4">Pick the flow that matches your goal. You can switch later.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { value: 'list', label: 'List It', desc: 'Show in marketplace, take offers/contact — no instant buy.' },
              { value: 'sell', label: 'Sell It', desc: 'Fixed price, instant Stripe checkout. Fastest cash.' },
              { value: 'auction', label: 'Auction It', desc: 'Buyers bid, highest wins at close. Best for hot stock.' },
            ] as const).map(({ value, label, desc }) => (
              <label key={value} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition ${listingMode === value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-400'}`}>
                <input
                  type="radio"
                  name="listingMode"
                  value={value}
                  checked={listingMode === value}
                  onChange={() => setListingMode(value as ListingMode)}
                  className="sr-only"
                />
                <span className="font-semibold text-sm text-gray-900">{label}</span>
                <span className="text-xs text-gray-500">{desc}</span>
              </label>
            ))}
          </div>
        </section>

        {listingMode === 'auction' && (
          <section className="card p-6 space-y-4 border-l-4 border-brand-500">
            <div>
              <h2 className="font-semibold text-gray-900">Auction Settings</h2>
              <p className="text-xs text-gray-500 mt-1">English ascending auction with a hard close at the end time. Highest bid that meets your reserve wins and is auto-converted to a paid-pending order.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="auctionStartsAt" className="label">Starts At *</label>
                <input id="auctionStartsAt" name="auctionStartsAt" type="datetime-local" required className="input" />
              </div>
              <div>
                <label htmlFor="auctionEndsAt" className="label">Ends At *</label>
                <input id="auctionEndsAt" name="auctionEndsAt" type="datetime-local" required className="input" />
              </div>
              <div>
                <label htmlFor="auctionStartingPrice" className="label">Starting Price (AUD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input id="auctionStartingPrice" name="auctionStartingPrice" type="number" min="0" step="0.01" required placeholder="e.g. 500" className="input pl-7" />
                </div>
              </div>
              <div>
                <label htmlFor="auctionIncrement" className="label">Bid Increment (AUD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input id="auctionIncrement" name="auctionIncrement" type="number" min="1" step="1" defaultValue={10} className="input pl-7" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum step between bids. Defaults to $10.</p>
              </div>
              <div>
                <label htmlFor="auctionReservePrice" className="label">Reserve Price (AUD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input id="auctionReservePrice" name="auctionReservePrice" type="number" min="0" step="0.01" placeholder="Optional" className="input pl-7" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Hidden from bidders. If unmet at close, auction ends with no sale.</p>
              </div>
              <div>
                <label htmlFor="auctionBuyNowPrice" className="label">Buy-Now Price (AUD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input id="auctionBuyNowPrice" name="auctionBuyNowPrice" type="number" min="0" step="0.01" placeholder="Optional" className="input pl-7" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Optional. Lets a buyer end the auction instantly at this price.</p>
              </div>
            </div>
          </section>
        )}

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Material Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="materialType" className="label">Material Type *</label>
              <select id="materialType" name="materialType" required className="input">
                <option value="">Select type...</option>
                {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="materialSubtype" className="label">Subtype / Variety</label>
              <input id="materialSubtype" name="materialSubtype" type="text" placeholder="e.g. Lucerne, Oaten, Barley..." className="input" />
            </div>
          </div>
          <div>
            <label htmlFor="title" className="label">Listing Title *</label>
            <input id="title" name="title" type="text" required placeholder="e.g. Premium Lucerne Hay - 8x4 bales, 500kg avg" className="input" />
          </div>
          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea id="description" name="description" rows={4} placeholder="Describe the material, condition, harvest date, storage method..." className="input resize-none" />
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pricing & Quantity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unitType" className="label">Unit Type *</label>
              <select id="unitType" name="unitType" required className="input">
                <option value="">Select unit...</option>
                {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pricingType" className="label">Pricing Type *</label>
              <select id="pricingType" name="pricingType" required className="input" defaultValue="fixed">
                {Object.entries(PRICING_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pricePerUnit" className="label">Price per Unit (AUD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input id="pricePerUnit" name="pricePerUnit" type="number" min="0" step="0.01" placeholder="0.00" className="input pl-7" />
              </div>
            </div>
            <div>
              <label htmlFor="quantityAvailable" className="label">Quantity Available *</label>
              <input id="quantityAvailable" name="quantityAvailable" type="number" min="0" step="0.01" required placeholder="e.g. 100" className="input" />
            </div>
            <div>
              <label htmlFor="minimumOrder" className="label">Minimum Order</label>
              <input id="minimumOrder" name="minimumOrder" type="number" min="0" step="0.01" placeholder="e.g. 10" className="input" />
            </div>
            <div>
              <label htmlFor="estimatedWeightPerUnit" className="label">Est. Weight per Unit (kg)</label>
              <input id="estimatedWeightPerUnit" name="estimatedWeightPerUnit" type="number" min="0" step="0.1" placeholder="e.g. 500" className="input" />
            </div>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Quality Level</h2>
          <div className="space-y-3">
            {Object.entries(QUALITY_LEVEL_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-brand-400 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="qualityLevel" value={value} className="mt-0.5" defaultChecked={value === 'basic'} />
                <div>
                  <p className="font-medium text-sm text-gray-900">{label as string}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{QUALITY_LEVEL_DESCRIPTIONS[value as keyof typeof QUALITY_LEVEL_DESCRIPTIONS]}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pickup Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="street" className="label">Street Address</label>
              <input id="street" name="street" type="text" placeholder="123 Farm Road" className="input" />
            </div>
            <div>
              <label htmlFor="suburb" className="label">Suburb / Town</label>
              <input id="suburb" name="suburb" type="text" placeholder="Wagga Wagga" className="input" />
            </div>
            <div>
              <label htmlFor="state" className="label">State</label>
              <select id="state" name="state" className="input">
                <option value="">Select state...</option>
                {AU_STATES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="postcode" className="label">Postcode</label>
              <input id="postcode" name="postcode" type="text" placeholder="2650" className="input" />
            </div>
            <div>
              <label htmlFor="deliveryRadius" className="label">Delivery Radius (km)</label>
              <input id="deliveryRadius" name="deliveryRadius" type="number" min="0" placeholder="e.g. 200" className="input" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id="freightIncluded" name="freightIncluded" type="checkbox" className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            <label htmlFor="freightIncluded" className="text-sm text-gray-700">Freight included in price</label>
          </div>
          <div className="flex items-center gap-3">
            <input id="loadingAvailable" name="loadingAvailable" type="checkbox" className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            <label htmlFor="loadingAvailable" className="text-sm text-gray-700">Loading equipment available on-site</label>
          </div>
        </section>
        <section className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Photos</h2>
            <p className="text-xs text-gray-500 mt-1">Add 1 to 3 photos to give your listing relevance and clarity. The first photo is required; the other two are optional. Supported file types: JPG, PNG or WebP. Recommended size at least 1200 by 800 px. Max 5 MB per photo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <label htmlFor={`photo-${i}`} className="label">{i === 0 ? 'Photo 1 *' : `Photo ${i + 1}`}</label>
                <input
                  id={`photo-${i}`}
                  type="file"
                  accept="image/*"
                  required={i === 0}
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                    setPhotos((prev) => { const next = [...prev]; next[i] = f; return next; });
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                {photos[i] && (<p className="text-xs text-gray-500 mt-1 truncate">{photos[i]!.name}</p>)}
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link href="/listings" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn-primary px-8 disabled:opacity-60">
            {submitting ? 'Posting...' : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
