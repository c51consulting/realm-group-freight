import type { Metadata } from 'next';
import Link from 'next/link';
import { MATERIAL_TYPE_LABELS, AU_STATES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Post Freight Job',
  description: 'Post a new agricultural freight job.',
};

export default function CreateFreightJobPage() {
  return (
    <div className="page-container max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/freight" className="hover:text-brand-600">Freight</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium">Post Freight Job</li>
        </ol>
      </nav>

      <div className="page-header">
        <h1 className="page-title">Post a Freight Job</h1>
        <p className="page-subtitle">
          Describe your load and route to find available carriers.
        </p>
      </div>

      {/*
        TODO: Convert to a Client Component.
        Wire up to createFreightJob() from lib/api.ts.
      */}
      <form className="space-y-8" action="#" method="POST">
        {/* Load details */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Load Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="materialType" className="label">Material Type *</label>
              <select id="materialType" name="materialType" required className="input">
                <option value="">Select type…</option>
                {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="estimatedWeight" className="label">Estimated Weight</label>
              <div className="flex gap-2">
                <input
                  id="estimatedWeight"
                  name="estimatedWeight"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 20"
                  className="input flex-1"
                />
                <select name="weightUnit" className="input w-24">
                  <option value="tonne">t</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Describe the load, any special requirements, access notes…"
              className="input resize-none"
            />
          </div>

          <div>
            <label htmlFor="requiredBy" className="label">Required By</label>
            <input id="requiredBy" name="requiredBy" type="date" className="input" />
          </div>
        </section>

        {/* Pickup */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pickup Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="pickupStreet" className="label">Street Address *</label>
              <input id="pickupStreet" name="pickupStreet" type="text" required placeholder="123 Farm Road" className="input" />
            </div>
            <div>
              <label htmlFor="pickupSuburb" className="label">Suburb / Town *</label>
              <input id="pickupSuburb" name="pickupSuburb" type="text" required placeholder="Wagga Wagga" className="input" />
            </div>
            <div>
              <label htmlFor="pickupState" className="label">State *</label>
              <select id="pickupState" name="pickupState" required className="input">
                <option value="">Select state…</option>
                {AU_STATES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pickupPostcode" className="label">Postcode</label>
              <input id="pickupPostcode" name="pickupPostcode" type="text" placeholder="2650" className="input" />
            </div>
          </div>
        </section>

        {/* Delivery */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Delivery Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="deliveryStreet" className="label">Street Address *</label>
              <input id="deliveryStreet" name="deliveryStreet" type="text" required placeholder="456 Station Road" className="input" />
            </div>
            <div>
              <label htmlFor="deliverySuburb" className="label">Suburb / Town *</label>
              <input id="deliverySuburb" name="deliverySuburb" type="text" required placeholder="Albury" className="input" />
            </div>
            <div>
              <label htmlFor="deliveryState" className="label">State *</label>
              <select id="deliveryState" name="deliveryState" required className="input">
                <option value="">Select state…</option>
                {AU_STATES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="deliveryPostcode" className="label">Postcode</label>
              <input id="deliveryPostcode" name="deliveryPostcode" type="text" placeholder="2640" className="input" />
            </div>
          </div>
        </section>

        {/* Rate */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Rate</h2>
          <div>
            <label htmlFor="offeredRate" className="label">Offered Rate (AUD)</label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                id="offeredRate"
                name="offeredRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input pl-7"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to receive quotes from carriers.
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="label">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any other requirements for the carrier…"
              className="input resize-none"
            />
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/freight" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary px-8">
            Post Freight Job
          </button>
        </div>
      </form>
    </div>
  );
}
