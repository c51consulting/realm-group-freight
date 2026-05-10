import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW, MATERIAL_TYPE_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Manage your marketplace orders.',
};

interface PageProps {
  searchParams?: { status?: string; role?: string };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    paid:            'bg-blue-100 text-blue-800',
    in_transit:      'bg-indigo-100 text-indigo-800',
    delivered:       'bg-purple-100 text-purple-800',
    confirmed:       'bg-teal-100 text-teal-800',
    disputed:        'bg-red-100 text-red-800',
    refunded:        'bg-gray-100 text-gray-600',
    completed:       'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
    </span>
  );
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/orders');

  const status = searchParams?.status || '';
  const role = searchParams?.role || 'both';

  // Fetch orders where user is buyer or seller
  let query = supabase
    .from('orders')
    .select(`
      *,
      listing:listings!listing_id(id, title, material_type, pickup_address),
      buyer:users!buyer_id(id, business_name),
      seller:users!seller_id(id, business_name)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data: orders, error } = await query;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">Track your orders through the full held in trust lifecycle.</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        <Link
          href="/orders"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
            !status ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All
        </Link>
        {ORDER_STATUS_FLOW.map((s) => (
          <Link
            key={s}
            href={`/orders?status=${s}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              status === s ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm mb-4">
          Error loading orders: {error.message}
        </div>
      )}

      {!orders || orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {status ? `No ${ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]?.toLowerCase() || status} orders` : 'No orders yet'}
          </h2>
          <p className="text-gray-500 mb-4 text-sm">
            Orders are created when a seller accepts an offer.
          </p>
          <Link href="/listings" className="btn-primary inline-block">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const listing = order.listing as any;
            const buyer = order.buyer as any;
            const seller = order.seller as any;
            const isBuyer = order.buyer_id === user.id;
            const materialLabel = listing?.material_type
              ? MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type
              : '';
            const suburb = listing?.pickup_address?.suburb || '';
            const state = listing?.pickup_address?.state || '';

            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={order.status} />
                      {materialLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                          {materialLabel}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{order.order_number}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {listing?.title || 'Order'}
                    </h3>
                    {(suburb || state) && (
                      <p className="text-xs text-gray-500 mt-0.5">{[suburb, state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(order.total_amount || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Order total</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">{isBuyer ? 'Seller' : 'Buyer'}</p>
                    <p className="font-medium text-gray-900">
                      {isBuyer ? (seller?.business_name || 'Seller') : (buyer?.business_name || 'Buyer')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Your role</p>
                    <p className="font-medium text-gray-900">{isBuyer ? 'Buyer' : 'Seller'}</p>
                  </div>
                  {order.freight_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Freight</p>
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(order.freight_amount)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Link href={`/orders/${order.id}`} className="text-sm text-brand-600 hover:underline">
                    View order →
                  </Link>
                  {listing?.id && (
                    <Link href={`/listings/${listing.id}`} className="text-sm text-gray-500 hover:text-gray-700">
                      View listing
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
