/**
 * REALM Ag Marketplace — Client-side utility functions
 */

import type { MaterialType, UnitType, QualityLevel, OrderStatus, OfferStatus } from './types';

// ── Currency ─────────────────────────────────────────────────────────────────

/** Format a number as AUD currency string */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Calculate price per tonne equivalent */
export function calcPricePerTonne(
  pricePerUnit: number,
  weightKgPerUnit: number,
): number {
  if (!weightKgPerUnit) return 0;
  return (pricePerUnit / weightKgPerUnit) * 1000;
}

// ── Dates ─────────────────────────────────────────────────────────────────────

/** Format ISO date string to human-readable Australian date */
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Format ISO date string to date + time */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Relative time (e.g. "3 days ago") */
export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// ── Labels ────────────────────────────────────────────────────────────────────

const MATERIAL_LABELS: Record<MaterialType, string> = {
  hay: 'Hay',
  straw: 'Straw',
  silage: 'Silage',
  grain: 'Grain',
  seed: 'Seed',
  pellets: 'Pellets',
  fertiliser: 'Fertiliser',
  supplement: 'Supplement',
  drums: 'Drums',
  bulk_liquid: 'Bulk Liquid',
  other: 'Other',
};

export function materialLabel(type: MaterialType): string {
  return MATERIAL_LABELS[type] ?? type;
}

const UNIT_LABELS: Record<UnitType, string> = {
  bale_small: 'Small Bale',
  bale_large: 'Large Bale',
  bale_round: 'Round Bale',
  bag: 'Bag',
  drum: 'Drum',
  tonne: 'Tonne',
  kg: 'kg',
  load: 'Load',
  pallet: 'Pallet',
  cubic_metre: 'm³',
  litre: 'Litre',
  custom: 'Custom',
};

export function unitLabel(type: UnitType, custom?: string): string {
  if (type === 'custom' && custom) return custom;
  return UNIT_LABELS[type] ?? type;
}

const QUALITY_LABELS: Record<QualityLevel, string> = {
  basic: 'Basic',
  verified: 'Verified',
  performance: 'Performance',
};

export function qualityLabel(level: QualityLevel): string {
  return QUALITY_LABELS[level] ?? level;
}

const QUALITY_COLOURS: Record<QualityLevel, string> = {
  basic: 'bg-gray-100 text-gray-700',
  verified: 'bg-blue-100 text-blue-700',
  performance: 'bg-brand-100 text-brand-700',
};

export function qualityColour(level: QualityLevel): string {
  return QUALITY_COLOURS[level] ?? 'bg-gray-100 text-gray-700';
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  refunded: 'Refunded',
  completed: 'Completed',
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

const ORDER_STATUS_COLOURS: Record<OrderStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-brand-100 text-brand-800',
  disputed: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
};

export function orderStatusColour(status: OrderStatus): string {
  return ORDER_STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-800';
}

const OFFER_STATUS_COLOURS: Record<OfferStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  expired: 'bg-orange-100 text-orange-800',
};

export function offerStatusColour(status: OfferStatus): string {
  return OFFER_STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-800';
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationErrors {
  [field: string]: string;
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validateRequired(value: string | number | undefined | null, label: string): string | null {
  if (value === undefined || value === null || value === '') return `${label} is required`;
  return null;
}

export function validatePositiveNumber(value: number | undefined | null, label: string): string | null {
  if (value === undefined || value === null || value === 0) return `${label} is required`;
  if (isNaN(value) || value <= 0) return `${label} must be a positive number`;
  return null;
}

export function validateABN(abn: string): string | null {
  if (!abn) return null; // optional
  const digits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return 'ABN must be 11 digits';
  return null;
}

// ── File uploads ──────────────────────────────────────────────────────────────

/** Convert a File to a base64 data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Upload a file to the API and return the stored path */
export async function uploadCertificate(
  feedTestId: string,
  file: File,
  token: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('certificate', file);
  formData.append('feedTestId', feedTestId);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/feedtests/certificate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }

  const data = await res.json();
  return data.certificateUrl as string;
}

/** Upload a weighbridge ticket photo */
export async function uploadWeighTicket(
  orderId: string,
  file: File,
  token: string,
  extra?: { vehicleRego?: string; grossWeight?: number; tareWeight?: number; netWeight?: number },
): Promise<WeighbridgeEventResponse> {
  const formData = new FormData();
  formData.append('ticket', file);
  formData.append('orderId', orderId);
  if (extra?.vehicleRego) formData.append('vehicleRego', extra.vehicleRego);
  if (extra?.grossWeight) formData.append('grossWeight', String(extra.grossWeight));
  if (extra?.tareWeight) formData.append('tareWeight', String(extra.tareWeight));
  if (extra?.netWeight) formData.append('netWeight', String(extra.netWeight));

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/weighbridge/ocr`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }

  return res.json();
}

interface WeighbridgeEventResponse {
  id: string;
  ticketImageUrl?: string;
  [key: string]: unknown;
}

// ── Misc ──────────────────────────────────────────────────────────────────────

/** Truncate a string to maxLen characters */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/** Generate star rating display string */
export function starRating(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
