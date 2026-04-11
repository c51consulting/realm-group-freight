import type { Metadata } from 'next';
import Link from 'next/link';
import { NAV_LINKS, ORDER_STATUS_LABELS, OFFER_STATUS_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const STAT_CARDS = [
  {
    label: 'Active Listings',
    value: '—',
    change: null,
    href: '/listings',
    color: 'brand',
  },
  {
    label: 'Open Offers',
    value: '—',
    change: null,
    href: '/offers',
    color: 'blue',
  },
  {
    label: 'Active Orders',
    value: '—',
    change: null,
    href: '/orders',
    color: 'earth',
  },
  {
    label: 'Freight Jobs',
    value: '—',
    change: null,
    href: '/freight',
    color: 'gray',
  },
];

const QUICK_ACTIONS = [
  { label: 'Post a Listing',    href: '/listings/create', icon: '📋' },
  { label: 'Post Freight Job',  href: '/freight/create',  icon: '🚛' },
  { label: 'Browse Listings',   href: '/listings',        icon: '🌾' },
  { label: 'View Orders',       href: '/orders',          icon: '📦' },
];

export default function DashboardPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your marketplace activity.</p>
        </div>
        <Link href="/listings/create" className="btn-primary self-start sm:self-auto">
          + Post Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((stat) => (
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md hover:border-brand-300 transition-all group"
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Listings</h2>
            <Link href="/listings" className="text-sm text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="empty-state py-8">
            <p className="empty-state-title text-base">No listings yet</p>
            <p className="empty-state-description text-xs">
              Your active listings will appear here.
            </p>
            <Link href="/listings/create" className="btn-primary mt-4 text-xs px-3 py-1.5">
              Post your first listing
            </Link>
          </div>
        </section>

        {/* Recent orders */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="empty-state py-8">
            <p className="empty-state-title text-base">No orders yet</p>
            <p className="empty-state-description text-xs">
              Your orders will appear here once an offer is accepted.
            </p>
          </div>
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
