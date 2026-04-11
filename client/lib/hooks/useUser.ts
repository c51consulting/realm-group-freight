'use client';

import { useCallback, useEffect, useState } from 'react';
import { users as usersApi } from '../client';
import type { User, Review } from '../types';

interface UseUserReturn {
  user: User | null;
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  update: (payload: { businessName?: string; phone?: string; address?: object; abn?: string }) => Promise<void>;
}

export function useUser(id: string | undefined): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [u, r] = await Promise.all([usersApi.get(id), usersApi.reviews(id)]);
      setUser(u);
      setReviews(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const update = useCallback(
    async (payload: { businessName?: string; phone?: string; address?: object; abn?: string }) => {
      if (!id) return;
      const updated = await usersApi.update(id, payload);
      setUser(updated);
    },
    [id],
  );

  return { user, reviews, loading, error, refresh: fetch, update };
}
