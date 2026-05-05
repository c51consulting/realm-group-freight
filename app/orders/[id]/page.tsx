import type { Metadata } from 'next';
import Link from 'next/link';
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW, PLATFORM_FEE_PERCENT } from '@/lib/constants';
import { WeighbridgeTimeline } from '@/components/order/WeighbridgeTimeline';

interface OrderDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  return {
    title: `Order ${params.id}`,
    description: 'Order detail, weigh events and proof of delivery.',
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params;

  // TODO: const order = await getOrderById(id);
  // if (!order) notFound();

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/orders" className="hover:text-brand-600">Orders</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{id}</li>
        </ol>
      </nav>

      {/* Status progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {ORDER_STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </div>
              {i < ORDER_STATUS_FLOW.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-200 mb-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #—</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Listing:{' '}
                  <Link href="/listings" className="text-brand-600 hover:underline">
                    View Listing
                  </Link>
                </p>
              </div>
              <span className="badge-yellow shrink-0">Pending Payment</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              {[
                { label: 'Buyer',           value: '—' },
                { label: 'Seller',          value: '—' },
                { label: 'Carrier',         value: '—' },
                { label: 'Total Amount',    value: '—' },
                { label: 'Freight Amount',  value: '—' },
                { label: `Platform Fee (${PLATFORM_FEE_PERCENT}%)`, value: '—' },
                { label: 'Quality Level',   value: '—' },
                { label: 'Payment Held',    value: '—' },
                { label: 'Created',         value: '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weigh events */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Weigh Events</h2>
              <span className="badge-gray">0 events</span>
            </div>

            <div className="empty-state py-8">
              <p className="empty-state-title text-sm">No weigh events</p>
              <p className="empty-state-description text-xs">
                Weighbridge events will appear here once ingested via API, CSV, OCR or manual entry.
              </p>
            </div>

            {/*
              TODO: Replace with real data.
              const weighEvents = await getWeighEventsByOrder(id);
              weighEvents.map(event => <WeighEventRow key={event.id} event={event} />)
            */}
          </div>

          {/* Proof of delivery */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Proof of Delivery</h2>

            <div className="empty-state py-8">
              <p className="empty-state-title text-sm">No delivery evidence</p>
              <p className="empty-state-description text-xs">
                Photos, weighbridge records and signature will appear here once submitted.
              </p>
            </div>

            {/*
              TODO: const pod = await getPODByOrder(id);
              if (pod) <PODDetail pod={pod} />
            */}
          </div>
        </div>

        <WeighbridgeTimeline orderId={id} />

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button type="button" className="btn-primary w-full">
                Confirm Delivery
              </button>
              <button type="button" className="btn-secondary w-full">
                Raise Dispute
              </button>
              <Link
                href={`/freight?orderId=${id}`}
                className="btn-secondary w-full text-center"
              >
                View Freight Job
              </Link>
            </div>

            <div className="section-divider" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order #</span>
                <span className="font-medium font-mono">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment held</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stripe PI</span>
                <span className="font-medium font-mono text-xs truncate max-w-[120px]">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
