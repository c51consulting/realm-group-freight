'use client';

/**
 * OfferForm — submit an offer on a listing with price, quantity,
 * freight options, delivery date, and a message to the seller.
 */

import React, { useState } from 'react';
import type { Listing, Offer } from '@/lib/client';
import { offersApi, ApiError } from '@/lib/client';
import { required, min, positive, compose } from '@/lib/forms';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferFormValues {
  pricePerUnit: string;
  quantity: string;
  freightIncluded: boolean;
  freightPrice: string;
  deliveryDate: string;
  message: string;
}

interface FieldErrors {
  pricePerUnit?: string;
  quantity?: string;
  freightPrice?: string;
  deliveryDate?: string;
  message?: string;
  _form?: string;
}

export interface OfferFormProps {
  listing: Listing;
  /** Called with the created offer on success. */
  onSuccess?: (offer: Offer) => void;
  /** Called when the user dismisses the form. */
  onCancel?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<string, string> = {
  bale_small: 'small bale',
  bale_large: 'large bale',
  bale_round: 'round bale',
  bag: 'bag',
  drum: 'drum',
  tonne: 'tonne',
  kg: 'kg',
  load: 'load',
  pallet: 'pallet',
  cubic_metre: 'm³',
  litre: 'litre',
  custom: 'unit',
};

function validate(values: OfferFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const priceNum = parseFloat(values.pricePerUnit);
  const qtyNum = parseFloat(values.quantity);

  if (!values.pricePerUnit) {
    errors.pricePerUnit = 'Price is required.';
  } else if (isNaN(priceNum) || priceNum <= 0) {
    errors.pricePerUnit = 'Enter a valid price greater than 0.';
  }

  if (!values.quantity) {
    errors.quantity = 'Quantity is required.';
  } else if (isNaN(qtyNum) || qtyNum <= 0) {
    errors.quantity = 'Enter a valid quantity greater than 0.';
  }

  if (values.freightIncluded && values.freightPrice) {
    const fp = parseFloat(values.freightPrice);
    if (isNaN(fp) || fp < 0) errors.freightPrice = 'Enter a valid freight price.';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Form for submitting an offer on a listing.
 * Handles validation, loading state, and API error display.
 *
 * @example
 * <OfferForm listing={listing} onSuccess={(offer) => console.log(offer)} />
 */
export function OfferForm({ listing, onSuccess, onCancel }: OfferFormProps) {
  const unitLabel = listing.unitLabel ?? UNIT_LABELS[listing.unitType] ?? listing.unitType;

  const [values, setValues] = useState<OfferFormValues>({
    pricePerUnit: listing.pricePerUnit ? String(listing.pricePerUnit) : '',
    quantity: listing.minimumOrder ? String(listing.minimumOrder) : '',
    freightIncluded: listing.freightIncluded,
    freightPrice: '',
    deliveryDate: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof OfferFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, _form: undefined }));
  };

  const priceNum = parseFloat(values.pricePerUnit) || 0;
  const qtyNum = parseFloat(values.quantity) || 0;
  const freightNum = values.freightIncluded ? parseFloat(values.freightPrice) || 0 : 0;
  const total = priceNum * qtyNum + freightNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const offer = await offersApi.create({
        listingId: listing.id,
        pricePerUnit: priceNum,
        quantity: qtyNum,
        freightIncluded: values.freightIncluded,
        freightPrice: values.freightIncluded && values.freightPrice ? freightNum : undefined,
        deliveryDate: values.deliveryDate || undefined,
        message: values.message || undefined,
      });
      setSuccess(true);
      onSuccess?.(offer);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          setErrors((prev) => ({ ...prev, ...err.fields }));
        } else {
          setErrors((prev) => ({ ...prev, _form: err.message }));
        }
      } else {
        setErrors((prev) => ({ ...prev, _form: 'Something went wrong. Please try again.' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="text-4xl">✅</span>
        <p className="text-lg font-semibold text-green-800">Offer submitted!</p>
        <p className="text-sm text-green-700">
          The seller will be notified and can accept or reject your offer.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-900">Make an Offer</h2>

      {/* Global error */}
      {errors._form && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      {/* Price per unit */}
      <div className="flex flex-col gap-1">
        <label htmlFor="offer-price" className="text-sm font-medium text-gray-700">
          Your price per {unitLabel} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">$</span>
          <input
            id="offer-price"
            type="number"
            min="0.01"
            step="0.01"
            value={values.pricePerUnit}
            onChange={(e) => set('pricePerUnit', e.target.value)}
            placeholder={listing.pricePerUnit ? String(listing.pricePerUnit) : '0.00'}
            aria-describedby={errors.pricePerUnit ? 'offer-price-error' : undefined}
            aria-invalid={!!errors.pricePerUnit}
            className={[
              'w-full rounded-lg border py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
              errors.pricePerUnit ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
            ].join(' ')}
          />
        </div>
        {errors.pricePerUnit && (
          <p id="offer-price-error" role="alert" className="text-xs text-red-600">{errors.pricePerUnit}</p>
        )}
        {listing.pricePerUnit && (
          <p className="text-xs text-gray-400">Listed at ${Number(listing.pricePerUnit).toFixed(2)} / {unitLabel}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="flex flex-col gap-1">
        <label htmlFor="offer-qty" className="text-sm font-medium text-gray-700">
          Quantity ({unitLabel}s) <span className="text-red-500">*</span>
        </label>
        <input
          id="offer-qty"
          type="number"
          min="0.01"
          step="0.01"
          value={values.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          placeholder="0"
          aria-describedby={errors.quantity ? 'offer-qty-error' : undefined}
          aria-invalid={!!errors.quantity}
          className={[
            'w-full rounded-lg border py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
            errors.quantity ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          ].join(' ')}
        />
        {errors.quantity && (
          <p id="offer-qty-error" role="alert" className="text-xs text-red-600">{errors.quantity}</p>
        )}
        {listing.minimumOrder && (
          <p className="text-xs text-gray-400">Minimum order: {listing.minimumOrder} {unitLabel}s</p>
        )}
      </div>

      {/* Freight */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={values.freightIncluded}
            onChange={(e) => set('freightIncluded', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Include freight in my offer
        </label>

        {values.freightIncluded && (
          <div className="flex flex-col gap-1 pl-6">
            <label htmlFor="offer-freight" className="text-sm text-gray-600">
              Freight cost ($)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">$</span>
              <input
                id="offer-freight"
                type="number"
                min="0"
                step="0.01"
                value={values.freightPrice}
                onChange={(e) => set('freightPrice', e.target.value)}
                placeholder="0.00"
                aria-describedby={errors.freightPrice ? 'offer-freight-error' : undefined}
                aria-invalid={!!errors.freightPrice}
                className={[
                  'w-full rounded-lg border py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                  errors.freightPrice ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
                ].join(' ')}
              />
            </div>
            {errors.freightPrice && (
              <p id="offer-freight-error" role="alert" className="text-xs text-red-600">{errors.freightPrice}</p>
            )}
          </div>
        )}
      </div>

      {/* Delivery date */}
      <div className="flex flex-col gap-1">
        <label htmlFor="offer-date" className="text-sm font-medium text-gray-700">
          Preferred delivery date
        </label>
        <input
          id="offer-date"
          type="date"
          value={values.deliveryDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => set('deliveryDate', e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label htmlFor="offer-message" className="text-sm font-medium text-gray-700">
          Message to seller
        </label>
        <textarea
          id="offer-message"
          rows={3}
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Any questions or special requirements..."
          maxLength={500}
          className="w-full resize-none rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-right text-xs text-gray-400">{values.message.length}/500</p>
      </div>

      {/* Total summary */}
      {total > 0 && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({qtyNum} × ${priceNum.toFixed(2)})</span>
            <span>${(priceNum * qtyNum).toFixed(2)}</span>
          </div>
          {freightNum > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Freight</span>
              <span>${freightNum.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
            <span>Total offer</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Offer'}
        </button>
      </div>
    </form>
  );
}

export default OfferForm;
