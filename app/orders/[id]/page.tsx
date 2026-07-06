import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ORDER_STATUS_LABELS, MATERIAL_TYPE_LABELS } from '@/lib/constants';
import { WeighbridgeTimeline } from '@/components/order/WeighbridgeTimeline';
import ProofOfDeliveryPanel from '@/components/order/ProofOfDeliveryPanel';
import CheckoutButton from './CheckoutButton';

interface OrderDetailPageProps {
  params: { id: string };
  searchParams?: { payment?: string };
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  return {
    title: `Order ${params.id}`,
    description: 'Order detail, payment, weigh events and proof of delivery.',
  };
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0));
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-purple-100 text-purple-800',
    confirmed: 'bg-teal-100 text-teal-800',
    disputed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-600',
    completed: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
    </span>
  );
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/orders/${params.id}`);

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings!listing_id(id, title, material_type, pickup_address),
      buyer:users!buyer_id(id, business_name, email),
      seller:users!seller_id(id, business_name, email)
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) notFound();
  if (![order.buyer_id, order.seller_id, order.carrier_id].filter(Boolean).includes(user.id)) notFound();

  const listing = order.listing as any;
  const buyer = order.buyer as any;
  const seller = order.seller as any;
  const isBuyer = order.buyer_id === user.id;
  const materialLabel = listing?.material_type
    ? MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type
    : '';

  return (
    <div className="page-container max-w-6xl">
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/orders" className="hover:text-brand-600">Orders</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{order.order_number || order.id}</li>
        </ol>
      </nav>

      {searchParams?.payment === 'success' && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Payment completed. The order will update once Stripe confirms the payment.
        </div>
      )}
      {searchParams?.payment === 'cancelled' && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Checkout was cancelled. You can restart payment from this order.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{order.order_number || `Order ${order.id.slice(0, 8)}`}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {listing?.title ? (
                    <Link href={`/listings/${listing.id}`} className="text-brand-600 hover:underline">{listing.title}</Link>
                  ) : 'Marketplace order'}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
              {[
                { label: 'Material', value: materialLabel || '-' },
                { label: 'Total', value: money(order.total_amount) },
                { label: 'Freight', value: money(order.freight_amount) },
                { label: 'Platform Fee', value: money(order.platform_fee) },
                { label: 'Payment Held', value: order.payment_held ? 'Yes' : 'No' },
                { label: 'Buyer', value: buyer?.business_name || buyer?.email || 'Buyer' },
                { label: 'Seller', value: seller?.business_name || seller?.email || 'Seller' },
                { label: 'Created', value: new Date(order.created_at).toLocaleDateString('en-AU') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <WeighbridgeTimeline orderId={order.id} />
          <ProofOfDeliveryPanel orderId={order.id} />
        </div>

        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Next Step</h2>
            {isBuyer && order.status === 'pending_payment' ? (
              <CheckoutButton orderId={order.id} />
            ) : (
              <p className="text-sm text-gray-600">
                {order.status === 'pending_payment'
                  ? 'Waiting for buyer payment.'
                  : `Current status: ${ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}.`}
              </p>
            )}

            <div className="section-divider" />

            <div className="space-y-2 text-sm">
              <Link href={`/driver/checkin/${order.id}`} className="btn-secondary block text-center">
                Driver check-in
              </Link>
              <Link href={`/freight?orderId=${order.id}`} className="btn-secondary block text-center">
                View freight job
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
