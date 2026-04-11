import type { Order, OrderStatus } from '@/lib/types';
import { formatDateTime } from '@/lib/client-utils';

const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'pending_payment', label: 'Payment Pending', description: 'Awaiting payment from buyer' },
  { status: 'paid', label: 'Paid', description: 'Payment held in escrow' },
  { status: 'in_transit', label: 'In Transit', description: 'Goods on the way' },
  { status: 'delivered', label: 'Delivered', description: 'Delivery confirmed by carrier' },
  { status: 'confirmed', label: 'Confirmed', description: 'Buyer confirmed receipt' },
  { status: 'completed', label: 'Completed', description: 'Payment released to seller' },
];

const STATUS_ORDER: OrderStatus[] = [
  'pending_payment', 'paid', 'in_transit', 'delivered', 'confirmed', 'completed',
];

function getStepIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

interface OrderTimelineProps {
  order: Order;
}

/**
 * OrderTimeline — visual step-by-step order status flow.
 * Highlights the current step and marks completed steps.
 */
export default function OrderTimeline({ order }: OrderTimelineProps) {
  const currentIdx = getStepIndex(order.status);
  const isDisputed = order.status === 'disputed';
  const isRefunded = order.status === 'refunded';

  if (isDisputed || isRefunded) {
    return (
      <div className={`rounded-lg px-4 py-3 text-sm font-medium ${isDisputed ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
        {isDisputed ? '⚠️ This order is under dispute.' : '↩️ This order has been refunded.'}
        {order.disputeReason && (
          <p className="mt-1 font-normal text-xs">{order.disputeReason}</p>
        )}
      </div>
    );
  }

  return (
    <ol aria-label="Order progress" className="relative">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const future = idx > currentIdx;

        return (
          <li key={step.status} className="flex gap-4 pb-6 last:pb-0">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                    ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                    : 'bg-gray-100 text-gray-400'
                }`}
                aria-hidden="true"
              >
                {done ? '✓' : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 mt-1 ${done ? 'bg-brand-400' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className="pt-1 pb-4">
              <p className={`text-sm font-semibold ${active ? 'text-brand-700' : future ? 'text-gray-400' : 'text-gray-700'}`}>
                {step.label}
                {active && <span className="ml-2 badge bg-brand-100 text-brand-700">Current</span>}
              </p>
              <p className={`text-xs mt-0.5 ${future ? 'text-gray-300' : 'text-gray-500'}`}>
                {step.description}
              </p>
              {/* Show timestamp for key events */}
              {step.status === 'confirmed' && order.confirmedAt && (
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(order.confirmedAt)}</p>
              )}
              {step.status === 'completed' && order.paymentReleasedAt && (
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(order.paymentReleasedAt)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
