'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useListings } from '@/lib/hooks/useListings';
import ListingCard from '@/components/ListingCard';
import SearchFilters from '@/components/SearchFilters';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/PageHeader';

function ListingsContent() {
  const { listings, total, page, totalPages, loading, error, filters, setFilters, setPage } =
    useListings({ page: 1, limit: 20 });

  return (
    <div className="container-page section">
      <PageHeader
        title="Browse Listings"
        subtitle={total > 0 ? `${total} listing${total !== 1 ? 's' : ''} available` : undefined}
        action={
          <Link href="/listings/create" className="btn-primary">
            + Post Listing
          </Link>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <SearchFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Listings grid */}
        <div className="flex-1 min-w-0">
          <ErrorMessage message={error} />

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">🌾</p>
              <p className="font-medium">No listings found</p>
              <p className="text-sm mt-1">Try adjusting your filters or{' '}
                <Link href="/listings/create" className="text-brand-600 hover:underline">post one yourself</Link>.
              </p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}>
      <ListingsContent />
    </Suspense>
  );
}
