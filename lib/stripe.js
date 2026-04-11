/**
 * @fileoverview Stripe Connect escrow helpers.
 *
 * Flow:
 *   1. createPaymentIntent()  — buyer pays; funds held by platform
 *   2. capturePaymentIntent() — called when order moves to 'paid'
 *   3. releaseEscrow()        — transfers seller's share on order completion
 *   4. refundPaymentIntent()  — full or partial refund on dispute/cancellation
 *
 * Platform fee: 5% deducted from seller transfer.
 * Stripe Connect type: Express accounts (sellers onboard via hosted flow).
 */

'use strict';

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const PLATFORM_FEE_RATE = 0.05; // 5%

// ─── Payment Intents ─────────────────────────────────────────────────────────

/**
 * Creates a Stripe PaymentIntent for an order.
 * Funds are captured manually (two-step auth + capture).
 *
 * @param {object} params
 * @param {number}  params.amountCents     - Total amount in cents (AUD)
 * @param {string}  params.orderId         - Internal order ID (metadata)
 * @param {string}  params.orderNumber     - Human-readable order number
 * @param {string}  params.buyerEmail      - Buyer email for receipt
 * @param {string}  params.sellerStripeId  - Seller's Stripe Connect account ID
 * @returns {Promise<Stripe.PaymentIntent>}
 */
async function createPaymentIntent({ amountCents, orderId, orderNumber, buyerEmail, sellerStripeId }) {
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);

  const intent = await stripe.paymentIntents.create({
    amount:               amountCents,
    currency:             'aud',
    capture_method:       'manual',          // hold funds, capture later
    payment_method_types: ['card'],
    receipt_email:        buyerEmail,
    application_fee_amount: platformFeeCents,
    transfer_data: sellerStripeId
      ? { destination: sellerStripeId }
      : undefined,
    metadata: {
      orderId,
      orderNumber,
      platform: 'realm-ag-marketplace',
    },
  });

  return intent;
}

/**
 * Captures a previously authorised PaymentIntent (moves funds from hold to captured).
 * Call this when the order status moves to 'paid'.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<Stripe.PaymentIntent>}
 */
async function capturePaymentIntent(paymentIntentId) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Releases escrow by transferring the seller's share.
 * Call this when the order status moves to 'completed'.
 *
 * @param {object} params
 * @param {number}  params.totalAmountCents  - Total order amount in cents
 * @param {string}  params.sellerStripeId    - Seller's Stripe Connect account ID
 * @param {string}  params.orderId           - Internal order ID (metadata)
 * @param {string}  params.orderNumber       - Human-readable order number
 * @returns {Promise<Stripe.Transfer>}
 */
async function releaseEscrow({ totalAmountCents, sellerStripeId, orderId, orderNumber }) {
  if (!sellerStripeId) {
    throw new Error('Seller does not have a Stripe Connect account configured');
  }

  const platformFeeCents  = Math.round(totalAmountCents * PLATFORM_FEE_RATE);
  const sellerAmountCents = totalAmountCents - platformFeeCents;

  const transfer = await stripe.transfers.create({
    amount:      sellerAmountCents,
    currency:    'aud',
    destination: sellerStripeId,
    metadata: {
      orderId,
      orderNumber,
      platformFeePercent: String(PLATFORM_FEE_RATE * 100),
    },
  });

  return transfer;
}

/**
 * Issues a full or partial refund on a PaymentIntent.
 * Call this when an order is disputed or cancelled after payment.
 *
 * @param {object} params
 * @param {string}  params.paymentIntentId
 * @param {number}  [params.amountCents]   - Omit for full refund
 * @param {string}  [params.reason]        - 'duplicate' | 'fraudulent' | 'requested_by_customer'
 * @returns {Promise<Stripe.Refund>}
 */
async function refundPaymentIntent({ paymentIntentId, amountCents, reason = 'requested_by_customer' }) {
  const params = { payment_intent: paymentIntentId, reason };
  if (amountCents) params.amount = amountCents;
  return stripe.refunds.create(params);
}

// ─── Connect Onboarding ──────────────────────────────────────────────────────

/**
 * Creates a Stripe Express Connect account for a seller.
 *
 * @param {object} params
 * @param {string} params.email        - Seller email
 * @param {string} params.businessName - Seller business name
 * @param {string} params.country      - ISO country code (default 'AU')
 * @returns {Promise<Stripe.Account>}
 */
async function createConnectAccount({ email, businessName, country = 'AU' }) {
  return stripe.accounts.create({
    type:         'express',
    country,
    email,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    business_profile: { name: businessName },
  });
}

/**
 * Generates a Stripe Connect onboarding link for a seller.
 *
 * @param {object} params
 * @param {string} params.accountId  - Stripe Connect account ID
 * @param {string} params.refreshUrl - URL to redirect if link expires
 * @param {string} params.returnUrl  - URL to redirect after onboarding
 * @returns {Promise<Stripe.AccountLink>}
 */
async function createOnboardingLink({ accountId, refreshUrl, returnUrl }) {
  return stripe.accountLinks.create({
    account:     accountId,
    refresh_url: refreshUrl,
    return_url:  returnUrl,
    type:        'account_onboarding',
  });
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

/**
 * Constructs and verifies a Stripe webhook event from raw request body.
 *
 * @param {Buffer|string} rawBody    - Raw request body (must not be parsed)
 * @param {string}        signature  - Value of 'stripe-signature' header
 * @returns {Stripe.Event}
 * @throws {Error} If signature verification fails
 */
function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}

/**
 * Converts a dollar amount to cents (integer).
 * @param {number} dollars
 * @returns {number}
 */
function toCents(dollars) {
  return Math.round(dollars * 100);
}

module.exports = {
  stripe,
  createPaymentIntent,
  capturePaymentIntent,
  releaseEscrow,
  refundPaymentIntent,
  createConnectAccount,
  createOnboardingLink,
  constructWebhookEvent,
  toCents,
  PLATFORM_FEE_RATE,
};
