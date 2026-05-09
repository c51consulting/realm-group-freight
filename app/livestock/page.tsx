import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LIVESTOCK_CATEGORY_LABELS,
  LIVESTOCK_PURPOSE_LABELS,
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

const EXAMPLE_LIVESTOCK = [
  {
    id: 'ls1',
    title: 'Angus Yearling Steers',
    category: 'Cattle',
    categoryColor: 'badge-blue',
    quantity: '45 head',
    price: '$2,400/head',
    location: 'Ararat VIC',
    purpose: 'Fattening',
  },
  {
    id: 'ls2',
    title: 'Merino Ewes',
    category: 'Sheep',
    categoryColor: 'badge-blue',
    quantity: '200 head',
    price: '$185/head',
    location: 'Condobolin NSW',
    purpose: 'Breeding',
  },
  {
    id: 'ls3',
    title: 'Boer Goat Does',
    category: 'Goats',
    categoryColor: 'badge-blue',
    quantity: '30 head',
    price: '$320/head',
    location: 'Toowoomba QLD',
    purpose: 'Breeding',
  },
  {
    id: 'ls4',
    title: 'Quarter Horse Mare',
    category: 'Horses',
    categoryColor: 'badge-blue',
    quantity: '1 head',
    price: '$8,500',
    location: 'Tamworth NSW',
    purpose: 'Stud',
  },
];

export default function LivestockPage({ searchParams }: LivestockPageProps) {
  const { category, purpose, state } = searchParams ?? {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Livestock</h1>
          <p className="page-subtitle">
            Browse cattle, sheep, goats, horses and other livestock listings.
          </p>
        </div>
        <Link
          href="/livestock/create"
          className="btn-primary self-start sm:self-auto py-3 px-6 text-base"
        >
          + List Livestock
        </Link>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 space-y-4">

        {/* Category pills */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/livestock${purpose ? `?purpose=${purpose}` : ''}${state ? `${purpose ? '&' : '?'}state=${state}` : ''}`}
              className={`px-5 py-3 text-base rounded-full font-medium border transition-colors ${
                !category ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
              }`}
            >
              All
            </Link>
            {Object.entries(LIVESTOCK_CATEGORY_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/livestock?category=${key}${purpose ? `&purpose=${purpose}` : ''}${state ? `&state=${state}` : ''}`}
                className={`px-5 py-3 text-base rounded-full font-medium border transition-colors ${
                  category === key
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Purpose pills */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Purpose</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/livestock${category ? `?category=${category}` : ''}${state ? `${category ? '&' : '?'}state=${state}` : ''}`}
              className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${
                !purpose ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
              }`}
            >
              All
            </Link>
            {Object.entries(LIVESTOCK_PURPOSE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/livestock?${category ? `category=${category}&` : ''}purpose=${key}${state ? `&state=${state}` : ''}`}
                className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${
                  purpose === key
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* State pills */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">State</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/livestock${category ? `?category=${category}` : ''}${purpose ? `${category ? '&' : '?'}purpose=${purpose}` : ''}`}
              className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${
                !state ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
              }`}
            >
              All
            </Link>
            {AU_STATES.map(({ value, label }) => (
              <Link
                key={value}
                href={`/livestock?${category ? `category=${category}&` : ''}${purpose ? `purpose=${purpose}&` : ''}state=${value}`}
                className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${
                  state === value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
                }`}
              >
                {value}
              </Link>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {(category || purpose || state) && (
          <div>
            <Link href="/livestock" className="text-sm text-brand-600 hover:text-brand-800 font-medium">
              ✕ Clear all filters
            </Link>
          </div>
        )}
      </div>

      {/* ─── Livestock grid / empty state ─────────────────────────── */}
      <div>
        <div className="bg-gray-100 rounded-lg px-4 py-3 mb-5 text-sm text-gray-600">
          No livestock listings yet — here&apos;s what REALM Group Freight livestock listings look like:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLE_LIVESTOCK.map((item) => (
            <div key={item.id} className="card p-5 flex flex-col gap-3 min-h-[180px] relative">
              {/* Example badge */}
              <span className="absolute top-3 right-3 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                Example
              </span>

              {/* Category badge */}
              <div>
                <span className={`badge ${item.categoryColor}`}>{item.category}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 leading-snug pr-16">
                {item.title}
              </h3>

              {/* Price */}
              <p className="text-xl font-bold text-brand-700">{item.price}</p>

              {/* Quantity */}
              <p className="text-base text-gray-600">{item.quantity}</p>

              {/* Location */}
              <p className="text-base text-gray-500">📍 {item.location}</p>

              {/* Purpose badge */}
              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <span className="badge badge-green">{item.purpose}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/livestock/create" className="btn-primary py-4 px-8 text-lg rounded-xl">
            List your livestock
          </Link>
        </div>
      </div>
    </div>
  );
}
