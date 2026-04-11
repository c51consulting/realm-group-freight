'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { offers as offersApi } from '@/lib/client';
import { useNotification } from '@/lib/context/NotificationContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatDate, offerStatusColour } from '@/lib/client-utils';
import type { Offer } from '@/lib/types';

export default function OffersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  // Fetch offers for the current user's listings
  useEffect(() => {
    if (!user) return;
    // We don't have a "my offers" endpoint, so we show a placeholder
    setLoading(false);
  }, [user]);

  const handleWithdraw = async (id: string) => {
    try {
      await offersApi.withdraw(id);
      setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status: 'withdrawn' } : o));
      notify('Offer withdrawn', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to withdraw offer', 'error');
    }
  };

  if (authLoading || !user) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="container-page section">
      <PageHeader title="My Offers" subtitle="Offers you have made on listings." />
      <ErrorMessage message={error} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No offers yet</p>
          <p className="text-sm mt-1">
            <Link href="/listings" className="text-brand-600 hover:underline">Browse listings</Link> to make your first offer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="card card-body flex items-center justify-between gap-4">
              <div>
                <Link href={`/listings/${offer.listingId}`} className="font-medium text-gray-900 hover:text-brand-700">
                  {offer.listing?.title ?? offer.listingId}
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatCurrency(offer.pricePerUnit)} × {offer.quantity} = {formatCurrency(offer.totalPrice)}
                </p>
                <p className="text-xs text-gray-400">{formatDate(offer.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge ${offerStatusColour(offer.status)}`}>{offer.status}</span>
                {offer.status === 'pending' && (
                  <button onClick={() => handleWithdraw(offer.id)} className="btn-ghost btn-sm text-red-600">
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
