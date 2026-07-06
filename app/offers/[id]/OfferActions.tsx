'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OfferActionsProps {
  offerId: string;
  canSellerAction: boolean;
  canBuyerWithdraw: boolean;
  status: string;
}

export default function OfferActions({ offerId, canSellerAction, canBuyerWithdraw, status }: OfferActionsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actionOffer = async (action: 'accept' | 'reject' | 'withdraw') => {
    setSubmitting(action);
    setError(null);
    try {
      const res = await fetch('/api/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update offer');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update offer');
    } finally {
      setSubmitting(null);
    }
  };

  if (status !== 'pending') {
    return <p className="text-sm text-gray-500">No actions available for this offer.</p>;
  }

  return (
    <div className="space-y-3">
      {canSellerAction && (
        <>
          <button type="button" disabled={!!submitting} onClick={() => actionOffer('accept')} className="btn-primary w-full disabled:opacity-60">
            {submitting === 'accept' ? 'Accepting...' : 'Accept Offer'}
          </button>
          <button type="button" disabled={!!submitting} onClick={() => actionOffer('reject')} className="btn-secondary w-full disabled:opacity-60">
            {submitting === 'reject' ? 'Rejecting...' : 'Reject Offer'}
          </button>
        </>
      )}
      {canBuyerWithdraw && (
        <button type="button" disabled={!!submitting} onClick={() => actionOffer('withdraw')} className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-60">
          {submitting === 'withdraw' ? 'Withdrawing...' : 'Withdraw Offer'}
        </button>
      )}
      {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
    </div>
  );
}
