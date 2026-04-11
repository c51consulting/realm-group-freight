/**
 * REALM Ag Marketplace — API client
 *
 * Thin fetch wrapper that:
 *  - Reads the JWT from localStorage and attaches it as a Bearer token
 *  - Serialises request bodies as JSON
 *  - Throws a typed ApiError on non-2xx responses
 *  - Handles 401 by clearing the stored token (auto-logout)
 */

import type {
  AuthResponse,
  Listing,
  ListingFilters,
  ListingsResponse,
  Offer,
  Order,
  WeighbridgeEvent,
  FeedTest,
  Review,
  User,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// ── Token helpers ────────────────────────────────────────────────────────────

export const TOKEN_KEY = 'realm_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip attaching the Authorization header */
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    // Redirect to login if in browser
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  register(payload: {
    email: string;
    password: string;
    businessName?: string;
    abn?: string;
    phone?: string;
    role?: string;
    address?: object;
  }): Promise<AuthResponse> {
    return request('/api/auth/register', { method: 'POST', body: payload, skipAuth: true });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request('/api/auth/login', { method: 'POST', body: { email, password }, skipAuth: true });
  },

  me(): Promise<User> {
    return request('/api/auth/me');
  },
};

// ── Listings ─────────────────────────────────────────────────────────────────

export const listings = {
  list(filters: ListingFilters = {}): Promise<ListingsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return request(`/api/listings${qs ? `?${qs}` : ''}`);
  },

  get(id: string): Promise<Listing> {
    return request(`/api/listings/${id}`);
  },

  create(payload: Partial<Listing> & { userId: string }): Promise<Listing> {
    return request('/api/listings', { method: 'POST', body: payload });
  },

  update(id: string, payload: Partial<Listing>): Promise<Listing> {
    return request(`/api/listings/${id}`, { method: 'PUT', body: payload });
  },

  remove(id: string): Promise<{ message: string }> {
    return request(`/api/listings/${id}`, { method: 'DELETE' });
  },
};

// ── Offers ───────────────────────────────────────────────────────────────────

export const offers = {
  create(payload: {
    listingId: string;
    buyerId: string;
    pricePerUnit: number;
    quantity: number;
    freightIncluded?: boolean;
    freightPrice?: number;
    deliveryDate?: string;
    message?: string;
  }): Promise<Offer> {
    return request('/api/offers', { method: 'POST', body: payload });
  },

  forListing(listingId: string): Promise<Offer[]> {
    return request(`/api/offers/listing/${listingId}`);
  },

  accept(id: string): Promise<Offer> {
    return request(`/api/offers/${id}/accept`, { method: 'PUT' });
  },

  reject(id: string): Promise<Offer> {
    return request(`/api/offers/${id}/reject`, { method: 'PUT' });
  },

  withdraw(id: string): Promise<Offer> {
    return request(`/api/offers/${id}/withdraw`, { method: 'PUT' });
  },
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const orders = {
  create(offerId: string): Promise<Order> {
    return request('/api/orders', { method: 'POST', body: { offerId } });
  },

  get(id: string): Promise<Order> {
    return request(`/api/orders/${id}`);
  },

  forUser(userId: string): Promise<Order[]> {
    return request(`/api/orders/user/${userId}`);
  },

  updateStatus(
    id: string,
    payload: {
      status: string;
      deliveryEvidence?: object;
      disputeReason?: string;
    },
  ): Promise<Order> {
    return request(`/api/orders/${id}/status`, { method: 'PUT', body: payload });
  },
};

// ── Weighbridge ───────────────────────────────────────────────────────────────

export const weighbridge = {
  manual(payload: Partial<WeighbridgeEvent> & { orderId?: string }): Promise<WeighbridgeEvent> {
    return request('/api/weighbridge/manual', { method: 'POST', body: payload });
  },

  forOrder(orderId: string): Promise<WeighbridgeEvent[]> {
    return request(`/api/weighbridge/order/${orderId}`);
  },

  verify(id: string, userId: string): Promise<WeighbridgeEvent> {
    return request(`/api/weighbridge/${id}/verify`, { method: 'PUT', body: { userId } });
  },
};

// ── Feed Tests ────────────────────────────────────────────────────────────────

export const feedTests = {
  create(payload: Partial<FeedTest> & { listingId: string }): Promise<FeedTest> {
    return request('/api/feedtests', { method: 'POST', body: payload });
  },

  forListing(listingId: string): Promise<FeedTest[]> {
    return request(`/api/feedtests/listing/${listingId}`);
  },

  get(id: string): Promise<FeedTest> {
    return request(`/api/feedtests/${id}`);
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = {
  get(id: string): Promise<User> {
    return request(`/api/users/${id}`);
  },

  update(
    id: string,
    payload: { businessName?: string; phone?: string; address?: object; abn?: string },
  ): Promise<User> {
    return request(`/api/users/${id}`, { method: 'PUT', body: payload });
  },

  reviews(id: string): Promise<Review[]> {
    return request(`/api/users/${id}/reviews`);
  },

  addReview(
    id: string,
    payload: {
      orderId: string;
      reviewerId: string;
      rating: number;
      comment?: string;
      role: string;
    },
  ): Promise<Review> {
    return request(`/api/users/${id}/reviews`, { method: 'POST', body: payload });
  },
};
