'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useOrder } from '@/lib/hooks/useOrders';
import OrderTimeline from '@/components/OrderTimeline';
import WeighEventForm from '@/components/WeighEventForm';
import PODForm from '@/components/PODForm';
import ReviewForm from '@/components/ReviewForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useNotification } from '@/lib/context/NotificationContext';
import {
  formatCurrency,
  formatDateTime,
  orderStatusLabel,
  orderStatusColour,
} from '@/lib/client-utils';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { order, loading, error, refresh, updateStatus } = useOrder(id);
  const { notify } = useNotification();
  const [showWeighForm, setShowWeighForm] = useState(false);
  const [showPODForm, setShowPODForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !order) {
    return (
      <div className="container-page section">
        <ErrorMessage message={error ?? 'Order not found'} />
        <Link href="/orders" className="btn-secondary mt-4">← Back to orders</Link>
      </div>
    );
  }

  const isBuyer = user.id === order.buyerId;
  const isSeller = user.id === order.sellerId;
  const isCarrier = user.id === order.carrierId;

  const handleStatusUpdate = async (status: string) => {
    setActionLoading(true);
    try {
      await updateStatus(status);
      notify(`Order status updated to ${orderStatusLabel(status as never)}`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-page section">
      <Link href="/orders" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← Back to orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`badge text-sm px-3 py-1 ${orderStatusColour(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
          <div className="card card-body">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              {order.Listing && (
                <div>
                  <dt className="text-gray-500">Listing</dt>
                  <dd className="font-medium">
                    <Link href={`/listings/${order.listingId}`} className="text-brand-600 hover:underline">
                      {order.Listing.title}
                    </Link>
                  </dd>
                </div>
              )}
              {order.totalAmount && (
                <div>
                  <dt className="text-gray-500">Total Amount</dt>
                  <dd className="font-bold text-lg">{formatCurrency(order.totalAmount)}</dd>
                </div>
              )}
              {order.freightAmount && order.freightAmount > 0 && (
                <div>
                  <dt className="text-gray-500">Freight</dt>
                  <dd className="font-medium">{formatCurrency(order.freightAmount)}</dd>
                </div>
              )}
              {order.platformFee && (
                <div>
                  <dt className="text-gray-500">Platform Fee (5%)</dt>
                  <dd className="font-medium">{formatCurrency(order.platformFee)}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Quality Level</dt>
                <dd className="font-medium capitalize">{order.qualityAssuranceLevel}</dd>
              </div>
            </dl>
          </div>

          {/* Parties */}
          <div className="card card-body">
            <h2 className="font-semibold text-gray-900 mb-3">Parties</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              {order.buyer && (
                <div>
                  <p className="text-gray-500 mb-1">Buyer</p>
                  <p className="font-medium">{order.buyer.businessName}</p>
                  {order.buyer.phone && <p className="text-gray-500">{order.buyer.phone}</p>}
                </div>
              )}
              {order.seller && (
                <div>
                  <p className="text-gray-500 mb-1">Seller</p>
                  <p className="font-medium">{order.seller.businessName}</p>
                  {order.seller.phone && <p className="text-gray-500">{order.seller.phone}</p>}
                </div>
              )}
              {order.carrier && (
                <div>
                  <p className="text-gray-500 mb-1">Carrier</p>
                  <p className="font-medium">{order.carrier.businessName}</p>
                  {order.carrier.phone && <p className="text-gray-500">{order.carrier.phone}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Weigh events */}
          {order.weighEvents && order.weighEvents.length > 0 && (
            <div className="card card-body">
              <h2 className="font-semibold text-gray-900 mb-3">Weigh Events</h2>
              <div className="space-y-2">
                {order.weighEvents.map((we) => (
                  <div key={we.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{we.vehicleRego ?? 'Unknown vehicle'}</span>
                      <span className={`badge ${we.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {we.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Net: <strong>{we.netWeight} {we.weightUnit}</strong>
                      {we.grossWeight && ` (Gross: ${we.grossWeight}, Tare: ${we.tareWeight})`}
                    </p>
                    {we.siteName && <p className="text-gray-400 text-xs mt-1">{we.siteName}</p>}
                    {we.weighedAt && <p className="text-gray-400 text-xs">{formatDateTime(we.weighedAt)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add weigh event */}
          {(isSeller || isCarrier) && ['paid', 'in_transit'].includes(order.status) && (
            <div className="card card-body">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Add Weigh Event</h2>
                <button onClick={() => setShowWeighForm((v) => !v)} className="btn-ghost btn-sm">
                  {showWeighForm ? 'Cancel' : '+ Add'}
                </button>
              </div>
              {showWeighForm && (
                <WeighEventForm orderId={order.id} onSuccess={() => { setShowWeighForm(false); refresh(); }} />
              )}
            </div>
          )}

          {/* POD */}
          {(isSeller || isCarrier) && order.status === 'in_transit' && (
            <div className="card card-body">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Proof of Delivery</h2>
                <button onClick={() => setShowPODForm((v) => !v)} className="btn-ghost btn-sm">
                  {showPODForm ? 'Cancel' : 'Submit POD'}
                </button>
              </div>
              {showPODForm && (
                <PODForm orderId={order.id} onSuccess={() => { setShowPODForm(false); refresh(); }} />
              )}
            </div>
          )}

          {/* Review */}
          {order.status === 'completed' && (
            <div className="card card-body">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Leave a Review</h2>
                <button onClick={() => setShowReviewForm((v) => !v)} className="btn-ghost btn-sm">
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </button>
              </div>
              {showReviewForm && isBuyer && order.seller && (
                <ReviewForm
                  orderId={order.id}
                  revieweeId={order.sellerId}
                  revieweeName={order.seller.businessName ?? 'Seller'}
                  role="seller"
                  onSuccess={() => setShowReviewForm(false)}
                />
              )}
              {showReviewForm && isSeller && order.buyer && (
                <ReviewForm
                  orderId={order.id}
                  revieweeId={order.buyerId}
                  revieweeName={order.buyer.businessName ?? 'Buyer'}
                  role="buyer"
                  onSuccess={() => setShowReviewForm(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="card card-body">
            <h2 className="font-semibold text-gray-900 mb-4">Order Progress</h2>
            <OrderTimeline order={order} />
          </div>

          {/* Actions */}
          <div className="card card-body space-y-2">
            <h3 className="font-semibold text-gray-900">Actions</h3>

            {/* Buyer: confirm delivery */}
            {isBuyer && order.status === 'delivered' && (
              <button
                onClick={() => handleStatusUpdate('confirmed')}
                disabled={actionLoading}
                className="btn-primary w-full"
              >
                {actionLoading ? 'Processing…' : 'Confirm Delivery'}
              </button>
            )}

            {/* Seller: mark in transit */}
            {isSeller && order.status === 'paid' && (
              <button
                onClick={() => handleStatusUpdate('in_transit')}
                disabled={actionLoading}
                className="btn-primary w-full"
              >
                {actionLoading ? 'Processing…' : 'Mark as In Transit'}
              </button>
            )}

            {/* Buyer: dispute */}
            {isBuyer && ['delivered', 'confirmed'].includes(order.status) && (
              <button
                onClick={() => {
                  const reason = prompt('Describe the dispute reason:');
                  if (reason) handleStatusUpdate('disputed');
                }}
                disabled={actionLoading}
                className="btn-danger w-full"
              >
                Raise Dispute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
