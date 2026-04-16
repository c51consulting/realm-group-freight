import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LIVESTOCK_CATEGORY_LABELS,
  LIVESTOCK_PURPOSE_LABELS,
  LIVESTOCK_SEX_LABELS,
  PRICING_TYPE_LABELS,
  AU_STATES,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Livestock',
  description: 'Browse and list cattle, sheep, goats, horses and other livestock.',
};

interface LivestockPageProps {
  searchParams?: {
    category?: string;
    purpose?: string;
    state?: string;
    page?: string;
  };
}

export default function LivestockPage({ searchParams }: LivestockPageProps) {
  const { category, purpose, state } = searchParams ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Livestock</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse cattle, sheep, goats, horses and other livestock listings.
          </p>
        </div>
        <Link
          href="/livestock/create"
          className="rounded-md bg-[#4a7c59] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d6649]"
        >
          + List Livestock
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg border p-4 bg-white">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/livestock"
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                !category ? 'bg-[#4a7c59] text-white border-[#4a7c59]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#4a7c59]'
              }`}
            >
              All
            </Link>
            {Object.entries(LIVESTOCK_CATEGORY_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/livestock?category=${key}${purpose ? `&purpose=${purpose}` : ''}${state ? `&state=${state}` : ''}`}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  category === key
                    ? 'bg-[#4a7c59] text-white border-[#4a7c59]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#4a7c59]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/livestock${category ? `?category=${category}` : ''}${state ? `${category ? '&' : '?'}state=${state}` : ''}`}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                !purpose ? 'bg-[#4a7c59] text-white border-[#4a7c59]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#4a7c59]'
              }`}
            >
              All
            </Link>
            {Object.entries(LIVESTOCK_PURPOSE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/livestock?${category ? `category=${category}&` : ''}purpose=${key}${state ? `&state=${state}` : ''}`}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  purpose === key
                    ? 'bg-[#4a7c59] text-white border-[#4a7c59]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#4a7c59]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/livestock${category ? `?category=${category}` : ''}${purpose ? `${category ? '&' : '?'}purpose=${purpose}` : ''}`}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                !state ? 'bg-[#4a7c59] text-white border-[#4a7c59]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#4a7c59]'
              }`}
            >
              All
            </Link>
            {AU_STATES.map(({ value, label }) => (
              <Link
                key={value}
                href={`/livestock?${category ? `category=${category}&` : ''}${purpose ? `purpose=${purpose}&` : ''}state=${value}`}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  state === value
                    ? 'bg-[#4a7c59] text-white border-[#4a7c59]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#4a7c59]'
                }`}
              >
                {value}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="rounded-lg border bg-white p-12 text-center">
        <div className="text-4xl mb-4">🐄</div>
        <h3 className="text-lg font-semibold text-gray-900">No livestock listings yet</h3>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to list livestock on the REALM Ag Marketplace.
        </p>
        <Link
          href="/livestock/create"
          className="mt-4 inline-block rounded-md bg-[#4a7c59] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d6649]"
        >
          List your livestock
        </Link>
      </div>
    </div>
  );
}
