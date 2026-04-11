'use client';

import { useCallback, useEffect, useState } from 'react';
import { orders as ordersApi } from '../client';
import type { Order } from '../types';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOrders(userId: string | undefined): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.forUser(userId);
      setOrders(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { orders, loading, error, refresh: fetch };
}

interface UseOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateStatus: (status: string, extra?: { deliveryEvidence?: object; disputeReason?: string }) => Promise<void>;
}

export function useOrder(id: string): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.get(id);
      setOrder(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateStatus = useCallback(
    async (status: string, extra?: { deliveryEvidence?: object; disputeReason?: string }) => {
      await ordersApi.updateStatus(id, { status, ...extra });
      await fetch();
    },
    [id, fetch],
  );

  return { order, loading, error, refresh: fetch, updateStatus };
}
