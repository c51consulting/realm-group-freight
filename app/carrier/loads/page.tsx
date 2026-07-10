import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClaimLoadButton from './ClaimLoadButton';

export const metadata: Metadata = { title: 'Matched Load Alerts' };
export const dynamic = 'force-dynamic';

export default async function CarrierLoadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/carrier/loads');

  const { data: carrier } = await supabase
    .from('carriers')
    .select('id, status, regions_served, commodities_handled')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!carrier) redirect('/carrier/onboard');

  const isActive = carrier.status === 'active';

  const { data: notifications } = await supabase
    .from('carrier_load_notifications')
    .select(`
      id,
      status,
      sent_at,
      created_at,
      order:orders!order_id(
        id,
        order_number,
        total_amount,
        freight_amount,
        created_at,
        carrier_id,
        status,
        listing:listings!listing_id(id, title, material_type, pickup_address, quantity_available, unit_type)
      )
    `)
    .eq('carrier_id', carrier.id)
    .in('status', ['pending', 'sms_sent'])
    .order('created_at', { ascending: false })
    .limit(50);

  const loads = (notifications ?? [])
    .map((notification: any) => ({
      notificationId: notification.id,
      sentAt: notification.sent_at ?? notification.created_at,
      order: Array.isArray(notification.order) ? notification.order[0] : notification.order,
    }))
    .filter((item: any) => item.order?.status === 'paid' && !item.order?.carrier_id);

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Matched load alerts</h1>
          <p className="page-subtitle">
            Loads matched to your service areas and freight categories. First active carrier to accept wins.
          </p>
        </div>
        <Link href="/carrier/dashboard" className="btn-secondary self-start">Back to dashboard</Link>
      </div>

      {!isActive && (
        <div className="card p-5 mb-6 border-yellow-300 bg-yellow-50">
          <p className="text-sm text-yellow-900">
            Your carrier account is <strong>{carrier.status}</strong>. You can see matched alerts here, but cannot
            accept loads until your account is activated by the REALM team.
          </p>
        </div>
      )}

      {loads.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          No matched load alerts right now. We will notify you when a paid load matches your service areas and categories.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loads.map(({ notificationId, sentAt, order: o }: any) => {
            const pickup = o.listing?.pickup_address ?? {};
            const pickupTxt = [pickup.suburb, pickup.state, pickup.postcode].filter(Boolean).join(', ');
            return (
              <div key={notificationId} className="card p-5 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{o.order_number}</p>
                  <h3 className="font-semibold">{o.listing?.title ?? 'Untitled load'}</h3>
                  <p className="text-xs text-gray-500 mt-1">Alerted {new Date(sentAt).toLocaleString('en-AU')}</p>
                </div>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between"><dt className="text-gray-500">Commodity</dt><dd className="capitalize">{o.listing?.material_type ?? '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Quantity</dt><dd>{o.listing?.quantity_available ?? '-'} {o.listing?.unit_type ?? ''}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Pickup</dt><dd>{pickupTxt || '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Order value</dt><dd>${Number(o.total_amount ?? 0).toFixed(2)}</dd></div>
                </dl>
                <ClaimLoadButton orderId={o.id} notificationId={notificationId} canClaim={isActive} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
