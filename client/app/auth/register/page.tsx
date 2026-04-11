import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a free REALM Ag Marketplace account to buy, sell and trade agricultural materials.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <span className="text-5xl">🌾</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Create your REALM account</h1>
          <p className="mt-1 text-sm text-gray-500">Free to join. Trade hay, grain, fodder and more.</p>
        </div>
        <div className="card card-body">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
