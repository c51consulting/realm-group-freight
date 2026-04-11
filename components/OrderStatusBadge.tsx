'use client';

/**
 * OrderStatusBadge — visual status indicator for orders and offers.
 * Renders a colour-coded pill with an icon and label.
 */

import React from 'react';
import type { OrderStatus, OfferStatus } from '@/lib/client';

// ─── Config ───────────────────────────────────────────────────────────────────

type AnyStatus = OrderStatus | OfferStatus | string;

interface StatusConfig {
  label: string;
  icon: string;
  className: string;
  /** Accessible description for screen readers. */
  description: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Order statuses
  pending_payment: {
    label: 'Pending Payment',
    icon: '⏳',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Awaiting payment from buyer',
  },
  paid: {
    label: 'Paid',
    icon: '💳',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Payment received and held in escrow',
  },
  in_transit: {
    label: 'In Transit',
    icon: '🚛',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Goods are on their way',
  },
  delivered: {
    label: 'Delivered',
    icon: '📦',
    className: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Goods delivered, awaiting buyer confirmation',
  },
  confirmed: {
    label: 'Confirmed',
    icon: '✅',
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Buyer confirmed delivery',
  },
  disputed: {
    label: 'Disputed',
    icon: '⚠️',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'A dispute has been raised',
  },
  refunded: {
    label: 'Refunded',
    icon: '↩️',
    className: 'bg-red-100 text-red-800 border-red-200',
    description: 'Payment refunded to buyer',
  },
  completed: {
    label: 'Completed',
    icon: '🏆',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Order complete, payment released',
  },

  // Offer statuses
  pending: {
    label: 'Pending',
    icon: '🕐',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Offer awaiting seller response',
  },
  accepted: {
    label: 'Accepted',
    icon: '✅',
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Offer accepted by seller',
  },
  rejected: {
    label: 'Rejected',
    icon: '❌',
    className: 'bg-red-100 text-red-800 border-red-200',
    description: 'Offer rejected by seller',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: '↩️',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Offer withdrawn by buyer',
  },
  expired: {
    label: 'Expired',
    icon: '⌛',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    description: 'Offer has expired',
  },

  // Listing statuses
  active: {
    label: 'Active',
    icon: '🟢',
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Listing is active',
  },
  paused: {
    label: 'Paused',
    icon: '⏸️',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Listing is paused',
  },
  sold: {
    label: 'Sold',
    icon: '🎉',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Listing has been sold',
  },
  cancelled: {
    label: 'Cancelled',
    icon: '🚫',
    className: 'bg-red-100 text-red-700 border-red-200',
    description: 'Listing has been cancelled',
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: 'Unknown',
  icon: '❓',
  className: 'bg-gray-100 text-gray-600 border-gray-200',
  description: 'Unknown status',
};

// ─── Component ────────────────────────────────────────────────────────────────

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface OrderStatusBadgeProps {
  status: AnyStatus;
  size?: BadgeSize;
  /** Show the emoji icon alongside the label. */
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Renders a colour-coded status badge for orders, offers, or listings.
 *
 * @example
 * <OrderStatusBadge status="in_transit" size="md" />
 * <OrderStatusBadge status="accepted" showIcon={false} />
 */
export function OrderStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;

  return (
    <span
      role="status"
      aria-label={config.description}
      title={config.description}
      className={[
        'inline-flex items-center gap-1 rounded-full border font-medium',
        SIZE_CLASSES[size],
        config.className,
        className,
      ].join(' ')}
    >
      {showIcon && <span aria-hidden="true">{config.icon}</span>}
      {config.label}
    </span>
  );
}

// ─── Order Progress Stepper ───────────────────────────────────────────────────

const ORDER_STEPS: OrderStatus[] = [
  'pending_payment',
  'paid',
  'in_transit',
  'delivered',
  'confirmed',
  'completed',
];

export interface OrderProgressProps {
  status: OrderStatus;
  className?: string;
}

/**
 * Horizontal progress stepper showing the order lifecycle.
 * Highlights the current step and marks completed steps.
 *
 * @example
 * <OrderProgress status="in_transit" />
 */
export function OrderProgress({ status, className = '' }: OrderProgressProps) {
  const currentIndex = ORDER_STEPS.indexOf(status);
  const isTerminal = status === 'disputed' || status === 'refunded';

  if (isTerminal) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <OrderStatusBadge status={status} size="md" />
        <span className="text-sm text-gray-500">
          {status === 'disputed' ? 'This order is under review.' : 'This order has been refunded.'}
        </span>
      </div>
    );
  }

  return (
    <ol className={`flex items-center gap-0 ${className}`} aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => {
        const config = STATUS_CONFIG[step];
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm transition-colors',
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : isCurrent
                    ? 'border-green-500 bg-white text-green-600'
                    : 'border-gray-200 bg-white text-gray-400',
                ].join(' ')}
              >
                {isCompleted ? '✓' : config.icon}
              </div>
              <span
                className={[
                  'hidden text-xs sm:block',
                  isCurrent ? 'font-semibold text-green-700' : isCompleted ? 'text-green-600' : 'text-gray-400',
                ].join(' ')}
              >
                {config.label}
              </span>
            </div>
            {index < ORDER_STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 flex-1 transition-colors',
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default OrderStatusBadge;
