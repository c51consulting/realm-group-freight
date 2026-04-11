'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useListing } from '@/lib/hooks/useListings';
import ListingForm from '@/components/ListingForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/PageHeader';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { listing, loading, error } = useListing(id);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (listing && user && listing.sellerId !== user.id) {
      router.push(`/listings/${id}`);
    }
  }, [listing, user, id, router]);

  if (loading || authLoading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !listing) {
    return (
      <div className="container-page section">
        <ErrorMessage message={error ?? 'Listing not found'} />
      </div>
    );
  }

  return (
    <div className="container-page section max-w-3xl">
      <PageHeader title="Edit Listing" />
      <ListingForm listing={listing} />
    </div>
  );
}
