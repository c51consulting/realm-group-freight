'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  directorySlug: string;
  listedEmail: string | null;
}

export default function CarrierClaimButton({ directorySlug, listedEmail }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/carriers/${directorySlug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimed_business_name: fd.get('claimed_business_name'),
          claimed_abn: fd.get('claimed_abn') || null,
          contact_role: fd.get('contact_role'),
          evidence_notes: fd.get('evidence_notes') || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?next=/carriers/${directorySlug}`);
          return;
        }
        throw new Error(json.error || 'Unable to submit claim');
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to submit claim');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-900">
        <p className="font-medium mb-1">Claim submitted</p>
        <p>
          {listedEmail
            ? `We've emailed a verification link to ${listedEmail}. Click it from that inbox to confirm ownership.`
            : 'A REALM admin will review your claim and contact you within 1–2 business days.'}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-md"
      >
        Claim this listing
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Registered business name</label>
        <input
          name="claimed_business_name"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">ABN (optional)</label>
        <input
          name="claimed_abn"
          placeholder="11 digits"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Your role</label>
        <select name="contact_role" required defaultValue="" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="" disabled>— select —</option>
          <option value="owner">Owner / Director</option>
          <option value="manager">Manager</option>
          <option value="operations">Operations</option>
          <option value="dispatch">Dispatch</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Verification notes (optional)</label>
        <textarea
          name="evidence_notes"
          rows={3}
          placeholder="Any extra context for the REALM team."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {listedEmail && (
        <p className="text-xs text-gray-500">
          A verification link will be sent to <span className="font-medium">{listedEmail}</span> (the email on file for
          this listing). Open it from that inbox to complete the claim.
        </p>
      )}
      {error && <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-800">{error}</div>}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:underline">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-md"
        >
          {submitting ? 'Submitting…' : 'Submit claim'}
        </button>
      </div>
    </form>
  );
}
