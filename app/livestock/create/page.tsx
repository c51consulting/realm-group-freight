'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LIVESTOCK_CATEGORY_LABELS,
  LIVESTOCK_PURPOSE_LABELS,
  LIVESTOCK_SEX_LABELS,
  PRICING_TYPE_LABELS,
  AU_STATES,
} from '@/lib/constants';

export default function CreateLivestockPage() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/livestock" className="text-sm text-[#4a7c59] hover:underline">
          &larr; Back to Livestock
        </Link>
        <h1 className="text-2xl font-bold mt-2">List Livestock</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new livestock listing on the REALM Ag Marketplace.
        </p>
      </div>

      <form className="space-y-6 rounded-lg border bg-white p-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. 50 Angus Steers - Store Condition"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none">
                <option value="sell">Selling</option>
                <option value="buy">Buying / Wanted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing *</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none">
                {Object.entries(PRICING_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              placeholder="Describe the livestock - condition, background, feeding history, etc."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
            />
          </div>
        </div>

        {/* Livestock Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Livestock Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none" required>
                <option value="">Select category</option>
                {Object.entries(LIVESTOCK_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input
                type="text"
                placeholder="e.g. Angus, Merino, Dorper"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none">
                <option value="">Select</option>
                {Object.entries(LIVESTOCK_SEX_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Head Count *</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avg Weight (kg)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 450"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (months)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 18"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none">
                <option value="">Select purpose</option>
                {Object.entries(LIVESTOCK_PURPOSE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compliance & ID */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Compliance & Identification</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NLIS ID</label>
              <input
                type="text"
                placeholder="National Livestock Identification System ID"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIC (Property ID Code)</label>
              <input
                type="text"
                placeholder="Property Identification Code"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
            <input
              type="text"
              placeholder="e.g. Vaccinated, Drenched, Vet checked"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Pricing & Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Head ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1200.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none" required>
                <option value="">Select state</option>
                {AU_STATES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
            <input
              type="text"
              placeholder="e.g. Shepparton, VIC"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="freightIncluded" className="rounded border-gray-300 text-[#4a7c59] focus:ring-[#4a7c59]" />
            <label htmlFor="freightIncluded" className="text-sm text-gray-700">Freight / delivery included in price</label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#4a7c59] px-6 py-2 text-sm font-medium text-white hover:bg-[#3d6649] disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Livestock Listing'}
          </button>
          <Link
            href="/livestock"
            className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
