'use client';

import { useState } from 'react';

export default function CheckoutButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');
      if (!data.url) throw new Error('Stripe did not return a checkout URL');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button type="button" onClick={startCheckout} disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? 'Opening checkout...' : 'Pay securely with Stripe'}
      </button>
      {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
    </div>
  );
}
