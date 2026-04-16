import type { Metadata } from 'next';
import Link from 'next/link';
import { LIVESTOCK_CATEGORY_LABELS, LIVESTOCK_BREED_LABELS, AU_STATE_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Livestock Detail',
  description: 'View livestock listing details.',
};

export default function LivestockDetailPage({ params }: { params: { id: string } }) {
  // Placeholder - will be connected to Supabase
  const listing = null;

  return (
    <div className="page-container max-w-4xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/livestock" className="hover:text-brand-600">Livestock Exchange</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium">Listing Detail</li>
        </ol>
      </nav>

      {listing ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Title</h1>
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-green">Category</span>
                  <span className="badge badge-blue">Breed</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">$0.00</p>
                <p className="text-sm text-gray-500">per head</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Livestock Details</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Breed</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Quantity</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Age Range</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Average Weight</dt>
                  <dd className="text-sm font-medium text-gray-900">— kg</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Sex</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Seller</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">State</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">PIC Number</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">NVD Number</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">NLIS Compliant</dt>
                  <dd className="text-sm font-medium text-gray-900">—</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Health & Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health & Condition</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Condition Score</dt>
                <dd className="text-sm font-medium text-gray-900">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Vaccinated</dt>
                <dd className="text-sm font-medium text-gray-900">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Drenched</dt>
                <dd className="text-sm font-medium text-gray-900">—</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Breeding Status</dt>
                <dd className="text-sm font-medium text-gray-900">—</dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">No description provided.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/livestock" className="btn-secondary flex-1 text-center">
              Back to Listings
            </Link>
            <button className="btn-primary flex-1">
              Make an Offer
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-12">
          <div className="empty-state">
            <p className="empty-state-title">Livestock listing not found</p>
            <p className="empty-state-description">
              This listing may have been removed or does not exist yet. Listing ID: {params.id}
            </p>
            <Link href="/livestock" className="btn-primary mt-4">
              Browse Livestock
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
