import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MATERIAL_TYPE_LABELS,
  UNIT_TYPE_LABELS,
  QUALITY_LEVEL_LABELS,
  PRICING_TYPE_LABELS,
  LISTING_TYPE_LABELS,
} from '@/lib/constants';

interface ListingDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  // TODO: fetch listing and use real title
  return {
    title: `Listing ${params.id}`,
    description: 'Agricultural material listing detail.',
  };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = params;

  // TODO: Replace with real data fetch
  // const listing = await getListingById(id);
  // if (!listing) notFound();

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/listings" className="hover:text-brand-600">Listings</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{id}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image placeholder */}
          <div className="card overflow-hidden">
            <div className="bg-gray-100 h-64 flex items-center justify-center text-gray-400">
              <span className="text-6xl">🌾</span>
            </div>
          </div>

          {/* Details */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {/* listing.title */}
                  Listing Detail
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Posted by <span className="font-medium text-gray-700">Seller Name</span>
                </p>
              </div>
              <span className="badge-green shrink-0">Active</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              {[
                { label: 'Material', value: '—' },
                { label: 'Unit', value: '—' },
                { label: 'Quantity', value: '—' },
                { label: 'Price / Unit', value: '—' },
                { label: 'Quality', value: '—' },
                { label: 'Pricing Type', value: '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {/* listing.description */}
                No description provided.
              </p>
            </div>
          </div>

          {/* Feed tests */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Feed Tests &amp; Quality</h2>
            <div className="empty-state py-8">
              <p className="empty-state-title text-sm">No feed tests attached</p>
              <p className="empty-state-description text-xs">
                Feed test results will appear here once uploaded.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar — offer / contact */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">$—</p>
              <p className="text-sm text-gray-500">per unit</p>
            </div>

            <div className="space-y-3">
              <Link
                href={`/offers?listingId=${id}`}
                className="btn-primary w-full justify-center"
              >
                Make an Offer
              </Link>
              <button type="button" className="btn-secondary w-full">
                Contact Seller
              </button>
            </div>

            <div className="section-divider" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Freight included</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loading available</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup location</span>
                <span className="font-medium">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
