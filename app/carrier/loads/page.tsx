import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClaimLoadButton from './ClaimLoadButton';

export const metadata: Metadata = { title: 'Available Loads' };
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

  // Fetch paid orders without a carrier
  const { data: loads } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, freight_amount, created_at, listing:listings!listing_id(id, title, material_type, pickup_address, quantity_available, unit_type)')
    .is('carrier_id', null)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Available loads</h1>
          <p className="page-subtitle">Paid orders awaiting a carrier.</p>
        </div>
        <Link href="/carrier/dashboard" className="btn-secondary self-start">← Back to dashboard</Link>
      </div>

      {!isActive && (
        <div className="card p-5 mb-6 border-yellow-300 bg-yellow-50">
          <p className="text-sm text-yellow-900">
            Your carrier account is <strong>{carrier.status}</strong>. You can browse loads here but cannot claim until your account is activated by our admin team.
          </p>
        </div>
      )}

      {!loads || loads.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No loads available right now. Check back soon.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loads.map((o: any) => {
            const pickup = o.listing?.pickup_address ?? {};
            const pickupTxt = [pickup.suburb, pickup.state, pickup.postcode].filter(Boolean).join(', ');
            return (
              <div key={o.id} className="card p-5 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{o.order_number}</p>
                  <h3 className="font-semibold">{o.listing?.title ?? 'Untitled load'}</h3>
                </div>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between"><dt className="text-gray-500">Commodity</dt><dd className="capitalize">{o.listing?.material_type ?? '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Quantity</dt><dd>{o.listing?.quantity_available ?? '—'} {o.listing?.unit_type ?? ''}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Pickup</dt><dd>{pickupTxt || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Order value</dt><dd>${Number(o.total_amount ?? 0).toFixed(2)}</dd></div>
                </dl>
                <ClaimLoadButton orderId={o.id} canClaim={isActive} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
