import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your REALM Ag Marketplace account.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🌾</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Sign in to REALM</h1>
          <p className="mt-1 text-sm text-gray-500">Australia&apos;s agricultural marketplace</p>
        </div>
        <div className="card card-body">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
