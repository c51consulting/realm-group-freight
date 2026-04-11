'use client';

/**
 * ReviewForm — post-order review submission.
 * Allows buyers, sellers, and carriers to rate each other after order completion.
 */

import React, { useState } from 'react';
import { usersApi, ApiError } from '@/lib/client';
import type { Review } from '@/lib/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewRole = 'buyer' | 'seller' | 'carrier';

interface ReviewFormValues {
  rating: number;
  comment: string;
}

interface FieldErrors {
  rating?: string;
  comment?: string;
  _form?: string;
}

export interface ReviewFormProps {
  orderId: string;
  /** ID of the user being reviewed. */
  revieweeId: string;
  /** Display name of the user being reviewed. */
  revieweeName: string;
  /** Role of the person being reviewed. */
  role: ReviewRole;
  /** Called with the created review on success. */
  onSuccess?: (review: Review) => void;
  onCancel?: () => void;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  error?: string;
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function StarRating({ value, onChange, error }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label="Rating"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star !== 1 ? 's' : ''} — ${STAR_LABELS[star]}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
          >
            <span
              aria-hidden
              className={[
                'transition-colors',
                (hovered || value) >= star ? 'text-yellow-400' : 'text-gray-200',
              ].join(' ')}
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {(hovered > 0 || value > 0) && (
        <p className="text-sm font-medium text-gray-600">
          {STAR_LABELS[hovered || value]}
        </p>
      )}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<ReviewRole, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  carrier: 'Carrier',
};

/**
 * Post-order review form with star rating and optional comment.
 * Validates that a rating is selected before submission.
 *
 * @example
 * <ReviewForm
 *   orderId={order.id}
 *   revieweeId={order.sellerId}
 *   revieweeName="Smith Farms"
 *   role="seller"
 *   onSuccess={(r) => console.log(r)}
 * />
 */
export function ReviewForm({ orderId, revieweeId, revieweeName, role, onSuccess, onCancel }: ReviewFormProps) {
  const [values, setValues] = useState<ReviewFormValues>({ rating: 0, comment: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setRating = (rating: number) => {
    setValues((prev) => ({ ...prev, rating }));
    setErrors((prev) => ({ ...prev, rating: undefined }));
  };

  const setComment = (comment: string) => {
    setValues((prev) => ({ ...prev, comment }));
    setErrors((prev) => ({ ...prev, comment: undefined }));
  };

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!values.rating || values.rating < 1) errs.rating = 'Please select a rating.';
    if (values.comment && values.comment.length > 1000) errs.comment = 'Comment must be 1000 characters or fewer.';
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await usersApi.review(revieweeId, {
        orderId,
        rating: values.rating,
        comment: values.comment || undefined,
        role,
      });
      setSuccess(true);
      onSuccess?.(review);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors((prev) => ({ ...prev, _form: err.message }));
      } else {
        setErrors((prev) => ({ ...prev, _form: 'Failed to submit review. Please try again.' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="text-5xl">⭐</span>
        <p className="text-lg font-semibold text-green-800">Review submitted!</p>
        <p className="text-sm text-green-700">
          Thank you for your feedback. It helps build trust in the REALM marketplace.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Leave a Review</h2>
        <p className="text-sm text-gray-500">
          Rate your experience with{' '}
          <span className="font-medium text-gray-700">{revieweeName}</span>{' '}
          as {ROLE_LABELS[role].toLowerCase()}.
        </p>
      </div>

      {/* Global error */}
      {errors._form && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      {/* Star rating */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating value={values.rating} onChange={setRating} error={errors.rating} />
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1">
        <label htmlFor="review-comment" className="text-sm font-medium text-gray-700">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={values.comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Describe your experience with ${revieweeName}…`}
          maxLength={1000}
          aria-invalid={!!errors.comment}
          className={[
            'w-full resize-none rounded-lg border py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
            errors.comment ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          ].join(' ')}
        />
        <div className="flex justify-between">
          {errors.comment ? (
            <p role="alert" className="text-xs text-red-600">{errors.comment}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-400">{values.comment.length}/1000</p>
        </div>
      </div>

      {/* Prompt chips */}
      {values.rating > 0 && values.comment === '' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {getPrompts(role, values.rating).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setComment(prompt)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || values.rating === 0}
          className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

// ─── Prompt Helpers ───────────────────────────────────────────────────────────

function getPrompts(role: ReviewRole, rating: number): string[] {
  if (rating >= 4) {
    const positive: Record<ReviewRole, string[]> = {
      seller: [
        'Product was exactly as described.',
        'Great communication throughout.',
        'Fast loading and easy pickup.',
        'Would buy from again.',
      ],
      buyer: [
        'Prompt payment, no issues.',
        'Clear communication.',
        'Would sell to again.',
      ],
      carrier: [
        'Delivered on time and in good condition.',
        'Professional and reliable.',
        'Great communication on ETA.',
      ],
    };
    return positive[role];
  }
  const negative: Record<ReviewRole, string[]> = {
    seller: [
      'Product quality didn\'t match description.',
      'Communication was slow.',
      'Loading took longer than expected.',
    ],
    buyer: [
      'Payment was delayed.',
      'Communication could be improved.',
    ],
    carrier: [
      'Delivery was late.',
      'Communication was poor.',
      'Product arrived damaged.',
    ],
  };
  return negative[role];
}

export default ReviewForm;
