'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useNotification } from '@/lib/context/NotificationContext';
import { useForm } from '@/lib/hooks/useForm';
import { offers as offersApi } from '@/lib/client';
import { formatCurrency, unitLabel, validatePositiveNumber } from '@/lib/client-utils';
import type { Listing } from '@/lib/types';
import type { ValidationErrors } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';

interface OfferFormProps {
  listing: Listing;
  onSuccess?: () => void;
}

interface OfferFormValues {
  pricePerUnit: string;
  quantity: string;
  freightIncluded: boolean;
  freightPrice: string;
  deliveryDate: string;
  message: string;
}

/**
 * OfferForm — submit a price offer on a listing.
 * Requires the user to be logged in as a buyer.
 */
export default function OfferForm({ listing, onSuccess }: OfferFormProps) {
  const { user } = useAuth();
  const { notify } = useNotification();

  const { values, errors, submitting, handleChange, handleSubmit } = useForm<OfferFormValues>({
    initialValues: {
      pricePerUnit: listing.pricePerUnit ? String(listing.pricePerUnit) : '',
      quantity: listing.minimumOrder ? String(listing.minimumOrder) : '1',
      freightIncluded: false,
      freightPrice: '',
      deliveryDate: '',
      message: '',
    },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      const priceErr = validatePositiveNumber(Number(v.pricePerUnit), 'Price per unit');
      if (priceErr) errs.pricePerUnit = priceErr;
      const qtyErr = validatePositiveNumber(Number(v.quantity), 'Quantity');
      if (qtyErr) errs.quantity = qtyErr;
      if (v.freightIncluded && !v.freightPrice) {
        errs.freightPrice = 'Enter freight price or uncheck freight included';
      }
      return errs;
    },
    async onSubmit(v) {
      if (!user) throw new Error('You must be logged in to make an offer');
      await offersApi.create({
        listingId: listing.id,
        buyerId: user.id,
        pricePerUnit: Number(v.pricePerUnit),
        quantity: Number(v.quantity),
        freightIncluded: v.freightIncluded,
        freightPrice: v.freightPrice ? Number(v.freightPrice) : undefined,
        deliveryDate: v.deliveryDate || undefined,
        message: v.message || undefined,
      });
      notify('Offer submitted successfully!', 'success');
      onSuccess?.();
    },
  });

  const totalPrice =
    (Number(values.pricePerUnit) || 0) * (Number(values.quantity) || 0) +
    (values.freightIncluded ? Number(values.freightPrice) || 0 : 0);

  if (!user) {
    return (
      <div className="card card-body text-center text-sm text-gray-500">
        <a href="/auth/login" className="text-brand-600 font-medium hover:underline">
          Sign in
        </a>{' '}
        to make an offer on this listing.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card card-body space-y-4">
      <h3 className="font-semibold text-gray-900">Make an Offer</h3>

      <ErrorMessage message={errors._form} />

      {/* Price per unit */}
      <div>
        <label htmlFor="offer-price" className="label">
          Price per {unitLabel(listing.unitType, listing.unitLabel)} (AUD) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            id="offer-price"
            name="pricePerUnit"
            type="number"
            min={0}
            step={0.01}
            className={`input pl-7 ${errors.pricePerUnit ? 'input-error' : ''}`}
            value={values.pricePerUnit}
            onChange={handleChange}
            aria-describedby={errors.pricePerUnit ? 'offer-price-error' : undefined}
            required
          />
        </div>
        {errors.pricePerUnit && (
          <p id="offer-price-error" className="field-error">{errors.pricePerUnit}</p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="offer-qty" className="label">
          Quantity ({unitLabel(listing.unitType, listing.unitLabel)}) *
        </label>
        <input
          id="offer-qty"
          name="quantity"
          type="number"
          min={listing.minimumOrder ?? 1}
          step={1}
          className={`input ${errors.quantity ? 'input-error' : ''}`}
          value={values.quantity}
          onChange={handleChange}
          aria-describedby={errors.quantity ? 'offer-qty-error' : undefined}
          required
        />
        {listing.minimumOrder && (
          <p className="text-xs text-gray-400 mt-1">Minimum order: {listing.minimumOrder}</p>
        )}
        {errors.quantity && (
          <p id="offer-qty-error" className="field-error">{errors.quantity}</p>
        )}
      </div>

      {/* Freight */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            name="freightIncluded"
            checked={values.freightIncluded}
            onChange={handleChange}
            className="rounded text-brand-600 focus:ring-brand-500"
          />
          Include freight in offer
        </label>
      </div>

      {values.freightIncluded && (
        <div>
          <label htmlFor="offer-freight" className="label">
            Freight price (AUD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              id="offer-freight"
              name="freightPrice"
              type="number"
              min={0}
              step={0.01}
              className={`input pl-7 ${errors.freightPrice ? 'input-error' : ''}`}
              value={values.freightPrice}
              onChange={handleChange}
            />
          </div>
          {errors.freightPrice && (
            <p className="field-error">{errors.freightPrice}</p>
          )}
        </div>
      )}

      {/* Delivery date */}
      <div>
        <label htmlFor="offer-delivery" className="label">
          Requested delivery date
        </label>
        <input
          id="offer-delivery"
          name="deliveryDate"
          type="date"
          className="input"
          value={values.deliveryDate}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="offer-message" className="label">
          Message to seller
        </label>
        <textarea
          id="offer-message"
          name="message"
          rows={3}
          className="input resize-none"
          placeholder="Any questions or special requirements…"
          value={values.message}
          onChange={handleChange}
        />
      </div>

      {/* Total */}
      {totalPrice > 0 && (
        <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">
              {formatCurrency(Number(values.pricePerUnit) * Number(values.quantity))}
            </span>
          </div>
          {values.freightIncluded && Number(values.freightPrice) > 0 && (
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Freight</span>
              <span className="font-medium">{formatCurrency(Number(values.freightPrice))}</span>
            </div>
          )}
          <div className="flex justify-between mt-2 pt-2 border-t border-brand-200 font-semibold text-brand-800">
            <span>Total offer</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Submitting…' : 'Submit Offer'}
      </button>
    </form>
  );
}
