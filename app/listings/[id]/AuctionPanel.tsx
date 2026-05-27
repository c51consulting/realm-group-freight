'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Bid {
  id: string;
  amount: number;
  bidder_alias: string;
  is_winning: boolean;
  is_buy_now: boolean;
  created_at: string;
}

interface Props {
  listingId: string;
  sellerId: string;
  currentUserId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  startingPrice: number | null;
  currentBid: number | null;
  increment: number | null;
  buyNowPrice: number | null;
  status: string | null;
  bidCount: number | null;
  isWinner: boolean;
}

function formatAUD(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

function countdown(endsAt: Date) {
  const diff = endsAt.getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function AuctionPanel(props: Props) {
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const ends = props.endsAt ? new Date(props.endsAt) : null;
  const starts = props.startsAt ? new Date(props.startsAt) : null;
  const now = new Date();
  const hasStarted = starts ? now >= starts : true;
  const hasEnded = ends ? now >= ends : false;
  const isSeller = props.currentUserId === props.sellerId;
  const isLoggedIn = !!props.currentUserId;

  const minNextBid = (() => {
    const inc = props.increment || 10;
    if (props.currentBid != null) return Number(props.currentBid) + inc;
    return props.startingPrice || 0;
  })();

  // Countdown ticker
  useEffect(() => {
    if (!ends || hasEnded) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.endsAt]);

  // Bid history polling (every 5s while live)
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/listings/${props.listingId}/bids`);
        const data = await res.json();
        if (alive && Array.isArray(data?.bids)) setBids(data.bids);
      } catch {}
      finally { if (alive) setLoading(false); }
    }
    load();
    if (!hasEnded) {
      const t = setInterval(load, 5000);
      return () => { alive = false; clearInterval(t); };
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.listingId]);

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(bidAmount);
    if (!isFinite(amt) || amt <= 0) { setError('Enter a valid bid amount'); return; }
    if (amt < minNextBid) { setError(`Minimum bid is ${formatAUD(minNextBid)}`); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${props.listingId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Bid failed (${res.status})`);
      setBidAmount('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bid failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function buyNow() {
    if (!confirm(`Buy now for ${formatAUD(props.buyNowPrice || 0)}? This ends the auction immediately.`)) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${props.listingId}/buy-now`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Buy-now failed (${res.status})`);
      router.push(`/orders/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Buy-now failed');
      setSubmitting(false);
    }
  }

  // Status banner
  let banner: { tone: 'live' | 'pending' | 'ended' | 'sold' | 'nosale'; text: string };
  if (props.status === 'ended_sold') banner = { tone: 'sold', text: 'Auction ended — sold' };
  else if (props.status === 'ended_no_sale') banner = { tone: 'nosale', text: 'Auction ended — reserve not met' };
  else if (props.status === 'cancelled') banner = { tone: 'ended', text: 'Auction cancelled' };
  else if (hasEnded) banner = { tone: 'ended', text: 'Auction ended — closing…' };
  else if (!hasStarted) banner = { tone: 'pending', text: starts ? `Starts ${starts.toLocaleString('en-AU')}` : 'Scheduled' };
  else banner = { tone: 'live', text: 'Live auction' };

  const toneClasses = {
    live:    'bg-green-50 text-green-800 border-green-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    ended:   'bg-gray-100 text-gray-700 border-gray-200',
    sold:    'bg-brand-50 text-brand-800 border-brand-200',
    nosale:  'bg-red-50 text-red-700 border-red-200',
  }[banner.tone];

  return (
    <div className="space-y-4">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${toneClasses}`}>
        <span className="relative flex h-2 w-2">
          {banner.tone === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${banner.tone === 'live' ? 'bg-green-500' : banner.tone === 'sold' ? 'bg-brand-500' : banner.tone === 'nosale' ? 'bg-red-500' : 'bg-gray-400'}`} />
        </span>
        {banner.text}
      </div>

      {/* Current bid */}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Current bid</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {props.currentBid != null ? formatAUD(Number(props.currentBid)) : (props.startingPrice ? formatAUD(props.startingPrice) + ' (start)' : 'No bids')}
        </p>
        <p className="text-xs text-gray-500 mt-1">{props.bidCount || 0} bid{props.bidCount === 1 ? '' : 's'} · {formatAUD(props.increment || 10)} min increment</p>
      </div>

      {/* Countdown */}
      {ends && !hasEnded && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500">Time left</p>
          <p className="font-mono font-semibold text-lg text-gray-900 mt-1">{countdown(ends)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ends {ends.toLocaleString('en-AU')}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Bid form */}
      {!isSeller && !hasEnded && hasStarted && props.status !== 'ended_sold' && props.status !== 'ended_no_sale' && (
        isLoggedIn ? (
          <form onSubmit={placeBid} className="space-y-2">
            <label htmlFor="bidAmount" className="label">Your bid (AUD)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  id="bidAmount"
                  type="number"
                  min={minNextBid}
                  step="1"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={String(minNextBid)}
                  className="input pl-7"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary px-5 disabled:opacity-60">
                {submitting ? '…' : 'Place Bid'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Minimum next bid: {formatAUD(minNextBid)}</p>
          </form>
        ) : (
          <a href={`/login?redirectTo=/listings/${props.listingId}`} className="btn-primary w-full text-center block">Sign in to bid</a>
        )
      )}

      {/* Buy-now button */}
      {!isSeller && !hasEnded && hasStarted && props.buyNowPrice && props.status !== 'ended_sold' && (
        isLoggedIn ? (
          <button onClick={buyNow} disabled={submitting} className="btn-secondary w-full disabled:opacity-60">
            Buy Now · {formatAUD(Number(props.buyNowPrice))}
          </button>
        ) : null
      )}

      {/* Winner banner */}
      {props.status === 'ended_sold' && props.isWinner && (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          🎉 You won this auction. Check your <a className="underline font-medium" href="/orders">orders</a> to complete payment.
        </div>
      )}

      {isSeller && (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
          This is your auction. Sellers can&apos;t bid.
        </div>
      )}

      {/* Bid history */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Bid history</h3>
        {loading ? (
          <p className="text-xs text-gray-500">Loading…</p>
        ) : bids.length === 0 ? (
          <p className="text-xs text-gray-500">No bids yet — be first.</p>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {bids.map((b) => (
              <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono text-xs text-gray-500">{b.bidder_alias}</span>
                  {b.is_winning && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">HIGH</span>}
                  {b.is_buy_now && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-800">BUY NOW</span>}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatAUD(Number(b.amount))}</div>
                  <div className="text-[10px] text-gray-400">{new Date(b.created_at).toLocaleString('en-AU')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
