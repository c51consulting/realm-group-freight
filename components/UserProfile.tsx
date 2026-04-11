'use client';

/**
 * UserProfile — displays a user's public profile with ratings,
 * active listings, and recent reviews.
 */

import React, { useEffect, useState } from 'react';
import { usersApi, ApiError } from '@/lib/client';
import type { User, Listing, Review } from '@/lib/client';
import { ListingCard } from './ListingCard';
import { OrderStatusBadge } from './OrderStatusBadge';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StarDisplayProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
}

function StarDisplay({ rating, reviewCount, size = 'md' }: StarDisplayProps) {
  const filled = Math.round(rating);
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex ${sizeClass}`} aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            aria-hidden
            className={star <= filled ? 'text-yellow-400' : 'text-gray-200'}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        {reviewCount > 0 && (
          <span className="text-gray-400"> ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
        )}
      </span>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const ROLE_LABELS: Record<string, string> = {
    buyer: 'as Buyer', seller: 'as Seller', carrier: 'as Carrier',
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
            {(review.reviewer?.businessName ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {review.reviewer?.businessName ?? 'Anonymous'}
            </p>
            <p className="text-xs text-gray-400">
              {ROLE_LABELS[review.role] ?? review.role} ·{' '}
              {new Date(review.createdAt).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} aria-hidden className={star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}>
              ★
            </span>
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface UserProfileProps {
  userId: string;
  /** Called when a listing card is clicked. */
  onListingClick?: (listing: Listing) => void;
  className?: string;
}

/**
 * Displays a user's public profile including business info, ratings,
 * active listings, and recent reviews.
 *
 * @example
 * <UserProfile userId={sellerId} onListingClick={(l) => router.push(`/listings/${l.id}`)} />
 */
export function UserProfile({ userId, onListingClick, className = '' }: UserProfileProps) {
  const [user, setUser] = useState<(User & { listings?: Listing[] }) | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [userData, reviewData] = await Promise.all([
          usersApi.get(userId),
          usersApi.reviews(userId),
        ]);
        if (!cancelled) {
          setUser(userData);
          setReviews(reviewData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`flex flex-col gap-6 ${className}`} aria-busy="true" aria-label="Loading profile">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error || !user) {
    return (
      <div className={`flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center ${className}`}>
        <span className="text-3xl" aria-hidden>⚠️</span>
        <p className="text-sm font-medium text-red-700">{error ?? 'Profile not found.'}</p>
      </div>
    );
  }

  const listings = user.listings ?? [];
  const ROLE_LABELS: Record<string, string> = {
    buyer: 'Buyer', seller: 'Seller', carrier: 'Carrier', admin: 'Admin',
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Profile header */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-2xl font-bold text-white shadow">
          {(user.businessName ?? user.email)[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              {user.businessName ?? 'Unknown Business'}
            </h1>
            {user.verified && (
              <span
                title="Verified account"
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                ✓ Verified
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          <StarDisplay rating={user.rating} reviewCount={user.reviewCount} />

          {/* Contact details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {user.abn && (
              <span>ABN: {user.abn}</span>
            )}
            {user.phone && (
              <a href={`tel:${user.phone}`} className="hover:text-green-600">
                📞 {user.phone}
              </a>
            )}
            {user.address && typeof user.address === 'object' && (
              <span>
                📍 {[user.address.suburb, user.address.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>

          {/* Member since */}
          <p className="text-xs text-gray-400">
            Member since {new Date(user.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 sm:flex-col sm:items-end sm:gap-2">
          <div className="text-center sm:text-right">
            <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            <p className="text-xs text-gray-400">Active listing{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-2xl font-bold text-gray-900">{user.reviewCount}</p>
            <p className="text-xs text-gray-400">Review{user.reviewCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['listings', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
            role="tab"
            className={[
              'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab}
            {tab === 'listings' && listings.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {listings.length}
              </span>
            )}
            {tab === 'reviews' && reviews.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {reviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'listings' && (
        <div role="tabpanel" aria-label="Active listings">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
              <span className="text-3xl" aria-hidden>🌾</span>
              <p className="text-sm font-medium text-gray-600">No active listings</p>
              <p className="text-xs text-gray-400">This seller has no active listings at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={onListingClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div role="tabpanel" aria-label="Reviews" className="flex flex-col gap-3">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
              <span className="text-3xl" aria-hidden>⭐</span>
              <p className="text-sm font-medium text-gray-600">No reviews yet</p>
              <p className="text-xs text-gray-400">Reviews appear after completed orders.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
