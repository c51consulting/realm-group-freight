'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useUser } from '@/lib/hooks/useUser';
import UserProfile from '@/components/UserProfile';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/PageHeader';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { user, reviews, loading, error, update } = useUser(authUser?.id);

  useEffect(() => {
    if (!authLoading && !authUser) router.push('/auth/login');
  }, [authLoading, authUser, router]);

  if (authLoading || !authUser) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="container-page section max-w-2xl">
      <PageHeader title="My Profile" />
      <ErrorMessage message={error} />
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : user ? (
        <UserProfile user={user} reviews={reviews} editable onUpdate={update} />
      ) : null}
    </div>
  );
}
