'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CarrierReviewActions({ carrierId, currentStatus }: { carrierId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reasonOpen, setReasonOpen] = useState<null | 'rejected' | 'suspended'>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function update(newStatus: string, rejectionReason?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/carriers/${carrierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejectionReason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'Update failed');
        return;
      }
      setReasonOpen(null);
      setReason('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (reasonOpen) {
    return (
      <div className="space-y-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Reason for ${reasonOpen}…`}
          className="input min-h-[80px]"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setReasonOpen(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={() => update(reasonOpen, reason || undefined)} disabled={loading} className="btn-primary flex-1 text-sm bg-red-600 hover:bg-red-700">
            Confirm {reasonOpen}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {currentStatus !== 'active' && (
        <button onClick={() => update('active')} disabled={loading} className="btn-primary w-full text-sm bg-green-600 hover:bg-green-700">
          {loading ? '…' : 'Approve / Activate'}
        </button>
      )}
      {currentStatus !== 'suspended' && currentStatus === 'active' && (
        <button onClick={() => setReasonOpen('suspended')} className="btn-secondary w-full text-sm">Suspend</button>
      )}
      {currentStatus === 'pending_review' && (
        <button onClick={() => setReasonOpen('rejected')} className="btn-secondary w-full text-sm border-red-300 text-red-700">Reject</button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
