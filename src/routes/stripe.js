/**
 * @fileoverview Stripe webhook handler.
 *
 * Handles payment lifecycle events from Stripe:
 *   - payment_intent.succeeded       → mark order as paid
 *   - payment_intent.payment_failed  → notify buyer
 *   - transfer.created               → log escrow release
 *   - account.updated                → sync Connect account status
 *
 * IMPORTANT: This route must receive the raw (unparsed) request body.
 * Mount it BEFORE express.json() middleware, or use express.raw() here.
 */

'use strict';

const router = require('express').Router();
const { Order, User } = require('../models');
const { constructWebhookEvent } = require('../../lib/stripe');
const { notifyOrderStatusChange } = require('../../lib/notifications');

// ─── POST /api/stripe/webhook ────────────────────────────────────────────────
// Stripe sends events here. Signature verified via STRIPE_WEBHOOK_SECRET.
router.post(
  '/webhook',
  // express.raw() is applied in server.js for this route
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (err) {
      console.error('[stripe/webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    console.log(`[stripe/webhook] Received event: ${event.type} (${event.id})`);

    try {
      await handleStripeEvent(event);
    } catch (err) {
      console.error(`[stripe/webhook] Handler error for ${event.type}:`, err.message);
      // Return 200 to prevent Stripe retrying — log the error for investigation
    }

    // Always return 200 to acknowledge receipt
    res.json({ received: true, eventId: event.id });
  },
);

// ─── Event Handlers ──────────────────────────────────────────────────────────

/**
 * Routes a Stripe event to the appropriate handler.
 * @param {import('stripe').Stripe.Event} event
 */
async function handleStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await onPaymentIntentSucceeded(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await onPaymentIntentFailed(event.data.object);
      break;

    case 'payment_intent.canceled':
      await onPaymentIntentCanceled(event.data.object);
      break;

    case 'transfer.created':
      await onTransferCreated(event.data.object);
      break;

    case 'account.updated':
      await onAccountUpdated(event.data.object);
      break;

    default:
      console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
  }
}

/**
 * PaymentIntent succeeded — funds captured.
 * Update order status to 'paid'.
 * @param {import('stripe').Stripe.PaymentIntent} intent
 */
async function onPaymentIntentSucceeded(intent) {
  const order = await Order.findOne({
    where: { stripePaymentIntentId: intent.id },
    include: [
      { model: User, as: 'buyer',  attributes: ['id', 'email', 'businessName', 'phone'] },
      { model: User, as: 'seller', attributes: ['id', 'email', 'businessName', 'phone'] },
    ],
  });

  if (!order) {
    console.warn(`[stripe/webhook] No order found for PaymentIntent ${intent.id}`);
    return;
  }

  if (order.status === 'pending_payment') {
    await order.update({ status: 'paid', paymentHeld: true });

    notifyOrderStatusChange({
      order:  { orderNumber: order.orderNumber, status: 'paid' },
      buyer:  order.buyer,
      seller: order.seller,
    }).catch(() => {});

    console.log(`[stripe/webhook] Order ${order.orderNumber} marked as paid`);
  }
}

/**
 * PaymentIntent failed — notify buyer.
 * @param {import('stripe').Stripe.PaymentIntent} intent
 */
async function onPaymentIntentFailed(intent) {
  const order = await Order.findOne({
    where: { stripePaymentIntentId: intent.id },
    include: [{ model: User, as: 'buyer', attributes: ['id', 'email', 'businessName'] }],
  });

  if (!order) return;

  console.warn(`[stripe/webhook] Payment failed for order ${order.orderNumber}`);

  // Optionally notify buyer via email
  const { sendEmail } = require('../../lib/notifications');
  if (order.buyer) {
    sendEmail({
      to:      order.buyer.email,
      subject: `Payment failed — Order ${order.orderNumber}`,
      text: [
        `Hi ${order.buyer.businessName},`,
        '',
        `Your payment for Order ${order.orderNumber} was unsuccessful.`,
        'Please log in and retry payment.',
        '',
        'REALM Ag Marketplace',
      ].join('\n'),
    }).catch(() => {});
  }
}

/**
 * PaymentIntent canceled.
 * @param {import('stripe').Stripe.PaymentIntent} intent
 */
async function onPaymentIntentCanceled(intent) {
  const order = await Order.findOne({ where: { stripePaymentIntentId: intent.id } });
  if (!order) return;

  console.log(`[stripe/webhook] PaymentIntent canceled for order ${order.orderNumber}`);
  // Status update handled by application layer (refunded/cancelled flow)
}

/**
 * Transfer created — escrow released to seller.
 * @param {import('stripe').Stripe.Transfer} transfer
 */
async function onTransferCreated(transfer) {
  const orderId = transfer.metadata && transfer.metadata.orderId;
  if (!orderId) return;

  const order = await Order.findByPk(orderId);
  if (!order) return;

  await order.update({
    stripeTransferId:  transfer.id,
    paymentReleasedAt: new Date(),
    paymentHeld:       false,
  });

  console.log(`[stripe/webhook] Escrow released for order ${order.orderNumber} — transfer ${transfer.id}`);
}

/**
 * Stripe Connect account updated — sync verification status.
 * @param {import('stripe').Stripe.Account} account
 */
async function onAccountUpdated(account) {
  const user = await User.findOne({ where: { stripeAccountId: account.id } });
  if (!user) return;

  // Mark user as verified if Stripe account is fully onboarded
  const isVerified = account.details_submitted && account.charges_enabled;
  if (isVerified && !user.verified) {
    await user.update({ verified: true });
    console.log(`[stripe/webhook] User ${user.email} verified via Stripe Connect`);
  }
}

module.exports = router;
