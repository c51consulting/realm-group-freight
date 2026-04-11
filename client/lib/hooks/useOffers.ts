'use client';

import { useCallback, useEffect, useState } from 'react';
import { offers as offersApi } from '../client';
import type { Offer } from '../types';

interface UseOffersReturn {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  accept: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  withdraw: (id: string) => Promise<void>;
}

export function useOffersForListing(listingId: string): UseOffersReturn {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await offersApi.forListing(listingId);
      setOffers(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const accept = useCallback(async (id: string) => {
    await offersApi.accept(id);
    await fetch();
  }, [fetch]);

  const reject = useCallback(async (id: string) => {
    await offersApi.reject(id);
    await fetch();
  }, [fetch]);

  const withdraw = useCallback(async (id: string) => {
    await offersApi.withdraw(id);
    await fetch();
  }, [fetch]);

  return { offers, loading, error, refresh: fetch, accept, reject, withdraw };
}
