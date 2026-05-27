import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CarrierReviewActions from './CarrierReviewActions';

export const metadata: Metadata = { title: 'Admin · Carriers' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
};

export default async function AdminCarriersPage({ searchParams }: { searchParams?: { status?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/admin/carriers');

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Admin only</h1>
          <p className="text-gray-500">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const statusFilter = searchParams?.status ?? 'pending_review';

  let query = supabase
    .from('carriers')
    .select('*, owner:users!owner_id(id, email, business_name, phone)')
    .order('created_at', { ascending: false });
  if (statusFilter !== 'all') query = query.eq('status', statusFilter);

  const { data: carriers } = await query;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Carrier verification</h1>
        <p className="page-subtitle">Review pending carrier applications and manage existing carriers.</p>
      </div>

      <div className="flex gap-2 mb-6 text-sm">
        {['pending_review', 'active', 'suspended', 'rejected', 'all'].map((s) => (
          <Link
            key={s}
            href={`/admin/carriers?status=${s}`}
            className={`px-3 py-1.5 rounded-full border ${statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-300 text-gray-700'}`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {!carriers || carriers.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No carriers in this view.</div>
      ) : (
        <div className="space-y-4">
          {carriers.map((c: any) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{c.business_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[c.status] ?? ''}`}>{c.status}</span>
                  </div>
                  <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><dt className="text-gray-500">Owner</dt><dd>{c.owner?.email ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">ABN</dt><dd>{c.abn ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">Phone</dt><dd>{c.contact_phone ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">Fleet</dt><dd>{c.fleet_size ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">NHVR</dt><dd>{c.nhvr_accreditation ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">Insurer</dt><dd>{c.insurance_provider ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">Policy expiry</dt><dd>{c.insurance_expiry ?? '—'}</dd></div>
                    <div><dt className="text-gray-500">Insurance doc</dt><dd>{c.insurance_doc_url ? <Link href={`/admin/carriers/${c.id}`} className="text-brand-600 underline">View</Link> : '—'}</dd></div>
                    <div className="col-span-2 md:col-span-4"><dt className="text-gray-500">Regions / commodities</dt><dd>{(c.regions_served ?? []).join(', ')} · {(c.commodities_handled ?? []).join(', ')}</dd></div>
                  </dl>
                  {c.rejection_reason && (
                    <p className="text-sm text-red-700 mt-2"><strong>Reason:</strong> {c.rejection_reason}</p>
                  )}
                </div>
                <div className="lg:w-64">
                  <CarrierReviewActions carrierId={c.id} currentStatus={c.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
