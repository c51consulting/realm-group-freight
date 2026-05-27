'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimLoadButton({ orderId, canClaim }: { orderId: string; canClaim: boolean }) {
  const router = useRouter();
  const [showQuote, setShowQuote] = useState(false);
  const [freightAmount, setFreightAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      const body: any = {};
      if (freightAmount) body.freightAmount = parseFloat(freightAmount);
      const res = await fetch(`/api/orders/${orderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to claim');
        return;
      }
      router.push(`/orders/${orderId}`);
    } finally {
      setLoading(false);
    }
  }

  if (!canClaim) {
    return <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">Claim (activate account first)</button>;
  }

  if (!showQuote) {
    return <button onClick={() => setShowQuote(true)} className="btn-primary w-full">Claim this load</button>;
  }

  return (
    <div className="space-y-2">
      <label className="label">Your freight quote (AUD)</label>
      <input
        type="number"
        min={0}
        step={1}
        value={freightAmount}
        onChange={(e) => setFreightAmount(e.target.value)}
        className="input"
        placeholder="e.g. 850"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setShowQuote(false)} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleClaim} disabled={loading} className="btn-primary flex-1">{loading ? 'Claiming…' : 'Confirm'}</button>
      </div>
    </div>
  );
}
