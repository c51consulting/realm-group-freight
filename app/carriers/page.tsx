import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AU_STATES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Carrier Directory — REALM Group Freight',
  description:
    'Browse verified Australian agricultural freight, livestock and logistics carriers. Contact carriers directly from inside the REALM marketplace.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CarriersPageProps {
  searchParams?: {
    state?: string;
    type?: string;
    equipment?: string;
    verified?: string;
    search?: string;
    page?: string;
  };
}

// Carrier-type filter pills — derived from the CSV "carrier_type" column
const TYPE_PILLS = [
  { value: '', label: 'All' },
  { value: 'road freight', label: 'Road freight' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'bulk', label: 'Bulk / grain' },
  { value: 'refrigerated', label: 'Refrigerated' },
  { value: 'rail freight', label: 'Rail freight' },
  { value: 'courier', label: 'Courier' },
  { value: 'container', label: 'Container' },
  { value: 'tipper', label: 'Tipper' },
  { value: 'tanker', label: 'Tanker' },
];

const PAGE_SIZE = 30;

export default async function CarriersDirectoryPage({ searchParams }: CarriersPageProps) {
  const { state, type, equipment, verified, search } = searchParams ?? {};
  const page = Math.max(1, Number(searchParams?.page ?? 1));

  const supabase = await createClient();
  let query = supabase
    .from('carrier_directory')
    .select(
      'id, slug, operator_name, address, phone, email, website, carrier_type, equipment_and_services, operating_regions, region_tags, carrier_type_tags, verification_status, claimed_by_carrier_id',
      { count: 'exact' },
    )
    .eq('is_published', true);

  // ── filters ──
  if (state) {
    // include carriers explicitly tagged with that state OR national ("ALL")
    query = query.overlaps('region_tags', [state, 'ALL']);
  }
  if (type) {
    // any of the lowercase tags must contain the substring
    query = query.contains('carrier_type_tags', [type]);
  }
  if (equipment) {
    query = query.ilike('equipment_and_services', `%${equipment}%`);
  }
  if (verified === '1') {
    query = query.eq('verification_status', 'verified');
  }
  if (search) {
    query = query.ilike('operator_name', `%${search}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: carriers, count, error } = await query
    .order('operator_name', { ascending: true })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { state, type, equipment, verified, search, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return `/carriers${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Carrier Directory</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Browse verified Australian agricultural freight, livestock and logistics carriers. Filter by state and
          equipment, then contact carriers directly from inside the marketplace — no email hunting required.
        </p>
      </div>

      {/* Filter bar */}
      <form className="bg-white rounded-lg border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <input
            name="search"
            defaultValue={search ?? ''}
            placeholder="Operator name…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
          <select name="state" defaultValue={state ?? ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">All states</option>
            {AU_STATES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Equipment / service contains</label>
          <input
            name="equipment"
            defaultValue={equipment ?? ''}
            placeholder="e.g. refrigerated, livestock, tipper"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={verified === '1'}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 mr-2"
            />
            Verified only
          </label>
          <button type="submit" className="ml-auto bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-md">
            Apply
          </button>
        </div>
        {/* hidden type field kept in sync from pills below */}
        <input type="hidden" name="type" value={type ?? ''} />
      </form>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_PILLS.map(p => {
          const active = (p.value === '' && !type) || p.value === type;
          return (
            <Link
              key={p.value || 'all'}
              href={buildHref({ type: p.value || undefined, page: undefined })}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                active
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {/* Result count */}
      <div className="text-sm text-gray-500 mb-4">
        {error ? (
          <span className="text-red-600">Unable to load carriers. Please try again.</span>
        ) : (
          <>
            <span className="font-medium text-gray-900">{count ?? 0}</span> carriers
            {state ? <> in {state}</> : null}
            {type ? <> · {type}</> : null}
            {verified === '1' ? <> · verified</> : null}
          </>
        )}
      </div>

      {/* Grid */}
      {!carriers || carriers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-700 font-medium">No carriers match these filters.</p>
          <p className="text-gray-500 text-sm mt-1">Try clearing some filters, or search for a different operator.</p>
          <Link href="/carriers" className="inline-block mt-4 text-brand-700 hover:underline text-sm">
            Reset filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carriers.map((c: any) => (
            <article
              key={c.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-gray-900 leading-snug">
                  <Link href={`/carriers/${c.slug}`} className="hover:text-brand-700">
                    {c.operator_name}
                  </Link>
                </h2>
                {c.verification_status === 'verified' && (
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                    ✓ Verified
                  </span>
                )}
              </div>

              {c.carrier_type && (
                <p className="text-xs text-gray-500 mb-1 line-clamp-1">{c.carrier_type}</p>
              )}
              {c.address && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{c.address}</p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {(c.region_tags || []).slice(0, 4).map((r: string) => (
                  <span key={r} className="text-[10px] bg-gray-100 text-gray-700 rounded px-1.5 py-0.5">
                    {r === 'ALL' ? 'National' : r}
                  </span>
                ))}
                {c.claimed_by_carrier_id && (
                  <span className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 rounded px-1.5 py-0.5">
                    Claimed
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <Link
                  href={`/carriers/${c.slug}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  View profile
                </Link>
                <Link
                  href={`/carriers/${c.slug}#contact`}
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md"
                >
                  Contact
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={buildHref({ page: p === 1 ? undefined : String(p) })}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                p === page
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-10 rounded-lg bg-gray-50 border border-gray-200 p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-1">Are you a carrier?</p>
        <p>
          If your business is listed here, you can{' '}
          <Link href="/carriers" className="text-brand-700 hover:underline">
            claim your profile
          </Link>{' '}
          to receive contact requests, respond directly, and unlock load-matching. Not listed yet?{' '}
          <Link href="/carrier/onboard" className="text-brand-700 hover:underline">
            Onboard your business
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
