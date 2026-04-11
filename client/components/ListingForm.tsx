'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotification } from '@/lib/context/NotificationContext';
import { useForm } from '@/lib/hooks/useForm';
import { listings as listingsApi } from '@/lib/client';
import { validateRequired, validatePositiveNumber } from '@/lib/client-utils';
import type { Listing, MaterialType, UnitType, PricingType, QualityLevel } from '@/lib/types';
import type { ValidationErrors } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';

interface ListingFormProps {
  /** Pass existing listing to edit; omit for create */
  listing?: Listing;
}

interface ListingFormValues {
  type: string;
  materialType: string;
  materialSubtype: string;
  title: string;
  description: string;
  unitType: string;
  unitLabel: string;
  pricePerUnit: string;
  quantityAvailable: string;
  minimumOrder: string;
  estimatedWeightPerUnit: string;
  pricingType: string;
  freightIncluded: boolean;
  deliveryRadius: string;
  loadingAvailable: boolean;
  qualityLevel: string;
  expiresAt: string;
}

/**
 * ListingForm — create or edit a listing.
 * On success, redirects to the new/updated listing detail page.
 */
export default function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotification();
  const isEdit = !!listing;

  const { values, errors, submitting, handleChange, handleSubmit } = useForm<ListingFormValues>({
    initialValues: {
      type: listing?.type ?? 'sell',
      materialType: listing?.materialType ?? 'hay',
      materialSubtype: listing?.materialSubtype ?? '',
      title: listing?.title ?? '',
      description: listing?.description ?? '',
      unitType: listing?.unitType ?? 'bale_round',
      unitLabel: listing?.unitLabel ?? '',
      pricePerUnit: listing?.pricePerUnit ? String(listing.pricePerUnit) : '',
      quantityAvailable: listing?.quantityAvailable ? String(listing.quantityAvailable) : '',
      minimumOrder: listing?.minimumOrder ? String(listing.minimumOrder) : '',
      estimatedWeightPerUnit: listing?.estimatedWeightPerUnit ? String(listing.estimatedWeightPerUnit) : '',
      pricingType: listing?.pricingType ?? 'fixed',
      freightIncluded: listing?.freightIncluded ?? false,
      deliveryRadius: listing?.deliveryRadius ? String(listing.deliveryRadius) : '',
      loadingAvailable: listing?.loadingAvailable ?? false,
      qualityLevel: listing?.qualityLevel ?? 'basic',
      expiresAt: listing?.expiresAt ? listing.expiresAt.split('T')[0] : '',
    },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      const titleErr = validateRequired(v.title, 'Title');
      if (titleErr) errs.title = titleErr;
      if (v.pricingType === 'fixed') {
        const priceErr = validatePositiveNumber(Number(v.pricePerUnit), 'Price per unit');
        if (priceErr) errs.pricePerUnit = priceErr;
      }
      return errs;
    },
    async onSubmit(v) {
      if (!user) throw new Error('You must be logged in');
      const payload = {
        type: v.type as 'sell' | 'buy' | 'freight_only',
        materialType: v.materialType as MaterialType,
        materialSubtype: v.materialSubtype || undefined,
        title: v.title,
        description: v.description || undefined,
        unitType: v.unitType as UnitType,
        unitLabel: v.unitLabel || undefined,
        pricePerUnit: v.pricePerUnit ? Number(v.pricePerUnit) : undefined,
        quantityAvailable: v.quantityAvailable ? Number(v.quantityAvailable) : undefined,
        minimumOrder: v.minimumOrder ? Number(v.minimumOrder) : undefined,
        estimatedWeightPerUnit: v.estimatedWeightPerUnit ? Number(v.estimatedWeightPerUnit) : undefined,
        pricingType: v.pricingType as PricingType,
        freightIncluded: v.freightIncluded,
        deliveryRadius: v.deliveryRadius ? Number(v.deliveryRadius) : undefined,
        loadingAvailable: v.loadingAvailable,
        qualityLevel: v.qualityLevel as QualityLevel,
        expiresAt: v.expiresAt || undefined,
        userId: user.id,
      };

      if (isEdit && listing) {
        await listingsApi.update(listing.id, payload);
        notify('Listing updated!', 'success');
        router.push(`/listings/${listing.id}`);
      } else {
        const created = await listingsApi.create(payload);
        notify('Listing created!', 'success');
        router.push(`/listings/${created.id}`);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <ErrorMessage message={errors._form} />

      {/* Basic info */}
      <section className="card card-body space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Listing type */}
          <div>
            <label htmlFor="lf-type" className="label">Listing Type *</label>
            <select id="lf-type" name="type" className="input" value={values.type} onChange={handleChange}>
              <option value="sell">Selling</option>
              <option value="buy">Buying (WTB)</option>
              <option value="freight_only">Freight only</option>
            </select>
          </div>

          {/* Material type */}
          <div>
            <label htmlFor="lf-material" className="label">Material Type *</label>
            <select id="lf-material" name="materialType" className="input" value={values.materialType} onChange={handleChange}>
              {(['hay','straw','silage','grain','seed','pellets','fertiliser','supplement','drums','bulk_liquid','other'] as MaterialType[]).map((m) => (
                <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subtype */}
        <div>
          <label htmlFor="lf-subtype" className="label">Subtype / Variety</label>
          <input id="lf-subtype" name="materialSubtype" type="text" className="input" placeholder="e.g. Lucerne, Oaten, Wheaten…" value={values.materialSubtype} onChange={handleChange} />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="lf-title" className="label">Title *</label>
          <input
            id="lf-title"
            name="title"
            type="text"
            className={`input ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. Premium Lucerne Hay — Round Bales"
            value={values.title}
            onChange={handleChange}
            required
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="lf-desc" className="label">Description</label>
          <textarea id="lf-desc" name="description" rows={4} className="input resize-none" placeholder="Describe the product, condition, storage, etc." value={values.description} onChange={handleChange} />
        </div>
      </section>

      {/* Pricing & units */}
      <section className="card card-body space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing & Units</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Unit type */}
          <div>
            <label htmlFor="lf-unit" className="label">Unit Type *</label>
            <select id="lf-unit" name="unitType" className="input" value={values.unitType} onChange={handleChange}>
              {(['bale_small','bale_large','bale_round','bag','drum','tonne','kg','load','pallet','cubic_metre','litre','custom'] as UnitType[]).map((u) => (
                <option key={u} value={u}>{u.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Custom unit label */}
          {values.unitType === 'custom' && (
            <div>
              <label htmlFor="lf-unit-label" className="label">Custom Unit Label</label>
              <input id="lf-unit-label" name="unitLabel" type="text" className="input" placeholder="e.g. IBC" value={values.unitLabel} onChange={handleChange} />
            </div>
          )}

          {/* Pricing type */}
          <div>
            <label htmlFor="lf-pricing" className="label">Pricing Type *</label>
            <select id="lf-pricing" name="pricingType" className="input" value={values.pricingType} onChange={handleChange}>
              <option value="fixed">Fixed price</option>
              <option value="offers">Offers invited</option>
              <option value="auction">Auction</option>
              <option value="urgent">Urgent sale</option>
            </select>
          </div>

          {/* Price per unit */}
          <div>
            <label htmlFor="lf-price" className="label">
              Price per unit (AUD){values.pricingType === 'fixed' ? ' *' : ''}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                id="lf-price"
                name="pricePerUnit"
                type="number"
                min={0}
                step={0.01}
                className={`input pl-7 ${errors.pricePerUnit ? 'input-error' : ''}`}
                value={values.pricePerUnit}
                onChange={handleChange}
              />
            </div>
            {errors.pricePerUnit && <p className="field-error">{errors.pricePerUnit}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="lf-qty" className="label">Quantity available</label>
            <input id="lf-qty" name="quantityAvailable" type="number" min={0} step={0.01} className="input" value={values.quantityAvailable} onChange={handleChange} />
          </div>

          {/* Minimum order */}
          <div>
            <label htmlFor="lf-min" className="label">Minimum order</label>
            <input id="lf-min" name="minimumOrder" type="number" min={0} step={0.01} className="input" value={values.minimumOrder} onChange={handleChange} />
          </div>

          {/* Weight per unit */}
          <div>
            <label htmlFor="lf-weight" className="label">Est. weight per unit (kg)</label>
            <input id="lf-weight" name="estimatedWeightPerUnit" type="number" min={0} step={0.1} className="input" placeholder="e.g. 500 for a round bale" value={values.estimatedWeightPerUnit} onChange={handleChange} />
            <p className="text-xs text-gray-400 mt-1">Used to calculate price per tonne equivalent</p>
          </div>
        </div>
      </section>

      {/* Logistics */}
      <section className="card card-body space-y-4">
        <h2 className="font-semibold text-gray-900">Logistics</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lf-radius" className="label">Delivery radius (km)</label>
            <input id="lf-radius" name="deliveryRadius" type="number" min={0} className="input" placeholder="Leave blank for pickup only" value={values.deliveryRadius} onChange={handleChange} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" name="freightIncluded" checked={values.freightIncluded} onChange={handleChange} className="rounded text-brand-600 focus:ring-brand-500" />
            Freight included in price
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" name="loadingAvailable" checked={values.loadingAvailable} onChange={handleChange} className="rounded text-brand-600 focus:ring-brand-500" />
            Loading available on-site
          </label>
        </div>
      </section>

      {/* Quality & expiry */}
      <section className="card card-body space-y-4">
        <h2 className="font-semibold text-gray-900">Quality & Expiry</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lf-quality" className="label">Quality Level</label>
            <select id="lf-quality" name="qualityLevel" className="input" value={values.qualityLevel} onChange={handleChange}>
              <option value="basic">Basic — on-farm NIR or estimate</option>
              <option value="verified">Verified — lab feedtest attached</option>
              <option value="performance">Performance — lab + AFIA grade</option>
            </select>
          </div>

          <div>
            <label htmlFor="lf-expires" className="label">Listing expires</label>
            <input id="lf-expires" name="expiresAt" type="date" className="input" value={values.expiresAt} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : isEdit ? 'Update Listing' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
}
