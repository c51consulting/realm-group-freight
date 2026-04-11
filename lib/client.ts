/**
 * Type-safe API client for the REALM Ag Marketplace.
 * Wraps fetch with auth token handling, error parsing, and typed responses.
 */

'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  fields?: Record<string, string>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Thrown when the API returns a non-2xx response. */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly fields?: Record<string, string>;

  constructor(message: string, statusCode: number, code?: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'carrier' | 'admin';
export type MaterialType =
  | 'hay' | 'straw' | 'silage' | 'grain' | 'seed'
  | 'pellets' | 'fertiliser' | 'supplement' | 'drums'
  | 'bulk_liquid' | 'other';
export type UnitType =
  | 'bale_small' | 'bale_large' | 'bale_round' | 'bag' | 'drum'
  | 'tonne' | 'kg' | 'load' | 'pallet' | 'cubic_metre' | 'litre' | 'custom';
export type QualityLevel = 'basic' | 'verified' | 'performance';
export type PricingType = 'fixed' | 'offers' | 'auction' | 'urgent';
export type ListingStatus = 'active' | 'paused' | 'sold' | 'expired' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
export type OrderStatus =
  | 'pending_payment' | 'paid' | 'in_transit' | 'delivered'
  | 'confirmed' | 'disputed' | 'refunded' | 'completed';

export interface User {
  id: string;
  email: string;
  businessName?: string;
  abn?: string;
  phone?: string;
  role: UserRole;
  address?: Record<string, string>;
  lat?: number;
  lng?: number;
  verified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  type: 'sell' | 'buy' | 'freight_only';
  status: ListingStatus;
  materialType: MaterialType;
  materialSubtype?: string;
  title: string;
  description?: string;
  unitType: UnitType;
  unitLabel?: string;
  pricePerUnit?: number;
  pricePerTonneEquiv?: number;
  quantityAvailable?: number;
  quantityUnit?: string;
  minimumOrder?: number;
  estimatedWeightPerUnit?: number;
  pricingType: PricingType;
  freightIncluded: boolean;
  deliveryRadius?: number;
  pickupAddress?: Record<string, string>;
  pickupLat?: number;
  pickupLng?: number;
  loadingAvailable: boolean;
  images: string[];
  qualityLevel: QualityLevel;
  expiresAt?: string;
  sellerId: string;
  seller?: Partial<User>;
  feedTests?: FeedTest[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedTest {
  id: string;
  listingId: string;
  source: 'lab' | 'on_farm_nir' | 'vendor_estimate';
  labName?: string;
  testDate?: string;
  certificateUrl?: string;
  dryMatter?: number;
  moisture?: number;
  crudeProtein?: number;
  metabolisableEnergy?: number;
  ndf?: number;
  adf?: number;
  digestibility?: number;
  afiaGrade?: string;
  rfv?: number;
  fei?: number;
  ash?: number;
  verified: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  status: OfferStatus;
  pricePerUnit: number;
  quantity: number;
  totalPrice?: number;
  freightIncluded: boolean;
  freightPrice?: number;
  deliveryDate?: string;
  message?: string;
  expiresAt?: string;
  buyer?: Partial<User>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  offerId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  carrierId?: string;
  totalAmount: number;
  freightAmount: number;
  platformFee: number;
  paymentHeld: boolean;
  paymentReleasedAt?: string;
  stripePaymentIntentId?: string;
  qualityAssuranceLevel: QualityLevel;
  contractTerms?: Record<string, unknown>;
  deliveryEvidence?: Record<string, unknown>;
  confirmedAt?: string;
  disputeReason?: string;
  buyer?: Partial<User>;
  seller?: Partial<User>;
  carrier?: Partial<User>;
  weighEvents?: WeighEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface WeighEvent {
  id: string;
  orderId?: string;
  source: 'api' | 'csv_import' | 'email_parse' | 'ocr_upload' | 'manual';
  sourceSystem?: string;
  sourceTicketId?: string;
  siteId?: string;
  siteName?: string;
  vehicleRego?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weightUnit: 'kg' | 'tonne';
  weighedAt?: string;
  operatorName?: string;
  ticketImageUrl?: string;
  tradeApproved: boolean;
  verified: boolean;
  settlementStatus: 'pending' | 'matched' | 'disputed' | 'settled';
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  role: 'buyer' | 'seller' | 'carrier';
  reviewer?: Partial<User>;
  createdAt: string;
}

export interface AuthResponse {
  user: Pick<User, 'id' | 'email' | 'businessName' | 'role'>;
  token: string;
}

// ─── Token Storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'realm_auth_token';

/** Retrieve the stored JWT from localStorage (browser only). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Persist a JWT to localStorage. */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/** Remove the stored JWT (logout). */
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip attaching the Authorization header. */
  skipAuth?: boolean;
  /** Override the base URL for this request. */
  baseUrl?: string;
}

/**
 * Core fetch wrapper. Attaches auth headers, serialises JSON bodies,
 * and throws ApiError for non-2xx responses.
 */
async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, skipAuth, baseUrl, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl ?? BASE_URL}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle empty responses (e.g. 204 No Content)
  if (response.status === 204) return undefined as T;

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(`Server returned non-JSON response (${response.status})`, response.status);
  }

  if (!response.ok) {
    const err = json as ApiErrorResponse;
    throw new ApiError(
      err?.error ?? `Request failed with status ${response.status}`,
      response.status,
      err?.code,
      err?.fields
    );
  }

  // Unwrap { success: true, data: ... } envelope if present
  if (json && typeof json === 'object' && 'success' in (json as object)) {
    return (json as ApiSuccessResponse<T>).data;
  }

  return json as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Register a new user account.
   * Automatically stores the returned JWT.
   */
  async register(data: {
    email: string;
    password: string;
    businessName?: string;
    abn?: string;
    phone?: string;
    role?: UserRole;
    address?: Record<string, string>;
  }): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: data,
      skipAuth: true,
    });
    setToken(result.token);
    return result;
  },

  /**
   * Log in with email and password.
   * Automatically stores the returned JWT.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });
    setToken(result.token);
    return result;
  },

  /** Fetch the currently authenticated user's profile. */
  async me(): Promise<User> {
    return apiFetch<User>('/api/auth/me');
  },

  /** Clear the stored token (client-side logout). */
  logout(): void {
    clearToken();
  },
};

// ─── Listings API ─────────────────────────────────────────────────────────────

export interface ListingFilters {
  materialType?: MaterialType;
  type?: 'sell' | 'buy' | 'freight_only';
  unitType?: UnitType;
  minPrice?: number;
  maxPrice?: number;
  qualityLevel?: QualityLevel;
  pricingType?: PricingType;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface ListingsPage {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export const listingsApi = {
  /** Search and filter active listings. */
  async list(filters: ListingFilters = {}): Promise<ListingsPage> {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null) params.set(key, String(val));
    }
    return apiFetch<ListingsPage>(`/api/listings?${params.toString()}`);
  },

  /** Fetch a single listing by ID. */
  async get(id: string): Promise<Listing> {
    return apiFetch<Listing>(`/api/listings/${id}`);
  },

  /** Create a new listing. Requires authentication. */
  async create(data: Partial<Listing>): Promise<Listing> {
    return apiFetch<Listing>('/api/listings', { method: 'POST', body: data });
  },

  /** Update an existing listing. Requires authentication. */
  async update(id: string, data: Partial<Listing>): Promise<Listing> {
    return apiFetch<Listing>(`/api/listings/${id}`, { method: 'PUT', body: data });
  },

  /** Cancel (soft-delete) a listing. Requires authentication. */
  async cancel(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/listings/${id}`, { method: 'DELETE' });
  },
};

// ─── Offers API ───────────────────────────────────────────────────────────────

export const offersApi = {
  /** Submit an offer on a listing. */
  async create(data: {
    listingId: string;
    pricePerUnit: number;
    quantity: number;
    freightIncluded?: boolean;
    freightPrice?: number;
    deliveryDate?: string;
    message?: string;
  }): Promise<Offer> {
    return apiFetch<Offer>('/api/offers', { method: 'POST', body: data });
  },

  /** Get all offers for a listing. */
  async forListing(listingId: string): Promise<Offer[]> {
    return apiFetch<Offer[]>(`/api/offers/listing/${listingId}`);
  },

  /** Accept an offer (seller action). */
  async accept(offerId: string): Promise<Offer> {
    return apiFetch<Offer>(`/api/offers/${offerId}/accept`, { method: 'PUT' });
  },

  /** Reject an offer (seller action). */
  async reject(offerId: string): Promise<Offer> {
    return apiFetch<Offer>(`/api/offers/${offerId}/reject`, { method: 'PUT' });
  },

  /** Withdraw an offer (buyer action). */
  async withdraw(offerId: string): Promise<Offer> {
    return apiFetch<Offer>(`/api/offers/${offerId}/withdraw`, { method: 'PUT' });
  },
};

// ─── Orders API ───────────────────────────────────────────────────────────────

export const ordersApi = {
  /** Create an order from an accepted offer. */
  async create(offerId: string): Promise<Order> {
    return apiFetch<Order>('/api/orders', { method: 'POST', body: { offerId } });
  },

  /** Fetch a single order by ID. */
  async get(id: string): Promise<Order> {
    return apiFetch<Order>(`/api/orders/${id}`);
  },

  /** Update order status (e.g. in_transit → delivered). */
  async updateStatus(
    id: string,
    status: OrderStatus,
    extras?: { deliveryEvidence?: Record<string, unknown>; disputeReason?: string }
  ): Promise<Order> {
    return apiFetch<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: { status, ...extras },
    });
  },

  /** Get all orders for a user (as buyer, seller, or carrier). */
  async forUser(userId: string): Promise<Order[]> {
    return apiFetch<Order[]>(`/api/orders/user/${userId}`);
  },
};

// ─── Weighbridge API ──────────────────────────────────────────────────────────

export const weighbridgeApi = {
  /** Get all weigh events for an order. */
  async forOrder(orderId: string): Promise<WeighEvent[]> {
    return apiFetch<WeighEvent[]>(`/api/weighbridge/order/${orderId}`);
  },

  /** Submit a manual weigh event. */
  async manual(data: Partial<WeighEvent> & { orderId?: string }): Promise<WeighEvent> {
    return apiFetch<WeighEvent>('/api/weighbridge/manual', { method: 'POST', body: data });
  },

  /** Verify a weigh event (admin/seller action). */
  async verify(eventId: string): Promise<WeighEvent> {
    return apiFetch<WeighEvent>(`/api/weighbridge/${eventId}/verify`, { method: 'PUT' });
  },
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  /** Fetch a user's public profile. */
  async get(userId: string): Promise<User & { listings?: Listing[] }> {
    return apiFetch<User & { listings?: Listing[] }>(`/api/users/${userId}`);
  },

  /** Update the current user's profile. */
  async update(
    userId: string,
    data: Pick<User, 'businessName' | 'phone' | 'address' | 'abn'>
  ): Promise<User> {
    return apiFetch<User>(`/api/users/${userId}`, { method: 'PUT', body: data });
  },

  /** Get reviews received by a user. */
  async reviews(userId: string): Promise<Review[]> {
    return apiFetch<Review[]>(`/api/users/${userId}/reviews`);
  },

  /** Post a review for a user. */
  async review(
    userId: string,
    data: { orderId: string; rating: number; comment?: string; role: 'buyer' | 'seller' | 'carrier' }
  ): Promise<Review> {
    return apiFetch<Review>(`/api/users/${userId}/reviews`, { method: 'POST', body: data });
  },
};

// ─── Feed Tests API ───────────────────────────────────────────────────────────

export const feedTestsApi = {
  /** Get all feed tests for a listing. */
  async forListing(listingId: string): Promise<FeedTest[]> {
    return apiFetch<FeedTest[]>(`/api/feedtests/listing/${listingId}`);
  },

  /** Get a single feed test. */
  async get(id: string): Promise<FeedTest> {
    return apiFetch<FeedTest>(`/api/feedtests/${id}`);
  },

  /** Add a feed test result to a listing. */
  async create(data: Partial<FeedTest> & { listingId: string }): Promise<FeedTest> {
    return apiFetch<FeedTest>('/api/feedtests', { method: 'POST', body: data });
  },
};
