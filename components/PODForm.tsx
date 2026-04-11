'use client';

/**
 * PODForm — Proof of Delivery form.
 * Allows the carrier or seller to submit delivery evidence including
 * photos, GPS coordinates, and delivery notes.
 */

import React, { useRef, useState } from 'react';
import { validateFile, fileToDataUrl, IMAGE_TYPES, MAX_PHOTO_SIZE } from '@/lib/forms';
import { ordersApi, ApiError } from '@/lib/client';
import type { Order } from '@/lib/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PODFormValues {
  notes: string;
  receiverName: string;
  receiverSignature: string;
  deliveredAt: string;
  photos: File[];
}

interface FieldErrors {
  notes?: string;
  receiverName?: string;
  photos?: string;
  _form?: string;
}

export interface PODFormProps {
  order: Order;
  /** Called with the updated order on success. */
  onSuccess?: (order: Order) => void;
  onCancel?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Proof of Delivery submission form.
 * Collects delivery photos, receiver name, notes, and timestamp.
 * Uploads photos and updates the order status to 'delivered'.
 *
 * @example
 * <PODForm order={order} onSuccess={(o) => setOrder(o)} />
 */
export function PODForm({ order, onSuccess, onCancel }: PODFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<PODFormValues>({
    notes: '',
    receiverName: '',
    receiverSignature: '',
    deliveredAt: new Date().toISOString().slice(0, 16),
    photos: [],
  });
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof PODFormValues>(field: K, value: PODFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, _form: undefined }));
  };

  // ── Photo handling ──────────────────────────────────────────────────────────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      const err = validateFile(file, { accept: IMAGE_TYPES, maxSize: MAX_PHOTO_SIZE });
      if (err) {
        setErrors((prev) => ({ ...prev, photos: err }));
        return;
      }
      validFiles.push(file);
      newPreviews.push(await fileToDataUrl(file));
    }

    set('photos', [...values.photos, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, photos: undefined }));

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    set('photos', values.photos.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!values.receiverName.trim()) errs.receiverName = 'Receiver name is required.';
    if (values.photos.length === 0) errs.photos = 'At least one delivery photo is required.';
    return errs;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, photos would be uploaded to storage first.
      // Here we build the delivery evidence payload.
      const deliveryEvidence = {
        receiverName: values.receiverName,
        notes: values.notes,
        deliveredAt: values.deliveredAt,
        photoCount: values.photos.length,
        // photoUrls would be populated after upload
        submittedAt: new Date().toISOString(),
      };

      const updated = await ordersApi.updateStatus(order.id, 'delivered', { deliveryEvidence });
      setSuccess(true);
      onSuccess?.(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors((prev) => ({ ...prev, _form: err.message }));
      } else {
        setErrors((prev) => ({ ...prev, _form: 'Failed to submit proof of delivery. Please try again.' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ───────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="text-5xl">📦</span>
        <p className="text-lg font-semibold text-green-800">Delivery confirmed!</p>
        <p className="text-sm text-green-700">
          The buyer has been notified and can now confirm receipt to release payment.
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
        <h2 className="text-lg font-semibold text-gray-900">Proof of Delivery</h2>
        <p className="text-sm text-gray-500">
          Order #{order.orderNumber} · Submit delivery evidence to release payment.
        </p>
      </div>

      {/* Global error */}
      {errors._form && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      {/* Delivery photos */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Delivery photos <span className="text-red-500">*</span>
        </label>

        {/* Photo grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                <img src={src} alt={`Delivery photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={[
            'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm transition-colors',
            errors.photos
              ? 'border-red-300 bg-red-50 text-red-600'
              : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-green-400 hover:bg-green-50 hover:text-green-600',
          ].join(' ')}
        >
          <span className="text-2xl" aria-hidden>📷</span>
          <span>Tap to add photos</span>
          <span className="text-xs text-gray-400">JPEG, PNG, WEBP · Max 10 MB each</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          multiple
          onChange={handlePhotoChange}
          className="sr-only"
          aria-label="Upload delivery photos"
        />
        {errors.photos && (
          <p role="alert" className="text-xs text-red-600">{errors.photos}</p>
        )}
      </div>

      {/* Receiver name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pod-receiver" className="text-sm font-medium text-gray-700">
          Received by <span className="text-red-500">*</span>
        </label>
        <input
          id="pod-receiver"
          type="text"
          value={values.receiverName}
          onChange={(e) => set('receiverName', e.target.value)}
          placeholder="Full name of person who received delivery"
          aria-invalid={!!errors.receiverName}
          className={[
            'w-full rounded-lg border py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
            errors.receiverName ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          ].join(' ')}
        />
        {errors.receiverName && (
          <p role="alert" className="text-xs text-red-600">{errors.receiverName}</p>
        )}
      </div>

      {/* Delivery date/time */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pod-datetime" className="text-sm font-medium text-gray-700">
          Delivery date & time
        </label>
        <input
          id="pod-datetime"
          type="datetime-local"
          value={values.deliveredAt}
          max={new Date().toISOString().slice(0, 16)}
          onChange={(e) => set('deliveredAt', e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pod-notes" className="text-sm font-medium text-gray-700">
          Delivery notes
        </label>
        <textarea
          id="pod-notes"
          rows={3}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any notes about the delivery condition, quantity, or issues..."
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-right text-xs text-gray-400">{values.notes.length}/1000</p>
      </div>

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
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Proof of Delivery'}
        </button>
      </div>
    </form>
  );
}

export default PODForm;
