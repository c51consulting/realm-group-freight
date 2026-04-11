import type { Metadata } from 'next';
import Link from 'next/link';
import { MATERIAL_TYPE_LABELS, FREIGHT_JOB_STATUS_LABELS, AU_STATES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'REALM Group Freight',
      description: 'REALM Group Freight — agricultural freight logistics and carrier management.',
};

interface FreightPageProps {
  searchParams?: {
    status?: string;
    state?: string;
    page?: string;
  };
}

export default function FreightPage({ searchParams }: FreightPageProps) {
  const { status, state } = searchParams ?? {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">REALM Group Freight</h1>
          <p className="page-subtitle">
                          Find carriers for your agricultural loads, or pick up freight jobs.
          </p>
        </div>
        <Link href="/freight/create" className="btn-primary self-start sm:self-auto">
          + Post Freight Job
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="card p-5 space-y-5">
            <h2 className="font-semibold text-gray-900">Filters</h2>

            <div>
              <label htmlFor="status" className="label">Status</label>
              <select id="status" defaultValue={status ?? ''} className="input">
                <option value="">All statuses</option>
                {Object.entries(FREIGHT_JOB_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="state" className="label">State</label>
              <select id="state" defaultValue={state ?? ''} className="input">
                <option value="">All states</option>
                {AU_STATES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="materialType" className="label">Material Type</label>
              <select id="materialType" className="input">
                <option value="">All types</option>
                {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <button type="button" className="btn-primary w-full">Apply Filters</button>
            <Link href="/freight" className="btn-secondary w-full text-center">
              Clear Filters
            </Link>
          </div>
        </aside>

        {/* Jobs list */}
        <div className="flex-1">
          {/* Empty state — replace with real data fetch */}
          <div className="empty-state card py-20">
            <span className="text-5xl mb-4">🚛</span>
                        <p className="empty-state-title">No freight jobs found</p>
            <p className="empty-state-description">
              Post a freight job to find carriers, or check back later.
            </p>
            <Link href="/freight/create" className="btn-primary mt-6">
              Post a Freight Job
            </Link>
          </div>

          {/*
            TODO: Replace with real data fetch.
            const { data: jobs } = await getFreightJobs({ status, state });
            jobs.map(job => <FreightJobCard key={job.id} job={job} />)
          */}
        </div>
      </div>
    </div>
  );
}
