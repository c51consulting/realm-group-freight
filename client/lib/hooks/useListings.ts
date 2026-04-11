'use client';

import { useCallback, useEffect, useState } from 'react';
import { listings as listingsApi } from '../client';
import type { Listing, ListingFilters, ListingsResponse } from '../types';

interface UseListingsReturn {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: ListingFilters;
  setFilters: (filters: ListingFilters) => void;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function useListings(initialFilters: ListingFilters = {}): UseListingsReturn {
  const [data, setData] = useState<ListingsResponse>({
    listings: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [filters, setFiltersState] = useState<ListingFilters>({ page: 1, limit: 20, ...initialFilters });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.list(filters);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const setFilters = useCallback((f: ListingFilters) => {
    setFiltersState((prev) => ({ ...prev, ...f, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  return {
    listings: data.listings,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    refresh: fetch,
  };
}

interface UseListingReturn {
  listing: Listing | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useListing(id: string): UseListingReturn {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.get(id);
      setListing(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { listing, loading, error, refresh: fetch };
}
