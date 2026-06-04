'use client';

import React, { useState } from 'react';

interface Props {
  directoryId: string;
  carrierName: string;
  defaults: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
}

export default function CarrierContactForm({ directoryId, carrierName, defaults }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      directory_id: directoryId,
      sender_name: fd.get('sender_name'),
      sender_email: fd.get('sender_email'),
      sender_phone: fd.get('sender_phone') || null,
      sender_company: fd.get('sender_company') || null,
      subject: fd.get('subject'),
      message: fd.get('message'),
      freight_type: fd.get('freight_type') || null,
      origin_region: fd.get('origin_region') || null,
      destination_region: fd.get('destination_region') || null,
      estimated_quantity: fd.get('estimated_quantity') || null,
      pickup_date: fd.get('pickup_date') || null,
    };
    try {
      const res = await fetch('/api/carriers/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send');
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to send message');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-900">
        <p className="font-medium mb-1">Message sent to {carrierName}</p>
        <p>
          We&rsquo;ve recorded your enquiry and notified the carrier. You&rsquo;ll see their reply in your dashboard
          and by email. If you don&rsquo;t hear back within 48 hours, the REALM team will follow up on your behalf.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Your name</label>
          <input
            name="sender_name"
            required
            defaultValue={defaults.name}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Your email</label>
          <input
            name="sender_email"
            type="email"
            required
            defaultValue={defaults.email}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
          <input
            name="sender_phone"
            defaultValue={defaults.phone}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Company (optional)</label>
          <input
            name="sender_company"
            defaultValue={defaults.company}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
        <input
          name="subject"
          required
          placeholder="e.g. Cattle freight enquiry — Bendigo to Naracoorte"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Freight type</label>
          <select name="freight_type" defaultValue="" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">— select —</option>
            <option value="livestock">Livestock</option>
            <option value="grain">Grain</option>
            <option value="hay_fodder">Hay / fodder</option>
            <option value="bulk">Bulk</option>
            <option value="refrigerated">Refrigerated</option>
            <option value="equipment">Equipment</option>
            <option value="general">General freight</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Origin</label>
          <input name="origin_region" placeholder="Town / State" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
          <input name="destination_region" placeholder="Town / State" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Estimated quantity</label>
          <input
            name="estimated_quantity"
            placeholder="e.g. 24 head, 30 tonne, 1 trailer"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pickup date (optional)</label>
          <input name="pickup_date" type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell the carrier about the load, special handling requirements, and any flexibility on dates."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          By sending, you agree your name, email and message will be shared with this carrier.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-md"
        >
          {submitting ? 'Sending…' : `Send to ${carrierName}`}
        </button>
      </div>
    </form>
  );
}
