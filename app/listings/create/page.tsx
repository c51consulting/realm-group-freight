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

export default function CreateListingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const payload: Record<string, unknown> = {
      type: str('type') ?? 'sell',
      materialType: str('materialType'),
      materialSubtype: str('materialSubtype'),
      title: str('title'),
      description: str('description'),
      unitType: str('unitType'),
      pricingType: str('pricingType'),
      pricePerUnit: num('pricePerUnit'),
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

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
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
          <div className="grid grid-cols-3 gap-3">
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
