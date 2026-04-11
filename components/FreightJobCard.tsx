'use client';

/**
 * FreightJobCard — displays a freight job with route, pricing,
 * vehicle requirements, and a CTA for carriers.
 */

import React from 'react';
import type { Order, Listing } from '@/lib/client';
import { OrderStatusBadge } from './OrderStatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FreightJob {
  id: string;
  orderId?: string;
  order?: Order;
  listing?: Listing;
  /** Pickup location label (e.g. "Dubbo, NSW"). */
  pickupLocation: string;
  /** Delivery location label (e.g. "Wagga Wagga, NSW"). */
  deliveryLocation: string;
  /** Approximate distance in km. */
  distanceKm?: number;
  /** Freight rate offered ($ total). */
  freightAmount: number;
  /** Payload in tonnes. */
  payloadTonnes?: number;
  /** Material being transported. */
  materialType?: string;
  /** Required vehicle type (e.g. "B-double", "Semi"). */
  vehicleType?: string;
  /** Pickup date/time. */
  pickupDate?: string;
  /** Delivery deadline. */
  deliveryDate?: string;
  status: 'available' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';
  /** Carrier who accepted the job. */
  carrierId?: string;
}

export interface FreightJobCardProps {
  job: FreightJob;
  /** Called when the carrier clicks "Accept Job". */
  onAccept?: (job: FreightJob) => void;
  /** Called when the card is clicked for detail view. */
  onClick?: (job: FreightJob) => void;
  /** Whether the current user is the assigned carrier. */
  isCarrier?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MATERIAL_LABELS: Record<string, string> = {
  hay: 'Hay', straw: 'Straw', silage: 'Silage', grain: 'Grain',
  seed: 'Seed', pellets: 'Pellets', fertiliser: 'Fertiliser',
  supplement: 'Supplement', drums: 'Drums', bulk_liquid: 'Bulk Liquid', other: 'Other',
};

const STATUS_CONFIG: Record<FreightJob['status'], { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-green-100 text-green-700' },
  assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-700' },
  in_transit: { label: 'In Transit', className: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Card displaying a freight job with route, payload, pricing, and actions.
 *
 * @example
 * <FreightJobCard job={job} onAccept={(j) => acceptJob(j.id)} />
 */
export function FreightJobCard({ job, onAccept, onClick, isCarrier = false, className = '' }: FreightJobCardProps) {
  const statusConfig = STATUS_CONFIG[job.status];
  const materialLabel = job.materialType ? (MATERIAL_LABELS[job.materialType] ?? job.materialType) : null;
  const ratePerKm = job.distanceKm && job.distanceKm > 0
    ? (job.freightAmount / job.distanceKm).toFixed(2)
    : null;

  const handleClick = () => onClick?.(job);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  };

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={`Freight job: ${job.pickupLocation} to ${job.deliveryLocation}`}
      className={[
        'flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow',
        onClick ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500' : '',
        className,
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Freight Job</span>
          {job.orderId && (
            <span className="text-xs text-gray-400">Order #{job.orderId.slice(0, 8).toUpperCase()}</span>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 w-3 rounded-full border-2 border-green-500 bg-white" />
          <div className="h-8 w-0.5 bg-gray-200" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-gray-400">Pickup</p>
            <p className="text-sm font-semibold text-gray-900">{job.pickupLocation}</p>
            <p className="text-xs text-gray-500">{formatDate(job.pickupDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Delivery</p>
            <p className="text-sm font-semibold text-gray-900">{job.deliveryLocation}</p>
            <p className="text-xs text-gray-500">{formatDate(job.deliveryDate)}</p>
          </div>
        </div>
        {job.distanceKm && (
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-gray-900">{job.distanceKm.toLocaleString()} km</p>
            {ratePerKm && <p className="text-xs text-gray-400">${ratePerKm}/km</p>}
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-400">Freight Rate</p>
          <p className="font-semibold text-gray-900">${Number(job.freightAmount).toFixed(2)}</p>
        </div>
        {job.payloadTonnes && (
          <div>
            <p className="text-xs text-gray-400">Payload</p>
            <p className="font-semibold text-gray-900">{job.payloadTonnes}t</p>
          </div>
        )}
        {materialLabel && (
          <div>
            <p className="text-xs text-gray-400">Material</p>
            <p className="font-semibold text-gray-900">{materialLabel}</p>
          </div>
        )}
        {job.vehicleType && (
          <div>
            <p className="text-xs text-gray-400">Vehicle</p>
            <p className="font-semibold text-gray-900">{job.vehicleType}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {job.status === 'available' && !isCarrier && onAccept && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAccept(job);
          }}
          className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Accept Job — ${Number(job.freightAmount).toFixed(2)}
        </button>
      )}

      {isCarrier && job.status === 'assigned' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          You are assigned to this job. Update status when goods are collected.
        </div>
      )}
    </article>
  );
}

export default FreightJobCard;
