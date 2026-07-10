import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Carrier Dashboard' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  suspended: 'bg-orange-100 text-orange-800 border-orange-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
};

export default async function CarrierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/carrier/dashboard');

  const { data: carrier } = await supabase
    .from('carriers')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!carrier) redirect('/carrier/onboard');

  const [vehiclesRes, driversRes, activeOrdersRes, completedOrdersRes, matchedAlertsRes] = await Promise.all([
    supabase.from('carrier_vehicles').select('id', { count: 'exact', head: true }).eq('carrier_id', carrier.id),
    supabase.from('carrier_drivers').select('id', { count: 'exact', head: true }).eq('carrier_id', carrier.id),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('carrier_id', user.id).not('status', 'in', '(completed,refunded,cancelled)'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('carrier_id', user.id).eq('status', 'completed'),
    supabase.from('carrier_load_notifications').select('id', { count: 'exact', head: true }).eq('carrier_id', carrier.id).in('status', ['pending', 'sms_sent']),
  ]);

  const { data: myOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, freight_amount, created_at, listing:listings!listing_id(id, title, pickup_address)')
    .eq('carrier_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const isActive = carrier.status === 'active';

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{carrier.business_name}</h1>
          <p className="page-subtitle">Carrier network dashboard</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${STATUS_BADGE[carrier.status] ?? ''}`}>
          {STATUS_LABEL[carrier.status] ?? carrier.status}
        </span>
      </div>

      {!isActive && (
        <div className="card p-5 mb-6 border-yellow-300 bg-yellow-50">
          <h3 className="font-semibold text-yellow-900 mb-1">
            {carrier.status === 'pending_review' && 'Awaiting verification'}
            {carrier.status === 'suspended' && 'Account suspended'}
            {carrier.status === 'rejected' && 'Application not approved'}
          </h3>
          <p className="text-sm text-yellow-900">
            {carrier.status === 'pending_review' && 'Our team is reviewing your compliance docs. You will be able to accept matched loads once activated.'}
            {carrier.status === 'suspended' && `Your account has been suspended. ${carrier.rejection_reason ?? 'Contact support.'}`}
            {carrier.status === 'rejected' && (carrier.rejection_reason ?? 'Please contact support for details.')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Link href="/carrier/loads" className="card p-5 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Matched Alerts</p>
          <p className="text-2xl font-bold">{matchedAlertsRes.count ?? 0}</p>
        </Link>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Active Jobs</p>
          <p className="text-2xl font-bold">{activeOrdersRes.count ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold">{completedOrdersRes.count ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Vehicles</p>
          <p className="text-2xl font-bold">{vehiclesRes.count ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Drivers</p>
          <p className="text-2xl font-bold">{driversRes.count ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {isActive && <Link href="/carrier/loads" className="btn-primary">View matched load alerts</Link>}
        <Link href="/carrier/onboard" className="btn-secondary">Edit profile</Link>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">Recent jobs</h2>
        {!myOrders || myOrders.length === 0 ? (
          <p className="text-sm text-gray-500">
            No jobs yet. {isActive ? <Link href="/carrier/loads" className="text-brand-600 underline">View matched alerts</Link> : 'You will see jobs here once you start accepting matched loads.'}
          </p>
        ) : (
          <div className="divide-y">
            {myOrders.map((o: any) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{o.listing?.title ?? '-'}</p>
                    <p className="text-xs text-gray-500">{o.order_number} - {o.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(o.freight_amount ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
