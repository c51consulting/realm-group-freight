'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MakeOfferFormProps {
  listingId: string;
  sellerId: string;
  pricePerUnit: number | null;
  unitLabel: string;
}

export default function MakeOfferForm({ listingId, sellerId, pricePerUnit, unitLabel }: MakeOfferFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState('');
  const [offerPrice, setOfferPrice] = useState(pricePerUnit?.toString() || '');
  const [message, setMessage] = useState('');
  const [freightIncluded, setFreightIncluded] = useState(false);
  const [freightPrice, setFreightPrice] = useState('0');

  const total = quantity && offerPrice
    ? (Number(offerPrice) * Number(quantity) + Number(freightPrice || 0)).toFixed(2)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          seller_id: sellerId,
          price_per_unit: Number(offerPrice),
          quantity: Number(quantity),
          total_price: Number(total),
          freight_included: freightIncluded,
          freight_price: Number(freightPrice || 0),
          message: message || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.join(', ') || 'Failed to submit offer');

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Could not submit offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm font-semibold text-green-800">Offer submitted!</p>
        <p className="text-xs text-green-700 mt-1">The seller will review your offer and respond shortly.</p>
        <a href="/offers" className="mt-2 inline-block text-xs text-green-700 underline hover:text-green-800">View my offers →</a>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full mt-4"
      >
        Make an Offer
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      <h3 className="font-semibold text-gray-900 text-sm">Make an Offer</h3>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity ({unitLabel})*</label>
        <input
          type="number"
          required
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="input text-sm"
          placeholder="e.g. 50"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Price per {unitLabel} (AUD)*</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={offerPrice}
            onChange={e => setOfferPrice(e.target.value)}
            className="input text-sm pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="freight-check"
          checked={freightIncluded}
          onChange={e => setFreightIncluded(e.target.checked)}
          className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        <label htmlFor="freight-check" className="text-xs text-gray-700">Include freight cost</label>
      </div>

      {freightIncluded && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Freight cost (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={freightPrice}
              onChange={e => setFreightPrice(e.target.value)}
              className="input text-sm pl-7"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Message to seller</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={2}
          className="input text-sm resize-none"
          placeholder="Any questions or notes for the seller..."
        />
      </div>

      {total && (
        <div className="p-2 bg-gray-50 rounded text-sm">
          <span className="text-gray-600">Total offer: </span>
          <span className="font-bold text-gray-900">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(total))}
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary flex-1 text-sm py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1 text-sm py-2 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Offer'}
        </button>
      </div>
    </form>
  );
}
