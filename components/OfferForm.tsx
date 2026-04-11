'use client';

import { useState } from 'react';
import { useForm } from '@/lib/hooks';
import { validateOffer } from '@/lib/validation';

interface OfferFormProps {
  listingId: string;
  listingTitle: string;
  askingPrice?: number;
  unitLabel: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function OfferForm({ listingId, listingTitle, askingPrice, unitLabel, onSubmit, onCancel }: OfferFormProps) {
  const { values, errors, submitting, setSubmitting, handleChange, setValidationErrors } = useForm({
    pricePerUnit: askingPrice?.toString() || '',
    quantity: '',
    freightIncluded: false,
    freightPrice: '',
    deliveryDate: '',
    message: '',
  });

  const totalPrice = Number(values.pricePerUnit || 0) * Number(values.quantity || 0) + Number(values.freightPrice || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateOffer({ ...values, listingId });
    if (!result.valid) { setValidationErrors(result); return; }
    setSubmitting(true);
    try {
      await onSubmit({ ...values, listingId, totalPrice });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="text-lg font-semibold">Make an Offer</h3>
      <p className="text-sm text-gray-500">For: {listingTitle}</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per {unitLabel} ($)</label>
          <input type="number" step="0.01" min="0" value={values.pricePerUnit}
            onChange={e => handleChange('pricePerUnit', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${errors.pricePerUnit ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={askingPrice ? `Asking: $${askingPrice}` : 'Your price'} />
          {errors.pricePerUnit && <p className="text-red-500 text-xs mt-1">{errors.pricePerUnit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input type="number" step="0.01" min="0" value={values.quantity}
            onChange={e => handleChange('quantity', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="How many units" />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="freightIncluded" checked={values.freightIncluded as boolean}
          onChange={e => handleChange('freightIncluded', e.target.checked)}
          className="rounded border-gray-300" />
        <label htmlFor="freightIncluded" className="text-sm">Include freight in offer</label>
      </div>

      {values.freightIncluded && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Freight Price ($)</label>
          <input type="number" step="0.01" min="0" value={values.freightPrice}
            onChange={e => handleChange('freightPrice', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Delivery Date</label>
        <input type="date" value={values.deliveryDate}
          onChange={e => handleChange('deliveryDate', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
        <textarea value={values.message} rows={3}
          onChange={e => handleChange('message', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Any notes for the seller..." />
      </div>

      {totalPrice > 0 && (
        <div className="bg-green-50 rounded-md p-3">
          <p className="text-sm text-gray-600">Total offer: <span className="font-bold text-green-700">${totalPrice.toFixed(2)} AUD</span></p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-green-600 text-white rounded-md py-2 px-4 font-medium hover:bg-green-700 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Offer'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
