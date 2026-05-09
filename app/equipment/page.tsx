import type { Metadata } from 'next';
import Link from 'next/link';
import { AU_STATES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Equipment',
  description: 'Browse and list agricultural equipment and machinery - tractors, balers, trailers, spreaders and more.',
};

interface EquipmentPageProps {
  searchParams?: {
    category?: string;
    condition?: string;
    state?: string;
    page?: string;
  };
}

const EQUIPMENT_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'tractors', label: 'Tractors' },
  { value: 'balers', label: 'Balers' },
  { value: 'trailers', label: 'Trailers' },
  { value: 'spreaders', label: 'Spreaders' },
  { value: 'tillage', label: 'Tillage' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'other', label: 'Other' },
];

const CONDITION_PILLS = [
  { value: '', label: 'All' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'parts', label: 'Parts Only' },
];

const EXAMPLE_EQUIPMENT = [
  {
    id: 'eq1',
    title: 'John Deere 6120R Tractor',
    category: 'Tractors',
    condition: 'Good',
    conditionColor: 'badge-green',
    price: '$145,000',
    location: 'Ballarat VIC',
    year: '2019',
  },
  {
    id: 'eq2',
    title: 'Kuhn VB 2190 Round Baler',
    category: 'Balers',
    condition: 'Good',
    conditionColor: 'badge-green',
    price: '$38,500',
    location: 'Dubbo NSW',
    year: '2021',
  },
  {
    id: 'eq3',
    title: 'Triaxle Grain Trailer',
    category: 'Trailers',
    condition: 'Fair',
    conditionColor: 'badge-yellow',
    price: '$28,000',
    location: 'Horsham VIC',
    year: '2015',
  },
  {
    id: 'eq4',
    title: 'Case IH Patriot 4440 Sprayer',
    category: 'Spreading',
    condition: 'Parts Only',
    conditionColor: 'badge-red',
    price: '$12,000',
    location: 'Narrabri NSW',
    year: '2012',
  },
];

export default function EquipmentPage({ searchParams }: EquipmentPageProps) {
  const { category, condition, state } = searchParams ?? {};

  const buildUrl = (params: Record<string, string | undefined>) => {
    const merged = { category, condition, state, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&');
    return `/equipment${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Equipment</h1>
          <p className="page-subtitle">
            Buy and sell agricultural equipment and machinery — tractors, balers, trailers, spreaders and more.
          </p>
        </div>
        <Link href="/equipment/create" className="btn-primary self-start sm:self-auto py-3 px-6 text-base">
          + List Equipment
        </Link>
      </div>

      {/* ─── Full-width filter bar ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 space-y-4">

        {/* Row 1: Category pills */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_CATEGORIES.map(({ value, label }) => {
              const isActive = (category ?? '') === value;
              return (
                <Link
                  key={value}
                  href={buildUrl({ category: value || undefined })}
                  className={`px-5 py-3 text-base rounded-full font-medium border transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Row 2: Condition pills + State dropdown */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Condition</label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_PILLS.map(({ value: v, label }) => {
                const isActive = (condition ?? '') === v;
                return (
                  <Link
                    key={v}
                    href={buildUrl({ condition: v || undefined })}
                    className={`px-4 py-2 text-base rounded-full font-medium border transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-brand-600 border-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2" htmlFor="eq-state">State</label>
            <select id="eq-state" defaultValue={state ?? ''} className="input max-w-[200px] text-base py-2">
              <option value="">All states</option>
              {AU_STATES.map(({ value, label }) => (
                <option key={value} value={value}>{value} — {label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {(category || condition || state) && (
          <div>
            <Link href="/equipment" className="text-sm text-brand-600 hover:text-brand-800 font-medium">
              ✕ Clear all filters
            </Link>
          </div>
        )}
      </div>

      {/* ─── Equipment grid / empty state ─────────────────────────── */}
      <div>
        <div className="bg-gray-100 rounded-lg px-4 py-3 mb-5 text-sm text-gray-600">
          No equipment listings yet — here&apos;s what REALM Group Freight equipment listings look like:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLE_EQUIPMENT.map((item) => (
            <div key={item.id} className="card p-5 flex flex-col gap-3 min-h-[180px] relative">
              {/* Example badge */}
              <span className="absolute top-3 right-3 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                Example
              </span>

              {/* Category badge */}
              <div>
                <span className="badge badge-blue">{item.category}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 leading-snug pr-16">
                {item.title}
              </h3>

              {/* Price */}
              <p className="text-xl font-bold text-brand-700">{item.price}</p>

              {/* Year */}
              <p className="text-base text-gray-600">{item.year}</p>

              {/* Location */}
              <p className="text-base text-gray-500">📍 {item.location}</p>

              {/* Condition badge */}
              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <span className={`badge ${item.conditionColor}`}>
                  {item.condition}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/equipment/create" className="btn-primary py-4 px-8 text-lg rounded-xl">
            List your equipment
          </Link>
        </div>
      </div>
    </div>
  );
}
