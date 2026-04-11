'use client';

import { useState } from 'react';
import { useNotification } from '@/lib/context/NotificationContext';
import { useAuth } from '@/lib/context/AuthContext';
import { orders as ordersApi } from '@/lib/client';
import { fileToDataUrl } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';

interface PODFormProps {
  orderId: string;
  onSuccess?: () => void;
}

/**
 * PODForm — Proof of Delivery submission with optional photo upload.
 * Updates the order status to 'delivered' with delivery evidence.
 */
export default function PODForm({ orderId, onSuccess }: PODFormProps) {
  const { token } = useAuth();
  const { notify } = useNotification();
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const preview = await fileToDataUrl(file);
    setPhotoPreview(preview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const evidence: Record<string, unknown> = {
        notes,
        submittedAt: new Date().toISOString(),
      };

      if (photoFile && token) {
        // Upload photo via OCR endpoint (reuses the file upload path)
        const formData = new FormData();
        formData.append('ticket', photoFile);
        formData.append('orderId', orderId);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/api/weighbridge/ocr`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
        );
        if (res.ok) {
          const data = await res.json();
          evidence.photoUrl = data.ticketImageUrl;
        }
      }

      await ordersApi.updateStatus(orderId, { status: 'delivered', deliveryEvidence: evidence });
      notify('Proof of delivery submitted!', 'success');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={error} />

      <div>
        <label htmlFor="pod-notes" className="label">Delivery Notes</label>
        <textarea
          id="pod-notes"
          rows={3}
          className="input resize-none"
          placeholder="Describe the delivery — condition of goods, any issues, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="pod-photo" className="label">Delivery Photo</label>
        <input
          id="pod-photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          onChange={handlePhoto}
        />
        {photoPreview && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Delivery photo preview" className="max-h-48 rounded-lg border border-gray-200 object-cover" />
          </div>
        )}
      </div>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Submitting…' : 'Submit Proof of Delivery'}
      </button>
    </form>
  );
}
