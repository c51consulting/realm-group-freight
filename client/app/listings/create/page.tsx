'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import ListingForm from '@/components/ListingForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/PageHeader';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-page section max-w-3xl">
      <PageHeader title="Create Listing" subtitle="Post hay, grain, fodder or other agricultural materials for sale." />
      <ListingForm />
    </div>
  );
}
