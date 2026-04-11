/**
 * Stripe payment integration for REALM Ag Marketplace
 * Handles escrow payments, platform fees, and payment release
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export const PLATFORM_FEE_PERCENT = 2.5;
export const ESCROW_HOLD_DAYS = 3;

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  buyerEmail: string;
  orderId: string;
  sellerId: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentResult> {
  const platformFee = Math.round(params.amount * (PLATFORM_FEE_PERCENT / 100));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: 'aud',
    capture_method: 'manual',
    metadata: {
      orderId: params.orderId,
      sellerId: params.sellerId,
      platformFee: platformFee.toString(),
      ...params.metadata,
    },
    receipt_email: params.buyerEmail,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

export async function capturePayment(paymentIntentId: string): Promise<boolean> {
  try {
    await stripe.paymentIntents.capture(paymentIntentId);
    return true;
  } catch (error) {
    console.error('Payment capture failed:', error);
    return false;
  }
}

export async function refundPayment(
  paymentIntentId: string,
  reason?: string
): Promise<boolean> {
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: { reason: reason || 'Dispute refund' },
    });
    return true;
  } catch (error) {
    console.error('Refund failed:', error);
    return false;
  }
}

export async function createConnectedAccount(
  email: string,
  businessName: string
): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'AU',
    email,
    business_profile: { name: businessName },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

export async function createAccountLink(
  accountId: string,
  returnUrl: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return link.url;
}

export { stripe };
