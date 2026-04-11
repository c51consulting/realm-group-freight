'use client';

import { useForm } from '@/lib/hooks/useForm';
import { useNotification } from '@/lib/context/NotificationContext';
import { formatDate, starRating, validateABN } from '@/lib/client-utils';
import type { User, Review } from '@/lib/types';
import type { ValidationErrors } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';

interface UserProfileProps {
  user: User;
  reviews: Review[];
  editable?: boolean;
  onUpdate?: (payload: { businessName?: string; phone?: string; abn?: string }) => Promise<void>;
}

interface ProfileFormValues {
  businessName: string;
  phone: string;
  abn: string;
}

/**
 * UserProfile — displays user info, ratings, and reviews.
 * When `editable` is true, shows an inline edit form.
 */
export default function UserProfile({ user, reviews, editable, onUpdate }: UserProfileProps) {
  const { notify } = useNotification();

  const { values, errors, submitting, handleChange, handleSubmit } = useForm<ProfileFormValues>({
    initialValues: {
      businessName: user.businessName ?? '',
      phone: user.phone ?? '',
      abn: user.abn ?? '',
    },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      const abnErr = validateABN(v.abn);
      if (abnErr) errs.abn = abnErr;
      return errs;
    },
    async onSubmit(v) {
      await onUpdate?.({ businessName: v.businessName, phone: v.phone, abn: v.abn });
      notify('Profile updated!', 'success');
    },
  });

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="card card-body">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700 flex-shrink-0">
            {user.businessName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 truncate">{user.businessName ?? user.email}</h2>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            {user.verified && (
              <span className="badge bg-green-100 text-green-700 mt-1">✓ Verified</span>
            )}
            {user.rating > 0 && (
              <p className="text-sm text-yellow-500 mt-1">
                {starRating(user.rating)}{' '}
                <span className="text-gray-500">({user.reviewCount} reviews)</span>
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
          {user.abn && (
            <div>
              <dt className="text-gray-500">ABN</dt>
              <dd className="font-medium">{user.abn}</dd>
            </div>
          )}
          {user.phone && (
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium">{user.phone}</dd>
            </div>
          )}
          {user.address?.state && (
            <div>
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">
                {[user.address.suburb, user.address.state].filter(Boolean).join(', ')}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Member since</dt>
            <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Edit form */}
      {editable && onUpdate && (
        <div className="card card-body">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <ErrorMessage message={errors._form} />

            <div>
              <label htmlFor="prof-business" className="label">Business / Trading Name</label>
              <input id="prof-business" name="businessName" type="text" className="input" value={values.businessName} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="prof-phone" className="label">Phone</label>
              <input id="prof-phone" name="phone" type="tel" className="input" value={values.phone} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="prof-abn" className="label">ABN</label>
              <input id="prof-abn" name="abn" type="text" className={`input ${errors.abn ? 'input-error' : ''}`} value={values.abn} onChange={handleChange} placeholder="12 345 678 901" />
              {errors.abn && <p className="field-error">{errors.abn}</p>}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card card-body">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">
                    {r.reviewer?.businessName ?? 'Anonymous'}
                  </p>
                  <span className="text-yellow-400 text-sm">{starRating(r.rating)}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
