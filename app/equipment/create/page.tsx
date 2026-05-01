'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRICING_TYPE_LABELS, AU_STATES } from '@/lib/constants';

const EQUIPMENT_CATEGORIES = [
  'Tractor', 'Harvester / Header', 'Baler', 'Mower / Conditioner', 'Rake / Tedder',
  'Seeder / Planter', 'Sprayer', 'Spreader', 'Tillage', 'Trailer', 'Truck',
  'Ute / Light Vehicle', 'Loader / Telehandler', 'Excavator', 'Skid Steer',
  'Feed Mixer', 'Silo / Storage', 'Irrigation', 'Generator / Power',
  'Workshop / Tools', 'ATV / Side-by-Side', 'Livestock Equipment', 'Other',
];

const EQUIPMENT_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'as_new', label: 'As New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'for_parts', label: 'For Parts / Not Working' },
];

export default function CreateEquipmentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', equipmentCategory: '', make: '', model: '',
    year: '', hours: '', condition: '', serialNumber: '', attachments: '',
    pricingType: 'fixed', price: '', listingType: 'sell', state: '',
    pickupLocation: '', freightIncluded: false,
  });

  const update = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        category: 'equipment',
        type: form.listingType,
        title: form.title,
        description: form.description,
        pricingType: form.pricingType,
        pricePerUnit: form.price ? Number(form.price) : undefined,
        unitType: 'custom',
        unitLabel: 'unit',
        freightIncluded: form.freightIncluded,
        pickupAddress: { state: form.state || undefined, suburb: form.pickupLocation || undefined },
        equipmentDetails: {
          equipmentCategory: form.equipmentCategory,
          make: form.make, model: form.model,
          year: form.year ? Number(form.year) : undefined,
          hours: form.hours ? Number(form.hours) : undefined,
          condition: form.condition,
          serialNumber: form.serialNumber || undefined,
          attachments: form.attachments ? form.attachments.split(',').map((s) => s.trim()).filter(Boolean) : [],
        },
      };
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create equipment listing');
      }
      router.push('/equipment');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] focus:outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/equipment" className="text-sm text-[#4a7c59] hover:underline">&larr; Back to Equipment</Link>
        <h1 className="text-2xl font-bold mt-2">List Equipment</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new equipment listing on the REALM Ag Marketplace.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>
          <div>
            <label className={labelCls}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. 2018 John Deere 6120M - 3,200 hrs" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Full description, service history, inclusions..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Listing Type *</label>
            <select required value={form.listingType} onChange={(e) => update('listingType', e.target.value)} className={inputCls}>
              <option value="sell">Selling</option>
              <option value="buy">Wanted / Buying</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Equipment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category *</label>
              <select required value={form.equipmentCategory} onChange={(e) => update('equipmentCategory', e.target.value)} className={inputCls}>
                <option value="">Select category</option>
                {EQUIPMENT_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition *</label>
              <select required value={form.condition} onChange={(e) => update('condition', e.target.value)} className={inputCls}>
                <option value="">Select condition</option>
                {EQUIPMENT_CONDITIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Make *</label>
              <input type="text" required value={form.make} onChange={(e) => update('make', e.target.value)} placeholder="e.g. John Deere" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Model *</label>
              <input type="text" required value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="e.g. 6120M" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input type="number" min="1900" max="2100" value={form.year} onChange={(e) => update('year', e.target.value)} placeholder="e.g. 2018" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hours / Kilometres</label>
              <input type="number" min="0" value={form.hours} onChange={(e) => update('hours', e.target.value)} placeholder="e.g. 3200" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Serial Number</label>
              <input type="text" value={form.serialNumber} onChange={(e) => update('serialNumber', e.target.value)} placeholder="Optional" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Attachments / Inclusions</label>
              <input type="text" value={form.attachments} onChange={(e) => update('attachments', e.target.value)} placeholder="Comma separated, e.g. Front End Loader, GPS Guidance, 4x Tyres" className={inputCls} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Pricing Type *</label>
              <select required value={form.pricingType} onChange={(e) => update('pricingType', e.target.value)} className={inputCls}>
                {Object.entries(PRICING_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v as string}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Price (AUD)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="e.g. 145000" className={inputCls} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>State</label>
              <select value={form.state} onChange={(e) => update('state', e.target.value)} className={inputCls}>
                <option value="">Select state</option>
                {AU_STATES.map(({ value, label }) => (<option key={value} value={value}>{label}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Pickup Location</label>
              <input type="text" value={form.pickupLocation} onChange={(e) => update('pickupLocation', e.target.value)} placeholder="e.g. Shepparton, VIC" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="freightIncluded" checked={form.freightIncluded} onChange={(e) => update('freightIncluded', e.target.checked)} />
            <label htmlFor="freightIncluded" className="text-sm text-gray-700">Freight / delivery included in price</label>
          </div>
        </div>
        {error && (<div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>)}
        <div className="flex gap-3 pt-4 border-t">
          <button type="submit" disabled={submitting} className="rounded-md bg-[#4a7c59] px-6 py-2 text-sm font-medium text-white hover:bg-[#3d6649] disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Equipment Listing'}
          </button>
          <Link href="/equipment" className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
