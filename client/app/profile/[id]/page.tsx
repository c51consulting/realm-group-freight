'use client';

import { use } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/useUser';
import UserProfile from '@/components/UserProfile';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface PublicProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = use(params);
  const { user, reviews, loading, error } = useUser(id);

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !user) {
    return (
      <div className="container-page section">
        <ErrorMessage message={error ?? 'User not found'} />
        <Link href="/listings" className="btn-secondary mt-4">← Back to listings</Link>
      </div>
    );
  }

  return (
    <div className="container-page section max-w-2xl">
      <UserProfile user={user} reviews={reviews} />
    </div>
  );
}
