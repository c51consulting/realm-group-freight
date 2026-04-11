import type { Metadata } from 'next';
import Link from 'next/link';
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Manage your agricultural marketplace orders.',
};

interface OrdersPageProps {
  searchParams?: {
    status?: string;
    page?: string;
  };
}

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  const { status } = searchParams ?? {};

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">
          Track your orders through the full escrow lifecycle.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        <Link
          href="/orders"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
            !status
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All
        </Link>
        {ORDER_STATUS_FLOW.map((s) => (
          <Link
            key={s}
            href={`/orders?status=${s}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              status === s
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Order flow explainer */}
      <div className="card p-4 mb-6 bg-brand-50 border-brand-200">
        <p className="text-sm text-brand-800 font-medium mb-2">Order Flow</p>
        <div className="flex flex-wrap items-center gap-1 text-xs text-brand-700">
          {ORDER_STATUS_FLOW.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span
                className={`px-2 py-0.5 rounded-full ${
                  status === s ? 'bg-brand-500 text-white' : 'bg-brand-100'
                }`}
              >
                {ORDER_STATUS_LABELS[s]}
              </span>
              {i < ORDER_STATUS_FLOW.length - 1 && <span className="text-brand-400">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Empty state — replace with real data fetch */}
      <div className="empty-state card py-20">
        <span className="text-5xl mb-4">📦</span>
        <p className="empty-state-title">No orders found</p>
        <p className="empty-state-description">
          Orders are created when an offer is accepted. Browse listings to get started.
        </p>
        <Link href="/listings" className="btn-primary mt-6">
          Browse Listings
        </Link>
      </div>

      {/*
        TODO: Replace with real data fetch.
        const { data: orders } = await getOrders(page, pageSize);
        orders.map(order => <OrderRow key={order.id} order={order} />)
      */}
    </div>
  );
}
