'use client';

import Link from 'next/link';
import { useListings } from '@/lib/hooks/useListings';
import ListingCard from '@/components/ListingCard';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/PageHeader';

export default function FreightPage() {
  const { listings, total, page, totalPages, loading, error, setPage } = useListings({
    type: 'freight_only',
    page: 1,
    limit: 20,
  });

  return (
    <div className="container-page section">
      <PageHeader
        title="Freight Jobs"
        subtitle={total > 0 ? `${total} freight job${total !== 1 ? 's' : ''} available` : 'Browse available freight jobs'}
        action={
          <Link href="/freight/create" className="btn-primary">
            + Post Freight Job
          </Link>
        }
      />

      <ErrorMessage message={error} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🚛</p>
          <p className="font-medium">No freight jobs posted yet</p>
          <p className="text-sm mt-1">
            <Link href="/freight/create" className="text-brand-600 hover:underline">Post the first one</Link>
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
