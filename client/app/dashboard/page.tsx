'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useOrders } from '@/lib/hooks/useOrders';
import { useListings } from '@/lib/hooks/useListings';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, orderStatusLabel, orderStatusColour, timeAgo } from '@/lib/client-utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading } = useOrders(user?.id);
  const { listings, loading: listingsLoading } = useListings(
    user ? { page: 1, limit: 5 } : {},
  );

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);
  const activeListings = listings.filter((l) => l.status === 'active');

  return (
    <div className="container-page section">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.businessName ?? user.email.split('@')[0]}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Listings" value={activeListings.length} href="/listings" />
        <StatCard label="Total Orders" value={orders.length} href="/orders" />
        <StatCard
          label="Completed"
          value={orders.filter((o) => o.status === 'completed').length}
          href="/orders"
        />
        <StatCard
          label="In Progress"
          value={orders.filter((o) => ['paid', 'in_transit', 'delivered'].includes(o.status)).length}
          href="/orders"
        />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <QuickAction
          href="/listings/create"
          icon="📋"
          title="Post a Listing"
          description="Sell hay, grain or other materials"
        />
        <QuickAction
          href="/listings"
          icon="🔍"
          title="Browse Listings"
          description="Find what you need"
        />
        <QuickAction
          href="/freight/create"
          icon="🚛"
          title="Post Freight Job"
          description="Find a carrier for your load"
        />
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {ordersLoading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No orders yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{timeAgo(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${orderStatusColour(order.status)}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                    {order.totalAmount && (
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* My listings */}
      {!listingsLoading && activeListings.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Active Listings</h2>
            <Link href="/listings" className="text-sm text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {activeListings.slice(0, 5).map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                    <p className="text-xs text-gray-500">{timeAgo(listing.createdAt)}</p>
                  </div>
                  {listing.pricePerUnit && (
                    <span className="text-sm font-semibold text-brand-700">
                      {formatCurrency(listing.pricePerUnit)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card card-body hover:border-brand-400 transition-colors">
      <p className="text-2xl font-bold text-brand-700">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="card card-body flex items-start gap-3 hover:border-brand-400 hover:shadow-md transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
