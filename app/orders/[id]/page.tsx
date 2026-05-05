import type { Metadata } from 'next';
import Link from 'next/link';
import { WeighbridgeTimeline } from '@/components/order/WeighbridgeTimeline';
import ProofOfDeliveryPanel from '@/components/order/ProofOfDeliveryPanel';

interface OrderDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  return {
    title: `Order ${params.id}`,
    description: 'Order detail, weigh events and proof of delivery.',
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params;

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/orders" className="hover:text-brand-600">Orders</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{id}</li>
        </ol>
      </nav>

      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Order {id}</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Link href={`/driver/checkin/${id}`} style={{ padding: '8px 12px', background: '#0a7', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>
          Driver check-in
        </Link>
        <Link href={`/freight?orderId=${id}`} style={{ padding: '8px 12px', background: '#eee', color: '#222', borderRadius: 4, textDecoration: 'none' }}>
          View freight job
        </Link>
      </div>

      <WeighbridgeTimeline orderId={id} />
      <ProofOfDeliveryPanel orderId={id} />
    </div>
  );
}
