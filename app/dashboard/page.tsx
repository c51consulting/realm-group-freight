import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NAV_LINKS, ORDER_STATUS_LABELS, MATERIAL_TYPE_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const QUICK_ACTIONS = [
  { label: 'Post a Listing', href: '/listings/create', icon: '📋' },
  { label: 'Post Freight Job', href: '/freight/create', icon: '🚛' },
  { label: 'Post Livestock', href: '/livestock/create', icon: '🐂' },
  { label: 'Browse Listings', href: '/listings', icon: '🌾' },
  { label: 'Browse Livestock', href: '/livestock', icon: '🦬' },
  { label: 'View Orders', href: '/orders', icon: '📦' },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/dashboard');

  // Fetch counts and recent data in parallel
  const [
    { count: activeListings },
    { count: openOffers },
    { count: activeOrders },
    { data: recentListings },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .not('status', 'in', '(completed,refunded)'),
    supabase.from('listings')
      .select('id, title, material_type, price_per_unit, unit_type, status, created_at, pickup_address')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('orders')
      .select('id, order_number, status, total_amount, created_at, listing:listings!listing_id(id, title)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const statCards = [
    { label: 'Active Listings', value: activeListings ?? '—', href: '/listings', color: 'brand' },
    { label: 'Open Offers',     value: openOffers ?? '—',    href: '/offers',  color: 'blue' },
    { label: 'Active Orders',   value: activeOrders ?? '—',  href: '/orders',  color: 'earth' },
    { label: 'Freight Jobs',    value: '—',                  href: '/freight', color: 'gray' },
    { label: 'Livestock',       value: '—',                  href: '/livestock', color: 'green' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your marketplace activity.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto flex-wrap">
          <Link href="/listings/create" className="btn-primary">+ Post Listing</Link>
          <Link href="/freight/create" className="btn-primary bg-gray-700 hover:bg-gray-800">+ Post Freight</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card p-5 hover:shadow-md transition-shadow group"
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md hover:border-brand-300 transition-all group"
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">My Listings</h2>
            <Link href="/listings" className="text-sm text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {recentListings && recentListings.length > 0 ? (
            <div className="space-y-3">
              {recentListings.map((listing: any) => {
                const matLabel = MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type;
                const suburb = listing.pickup_address?.suburb || '';
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                      <p className="text-xs text-gray-500">{matLabel}{suburb ? ` · ${suburb}` : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.price_per_unit
                          ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(listing.price_per_unit)
                          : 'POA'}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {listing.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
              <Link href="/listings/create" className="block text-center text-xs text-brand-600 hover:underline pt-1">
                + Post another listing
              </Link>
            </div>
          ) : (
            <div className="empty-state py-8">
              <p className="empty-state-title text-base">No listings yet</p>
              <p className="empty-state-description text-xs">Your active listings will appear here.</p>
              <Link href="/listings/create" className="btn-primary mt-4 text-xs px-3 py-1.5">
                Post your first listing
              </Link>
            </div>
          )}
        </section>

        {/* Recent orders */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => {
                const listing = order.listing as any;
                return (
                  <Link key={order.id} href={`/orders/${order.id}`} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing?.title || 'Order'}</p>
                      <p className="text-xs text-gray-500">{order.order_number}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(order.total_amount || 0)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state py-8">
              <p className="empty-state-title text-base">No orders yet</p>
              <p className="empty-state-description text-xs">Your orders will appear here once an offer is accepted.</p>
            </div>
          )}
        </section>
      </div>

      {/* Module navigation */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="card px-4 py-3 text-center text-sm font-medium text-gray-700 hover:text-brand-700 hover:border-brand-300 hover:bg-brand-50 transition-all"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
