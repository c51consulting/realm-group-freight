'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useOrders } from '@/lib/hooks/useOrders';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatDate, orderStatusLabel, orderStatusColour } from '@/lib/client-utils';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { orders, loading, error } = useOrders(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="container-page section">
      <PageHeader title="My Orders" subtitle="All orders you are involved in as buyer, seller or carrier." />
      <ErrorMessage message={error} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">
            <Link href="/listings" className="text-brand-600 hover:underline">Browse listings</Link> to get started.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {order.Listing?.title ?? 'Order'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${orderStatusColour(order.status)}`}>
                  {orderStatusLabel(order.status)}
                </span>
                {order.totalAmount && (
                  <span className="text-sm font-bold text-gray-700">
                    {formatCurrency(order.totalAmount)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
