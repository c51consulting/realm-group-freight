'use client';

/**
 * WeighEventList — displays a list of weighbridge events for an order,
 * with source badges, weight details, and verification status.
 */

import React, { useState } from 'react';
import type { WeighEvent } from '@/lib/client';

// ─── Config ───────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<WeighEvent['source'], { label: string; icon: string; className: string }> = {
  api: { label: 'API', icon: '🔌', className: 'bg-blue-100 text-blue-700' },
  csv_import: { label: 'CSV Import', icon: '📄', className: 'bg-purple-100 text-purple-700' },
  email_parse: { label: 'Email', icon: '📧', className: 'bg-yellow-100 text-yellow-700' },
  ocr_upload: { label: 'OCR Upload', icon: '📷', className: 'bg-orange-100 text-orange-700' },
  manual: { label: 'Manual', icon: '✏️', className: 'bg-gray-100 text-gray-700' },
};

const SETTLEMENT_CONFIG: Record<WeighEvent['settlementStatus'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  matched: { label: 'Matched', className: 'bg-green-100 text-green-700' },
  disputed: { label: 'Disputed', className: 'bg-red-100 text-red-700' },
  settled: { label: 'Settled', className: 'bg-emerald-100 text-emerald-700' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWeight(kg?: number, unit: 'kg' | 'tonne' = 'kg'): string {
  if (kg === undefined || kg === null) return '—';
  if (unit === 'tonne') return `${Number(kg).toFixed(3)} t`;
  return `${Number(kg).toLocaleString()} kg`;
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface WeighEventRowProps {
  event: WeighEvent;
  onVerify?: (eventId: string) => void;
  isVerifying?: boolean;
}

function WeighEventRow({ event, onVerify, isVerifying }: WeighEventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const source = SOURCE_CONFIG[event.source];
  const settlement = SETTLEMENT_CONFIG[event.settlementStatus];

  return (
    <li className="flex flex-col gap-0">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
      >
        {/* Source badge */}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${source.className}`}>
          {source.icon} {source.label}
        </span>

        {/* Net weight (primary) */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {formatWeight(event.netWeight, event.weightUnit)} net
          </p>
          <p className="text-xs text-gray-500 truncate">
            {event.siteName ?? event.siteId ?? 'Unknown site'} · {formatDateTime(event.weighedAt)}
          </p>
        </div>

        {/* Verification */}
        <div className="flex shrink-0 items-center gap-2">
          {event.verified ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              ✓ Verified
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              Unverified
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${settlement.className}`}>
            {settlement.label}
          </span>
          <span className="text-gray-400 text-xs" aria-hidden>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-gray-400">Gross Weight</dt>
              <dd className="font-medium text-gray-900">{formatWeight(event.grossWeight, event.weightUnit)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Tare Weight</dt>
              <dd className="font-medium text-gray-900">{formatWeight(event.tareWeight, event.weightUnit)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Net Weight</dt>
              <dd className="font-semibold text-green-700">{formatWeight(event.netWeight, event.weightUnit)}</dd>
            </div>
            {event.vehicleRego && (
              <div>
                <dt className="text-xs text-gray-400">Vehicle Rego</dt>
                <dd className="font-medium text-gray-900">{event.vehicleRego}</dd>
              </div>
            )}
            {event.operatorName && (
              <div>
                <dt className="text-xs text-gray-400">Operator</dt>
                <dd className="font-medium text-gray-900">{event.operatorName}</dd>
              </div>
            )}
            {event.sourceTicketId && (
              <div>
                <dt className="text-xs text-gray-400">Ticket ID</dt>
                <dd className="font-medium text-gray-900">{event.sourceTicketId}</dd>
              </div>
            )}
            {event.sourceSystem && (
              <div>
                <dt className="text-xs text-gray-400">Source System</dt>
                <dd className="font-medium text-gray-900">{event.sourceSystem}</dd>
              </div>
            )}
            {event.tradeApproved && (
              <div>
                <dt className="text-xs text-gray-400">Trade Approved</dt>
                <dd className="font-medium text-green-700">Yes</dd>
              </div>
            )}
          </dl>

          {/* Ticket image */}
          {event.ticketImageUrl && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-gray-400">Ticket Image</p>
              <a
                href={event.ticketImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                📷 View ticket image
              </a>
            </div>
          )}

          {/* Verify action */}
          {!event.verified && onVerify && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onVerify(event.id)}
                disabled={isVerifying}
                className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isVerifying ? 'Verifying…' : 'Verify Event'}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface WeighEventListProps {
  events: WeighEvent[];
  /** Called when an admin/seller verifies an event. */
  onVerify?: (eventId: string) => Promise<void>;
  /** Show a loading skeleton. */
  loading?: boolean;
  className?: string;
}

/**
 * Displays all weighbridge events for an order in an expandable list.
 * Shows gross/tare/net weights, source, verification status, and settlement state.
 *
 * @example
 * <WeighEventList events={order.weighEvents} onVerify={handleVerify} />
 */
export function WeighEventList({ events, onVerify, loading = false, className = '' }: WeighEventListProps) {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerify = async (eventId: string) => {
    if (!onVerify) return;
    setVerifyingId(eventId);
    try {
      await onVerify(eventId);
    } finally {
      setVerifyingId(null);
    }
  };

  // Summary totals
  const totalNet = events.reduce((sum, e) => sum + (e.netWeight ?? 0), 0);
  const verifiedNet = events
    .filter((e) => e.verified)
    .reduce((sum, e) => sum + (e.netWeight ?? 0), 0);

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white ${className}`} aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0">
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center ${className}`}>
        <span className="text-3xl" aria-hidden>⚖️</span>
        <p className="text-sm font-medium text-gray-600">No weigh events recorded</p>
        <p className="text-xs text-gray-400">Weighbridge data will appear here once submitted.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0 rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Summary header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {events.length} weigh event{events.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500">
            Total net: {(totalNet / 1000).toFixed(3)} t
            {verifiedNet > 0 && ` · Verified: ${(verifiedNet / 1000).toFixed(3)} t`}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {events.filter((e) => e.verified).length}/{events.length} verified
        </span>
      </div>

      {/* Event list */}
      <ul className="divide-y divide-gray-100" aria-label="Weigh events">
        {events.map((event) => (
          <WeighEventRow
            key={event.id}
            event={event}
            onVerify={onVerify ? handleVerify : undefined}
            isVerifying={verifyingId === event.id}
          />
        ))}
      </ul>
    </div>
  );
}

export default WeighEventList;
