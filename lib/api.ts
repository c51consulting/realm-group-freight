/**
 * API helper functions for CRUD operations against the Supabase backend.
 *
 * Each function returns typed data or throws an Error with a human-readable
 * message. Callers should handle errors with try/catch or React error
 * boundaries.
 *
 * These helpers use the browser-safe anon client and are subject to RLS.
 * For admin/service operations use createServiceClient() from lib/supabase.ts.
 */

import { supabase } from './supabase';
import type {
  Listing,
  FreightJob,
  FeedTest,
  QualityTier,
  Offer,
  Order,
  WeighEvent,
  ProofOfDelivery,
  PaginatedResponse,
  UUID,
} from './types';
import { DEFAULT_PAGE_SIZE } from './constants';

// ─── Utility ──────────────────────────────────────────────────────────────────

function assertOk<T>(
  data: T | null,
  error: { message: string } | null,
  context: string,
): T {
  if (error) throw new Error(`[api/${context}] ${error.message}`);
  if (data === null) throw new Error(`[api/${context}] No data returned`);
  return data;
}

function paginationRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export interface ListingFilters {
  materialType?: string;
  qualityLevel?: string;
  pricingType?: string;
  minPrice?: number;
  maxPrice?: number;
  state?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getListings(
  filters: ListingFilters = {},
): Promise<PaginatedResponse<Listing>> {
  const {
    material_type: materialType,
    quality_level: qualityLevel,
    pricingType,
    minPrice,
    maxPrice,
    search,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  const { from, to } = paginationRange(page, pageSize);

  let query = supabase
    .from('listings')
    .select('*, seller:users(*)', { count: 'exact' })
    .eq('status', 'active')
    .range(from, to)
    .order('created_at', { ascending: false });

  if (materialType) query = query.eq('material_type', materialType);
  if (qualityLevel) query = query.eq('quality_level', qualityLevel);
  if (pricingType)  query = query.eq('pricing_type', pricingType);
  if (minPrice)     query = query.gte('pricePerUnit', minPrice);
  if (maxPrice)     query = query.lte('pricePerUnit', maxPrice);
  if (search)       query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;
  assertOk(data, error, 'getListings');

  return {
    data: (data ?? []) as Listing[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getListingById(id: UUID): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, seller:users(*), feedTests:feed_tests(*), offers(*)')
    .eq('id', id)
    .single();

  return assertOk(data, error, 'getListingById') as Listing;
}

export async function createListing(
  payload: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'feedTests' | 'offers'>,
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select()
    .single();

  return assertOk(data, error, 'createListing') as Listing;
}

export async function updateListing(
  id: UUID,
  payload: Partial<Listing>,
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  return assertOk(data, error, 'updateListing') as Listing;
}

export async function deleteListing(id: UUID): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) throw new Error(`[api/deleteListing] ${error.message}`);
}

// ─── Freight Jobs ─────────────────────────────────────────────────────────────

export interface FreightFilters {
  status?: string;
  state?: string;
  page?: number;
  pageSize?: number;
}

export async function getFreightJobs(
  filters: FreightFilters = {},
): Promise<PaginatedResponse<FreightJob>> {
  const { status, page = 1, pageSize = DEFAULT_PAGE_SIZE } = filters;
  const { from, to } = paginationRange(page, pageSize);

  let query = supabase
    .from('freight_jobs')
    .select('*, poster:users!posterId(*), carrier:users!carrierId(*)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  assertOk(data, error, 'getFreightJobs');

  return {
    data: (data ?? []) as FreightJob[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getFreightJobById(id: UUID): Promise<FreightJob> {
  const { data, error } = await supabase
    .from('freight_jobs')
    .select('*, poster:users!posterId(*), carrier:users!carrierId(*), order:orders(*)')
    .eq('id', id)
    .single();

  return assertOk(data, error, 'getFreightJobById') as FreightJob;
}

export async function createFreightJob(
  payload: Omit<FreightJob, 'id' | 'createdAt' | 'updatedAt' | 'poster' | 'carrier' | 'order'>,
): Promise<FreightJob> {
  const { data, error } = await supabase
    .from('freight_jobs')
    .insert(payload)
    .select()
    .single();

  return assertOk(data, error, 'createFreightJob') as FreightJob;
}

// ─── Quality / Feed Tests ─────────────────────────────────────────────────────

export async function getFeedTestsByListing(listingId: UUID): Promise<FeedTest[]> {
  const { data, error } = await supabase
    .from('feed_tests')
    .select('*')
    .eq('listingId', listingId)
    .order('testDate', { ascending: false });

  return assertOk(data, error, 'getFeedTestsByListing') as FeedTest[];
}

export async function getQualityTierById(id: UUID): Promise<QualityTier> {
  const { data, error } = await supabase
    .from('quality_tiers')
    .select('*, listing:listings(*), feedTests:feed_tests(*)')
    .eq('id', id)
    .single();

  return assertOk(data, error, 'getQualityTierById') as QualityTier;
}

export async function getQualityTiers(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<QualityTier>> {
  const { from, to } = paginationRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('quality_tiers')
    .select('*, listing:listings(*)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  assertOk(data, error, 'getQualityTiers');

  return {
    data: (data ?? []) as QualityTier[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── Offers ───────────────────────────────────────────────────────────────────

export async function getOffers(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<Offer>> {
  const { from, to } = paginationRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('offers')
    .select('*, listing:listings(*), buyer:users(*)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  assertOk(data, error, 'getOffers');

  return {
    data: (data ?? []) as Offer[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getOfferById(id: UUID): Promise<Offer> {
  const { data, error } = await supabase
    .from('offers')
    .select('*, listing:listings(*), buyer:users(*)')
    .eq('id', id)
    .single();

  return assertOk(data, error, 'getOfferById') as Offer;
}

export async function createOffer(
  payload: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'listing' | 'buyer'>,
): Promise<Offer> {
  const { data, error } = await supabase
    .from('offers')
    .insert(payload)
    .select()
    .single();

  return assertOk(data, error, 'createOffer') as Offer;
}

export async function updateOfferStatus(
  id: UUID,
  status: Offer['status'],
): Promise<Offer> {
  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return assertOk(data, error, 'updateOfferStatus') as Offer;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<Order>> {
  const { from, to } = paginationRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('orders')
    .select('*, listing:listings(*), buyer:users!buyerId(*), seller:users!sellerId(*)', {
      count: 'exact',
    })
    .range(from, to)
    .order('created_at', { ascending: false });

  assertOk(data, error, 'getOrders');

  return {
    data: (data ?? []) as Order[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getOrderById(id: UUID): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, listing:listings(*), buyer:users!buyerId(*), seller:users!sellerId(*), carrier:users!carrierId(*), weighEvents:weigh_events(*)',
    )
    .eq('id', id)
    .single();

  return assertOk(data, error, 'getOrderById') as Order;
}

export async function updateOrderStatus(
  id: UUID,
  status: Order['status'],
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return assertOk(data, error, 'updateOrderStatus') as Order;
}

// ─── Weigh Events ─────────────────────────────────────────────────────────────

export async function getWeighEventsByOrder(orderId: UUID): Promise<WeighEvent[]> {
  const { data, error } = await supabase
    .from('weigh_events')
    .select('*')
    .eq('orderId', orderId)
    .order('weighedAt', { ascending: false });

  return assertOk(data, error, 'getWeighEventsByOrder') as WeighEvent[];
}

// ─── Proof of Delivery ────────────────────────────────────────────────────────

export async function getPODByOrder(orderId: UUID): Promise<ProofOfDelivery | null> {
  const { data, error } = await supabase
    .from('proof_of_delivery')
    .select('*')
    .eq('orderId', orderId)
    .maybeSingle();

  if (error) throw new Error(`[api/getPODByOrder] ${error.message}`);
  return data as ProofOfDelivery | null;
}
