import type { Metadata } from 'next';
import Link from 'next/link';
import { AU_STATES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Equipment',
  description: 'Browse and list agricultural equipment and machinery - tractors, balers, trailers, spreaders and more.',
};

interface EquipmentPageProps {
  searchParams?: {
    state?: string;
    page?: string;
  };
}

export default function EquipmentPage({ searchParams }: EquipmentPageProps) {
  const { state } = searchParams ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Buy and sell agricultural equipment and machinery - tractors, balers, trailers, spreaders and more.
          </p>
        </div>
        <Link href="/equipment/create" className="rounded-md bg-[#4a7c59] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d6649]">+ List Equipment</Link>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="state">State</label>
            <select id="state" defaultValue={state ?? ''} className="w-full rounded-md border-gray-300 text-sm">
              <option value="">All states</option>
              {AU_STATES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-5xl mb-3">Equipment</div>
        <h3 className="text-lg font-semibold mb-2">No equipment listings yet</h3>
        <p className="text-sm text-gray-500 mb-4">Be the first to list equipment on the REALM Ag Marketplace.</p>
        <Link href="/equipment/create" className="inline-block rounded-md bg-[#4a7c59] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d6649]">List your equipment</Link>
      </div>
    </div>
  );
}
