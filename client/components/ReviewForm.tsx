'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotification } from '@/lib/context/NotificationContext';
import { users as usersApi } from '@/lib/client';
import ErrorMessage from './ErrorMessage';

interface ReviewFormProps {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
  role: 'buyer' | 'seller' | 'carrier';
  onSuccess?: () => void;
}

/**
 * ReviewForm — post-order star rating and comment submission.
 */
export default function ReviewForm({ orderId, revieweeId, revieweeName, role, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) { setError('Please select a star rating'); return; }
    setError(null);
    setSubmitting(true);
    try {
      await usersApi.addReview(revieweeId, {
        orderId,
        reviewerId: user.id,
        rating,
        comment: comment || undefined,
        role,
      });
      notify(`Review submitted for ${revieweeName}`, 'success');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <h3 className="font-semibold text-gray-900">Review {revieweeName}</h3>
      <ErrorMessage message={error} />

      {/* Star rating */}
      <div>
        <p className="label">Rating *</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              className={`text-3xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded ${
                star <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="label">Comment</label>
        <textarea
          id="review-comment"
          rows={3}
          className="input resize-none"
          placeholder="Share your experience…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting || rating === 0} className="btn-primary">
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
