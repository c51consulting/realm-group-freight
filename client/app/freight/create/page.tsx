'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import ListingForm from '@/components/ListingForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/PageHeader';

/**
 * FreightJobForm page — reuses ListingForm with type pre-set to freight_only.
 * The ListingForm handles the actual creation.
 */
export default function CreateFreightJobPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  // We pass a partial listing with type=freight_only to pre-fill the form
  const freightDefaults = {
    id: '',
    type: 'freight_only' as const,
    status: 'active' as const,
    materialType: 'hay' as const,
    title: '',
    unitType: 'load' as const,
    pricingType: 'offers' as const,
    freightIncluded: true,
    loadingAvailable: false,
    images: [],
    qualityLevel: 'basic' as const,
    sellerId: user.id,
    verified: false,
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="container-page section max-w-3xl">
      <PageHeader
        title="Post a Freight Job"
        subtitle="Describe the load and route. Carriers will submit quotes."
      />
      <ListingForm listing={freightDefaults} />
    </div>
  );
}
