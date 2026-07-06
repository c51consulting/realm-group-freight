import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OFFER_STATUS_LABELS, MATERIAL_TYPE_LABELS, UNIT_TYPE_LABELS } from '@/lib/constants';
import OfferActions from './OfferActions';

interface OfferDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: OfferDetailPageProps): Promise<Metadata> {
  return {
    title: `Offer ${params.id}`,
    description: 'Offer detail and negotiation.',
  };
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0));
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-600',
    expired: 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS] || status}
    </span>
  );
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/offers/${params.id}`);

  const { data: offer, error } = await supabase
    .from('offers')
    .select(`
      *,
      listing:listings!listing_id(id, title, material_type, unit_type, seller_id, pickup_address),
      buyer:users!buyer_id(id, business_name, email)
    `)
    .eq('id', params.id)
    .single();

  if (error || !offer) notFound();

  const listing = offer.listing as any;
  const buyer = offer.buyer as any;
  const isBuyer = offer.buyer_id === user.id;
  const isSeller = listing?.seller_id === user.id;
  if (!isBuyer && !isSeller) notFound();

  const materialLabel = listing?.material_type
    ? MATERIAL_TYPE_LABELS[listing.material_type as keyof typeof MATERIAL_TYPE_LABELS] || listing.material_type
    : 'Listing';
  const unitLabel = listing?.unit_type
    ? UNIT_TYPE_LABELS[listing.unit_type as keyof typeof UNIT_TYPE_LABELS] || listing.unit_type
    : 'units';

  return (
    <div className="page-container">
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/offers" className="hover:text-brand-600">Offers</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{offer.id}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Offer Detail</h1>
                <p className="text-gray-500 text-sm mt-1">
                  On listing:{' '}
                  <Link href={`/listings/${listing?.id || ''}`} className="text-brand-600 hover:underline">
                    {listing?.title || 'View listing'}
                  </Link>
                </p>
              </div>
              <StatusBadge status={offer.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              {[
                { label: 'Material', value: materialLabel },
                { label: 'Price / Unit', value: money(offer.price_per_unit) },
                { label: 'Quantity', value: `${offer.quantity} ${unitLabel}` },
                { label: 'Total Price', value: money(offer.total_price) },
                { label: 'Freight', value: offer.freight_included ? money(offer.freight_price) : 'Not included' },
                { label: 'Expires', value: offer.expires_at ? new Date(offer.expires_at).toLocaleDateString('en-AU') : '-' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Message</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{offer.message || 'No message provided.'}</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Buyer</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                {(buyer?.business_name || buyer?.email || 'B').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{buyer?.business_name || 'Buyer'}</p>
                {isSeller && buyer?.email && <p className="text-sm text-gray-500">{buyer.email}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            <OfferActions
              offerId={offer.id}
              canSellerAction={isSeller}
              canBuyerWithdraw={isBuyer}
              status={offer.status}
            />

            <div className="section-divider" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">You are</span>
                <span className="font-medium">{isSeller ? 'Seller' : 'Buyer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span className="font-medium">{new Date(offer.created_at).toLocaleDateString('en-AU')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">{OFFER_STATUS_LABELS[offer.status as keyof typeof OFFER_STATUS_LABELS] || offer.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
