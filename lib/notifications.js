/**
 * @fileoverview Email and SMS notification helpers for order lifecycle events.
 *
 * Email: Uses nodemailer with SMTP (configure SMTP_* env vars).
 *        Falls back to console.log in development.
 * SMS:   Stub — integrate with Twilio, MessageBird or AWS SNS.
 *
 * All functions are fire-and-forget (non-blocking) — they log errors
 * but do not throw, so notification failures never break the main flow.
 */

'use strict';

const nodemailer = require('nodemailer');

// ─── Transport ───────────────────────────────────────────────────────────────

/**
 * Creates a nodemailer transport.
 * In development (no SMTP config), uses ethereal.email test accounts.
 */
function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development: log to console
  return {
    sendMail: async (opts) => {
      console.log('[notifications] Email (dev mode):', JSON.stringify(opts, null, 2));
      return { messageId: 'dev-mode' };
    },
  };
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'REALM Ag Marketplace <noreply@realm.ag>';

// ─── Email Helpers ───────────────────────────────────────────────────────────

/**
 * Sends an email notification. Non-blocking — errors are logged only.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to
 * @param {string}          opts.subject
 * @param {string}          opts.text    - Plain text body
 * @param {string}          [opts.html]  - HTML body (optional)
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const transport = createTransport();
    await transport.sendMail({ from: FROM_ADDRESS, to, subject, text, html });
  } catch (err) {
    console.error('[notifications] Email send failed:', err.message);
  }
}

// ─── SMS Stub ────────────────────────────────────────────────────────────────

/**
 * Sends an SMS notification. Stub — replace with Twilio/MessageBird.
 *
 * @param {object} opts
 * @param {string} opts.to      - E.164 phone number (e.g. '+61400000001')
 * @param {string} opts.message - SMS body (max 160 chars recommended)
 */
async function sendSMS({ to, message }) {
  // TODO: Replace with real SMS provider
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await twilio.messages.create({ from: process.env.TWILIO_FROM, to, body: message });
  console.log(`[notifications] SMS (stub) to ${to}: ${message}`);
}

// ─── Order Notifications ─────────────────────────────────────────────────────

/**
 * Notifies seller that a new offer has been received on their listing.
 *
 * @param {object} params
 * @param {object} params.seller  - { email, businessName, phone }
 * @param {object} params.listing - { title }
 * @param {object} params.offer   - { pricePerUnit, quantity, totalPrice }
 * @param {object} params.buyer   - { businessName }
 */
async function notifyNewOffer({ seller, listing, offer, buyer }) {
  await sendEmail({
    to:      seller.email,
    subject: `New offer on your listing: ${listing.title}`,
    text: [
      `Hi ${seller.businessName},`,
      '',
      `You have received a new offer on "${listing.title}":`,
      `  Buyer:         ${buyer.businessName}`,
      `  Price/unit:    $${offer.pricePerUnit}`,
      `  Quantity:      ${offer.quantity}`,
      `  Total:         $${offer.totalPrice}`,
      '',
      'Log in to REALM Ag Marketplace to review and respond.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });
}

/**
 * Notifies buyer that their offer was accepted.
 *
 * @param {object} params
 * @param {object} params.buyer   - { email, businessName }
 * @param {object} params.listing - { title }
 * @param {object} params.offer   - { totalPrice }
 */
async function notifyOfferAccepted({ buyer, listing, offer }) {
  await sendEmail({
    to:      buyer.email,
    subject: `Your offer was accepted — ${listing.title}`,
    text: [
      `Hi ${buyer.businessName},`,
      '',
      `Great news! Your offer on "${listing.title}" has been accepted.`,
      `Total amount: $${offer.totalPrice}`,
      '',
      'Please log in to complete payment and confirm the order.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });
}

/**
 * Notifies buyer that their offer was rejected.
 *
 * @param {object} params
 * @param {object} params.buyer   - { email, businessName }
 * @param {object} params.listing - { title }
 */
async function notifyOfferRejected({ buyer, listing }) {
  await sendEmail({
    to:      buyer.email,
    subject: `Offer update — ${listing.title}`,
    text: [
      `Hi ${buyer.businessName},`,
      '',
      `Your offer on "${listing.title}" was not accepted this time.`,
      'Browse other listings at REALM Ag Marketplace.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });
}

/**
 * Notifies seller and buyer that an order has been created.
 *
 * @param {object} params
 * @param {object} params.order  - { orderNumber, totalAmount }
 * @param {object} params.buyer  - { email, businessName }
 * @param {object} params.seller - { email, businessName }
 */
async function notifyOrderCreated({ order, buyer, seller }) {
  const subject = `Order ${order.orderNumber} confirmed`;

  await sendEmail({
    to:      buyer.email,
    subject,
    text: [
      `Hi ${buyer.businessName},`,
      '',
      `Your order ${order.orderNumber} has been created.`,
      `Total: $${order.totalAmount}`,
      '',
      'Payment is held in escrow until delivery is confirmed.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });

  await sendEmail({
    to:      seller.email,
    subject,
    text: [
      `Hi ${seller.businessName},`,
      '',
      `Order ${order.orderNumber} has been placed for your listing.`,
      `Total: $${order.totalAmount} (held in escrow)`,
      '',
      'Please arrange delivery and upload proof of delivery.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });
}

/**
 * Notifies relevant parties of an order status change.
 *
 * @param {object} params
 * @param {object} params.order  - { orderNumber, status }
 * @param {object} params.buyer  - { email, businessName, phone }
 * @param {object} params.seller - { email, businessName, phone }
 * @param {object} [params.carrier] - { email, businessName, phone }
 */
async function notifyOrderStatusChange({ order, buyer, seller, carrier }) {
  const statusMessages = {
    paid:            'Payment received — seller can now arrange delivery.',
    in_transit:      'Your order is now in transit.',
    delivered:       'Order marked as delivered — please confirm receipt.',
    confirmed:       'Delivery confirmed — payment will be released to seller.',
    completed:       'Order completed. Payment has been released.',
    disputed:        'A dispute has been raised on this order. Our team will be in touch.',
    refunded:        'A refund has been issued for this order.',
  };

  const message = statusMessages[order.status] || `Order status updated to: ${order.status}`;
  const subject = `Order ${order.orderNumber} — ${order.status.replace(/_/g, ' ')}`;

  const recipients = [buyer, seller, carrier].filter(Boolean);

  for (const recipient of recipients) {
    await sendEmail({
      to:      recipient.email,
      subject,
      text: [
        `Hi ${recipient.businessName},`,
        '',
        `Order ${order.orderNumber}: ${message}`,
        '',
        'Log in to REALM Ag Marketplace for details.',
        '',
        'REALM Ag Marketplace',
      ].join('\n'),
    });

    // SMS for critical status changes
    if (['delivered', 'disputed'].includes(order.status) && recipient.phone) {
      await sendSMS({
        to:      recipient.phone,
        message: `REALM Ag: Order ${order.orderNumber} — ${message}`,
      });
    }
  }
}

/**
 * Notifies carrier that they have been assigned to a freight job.
 *
 * @param {object} params
 * @param {object} params.carrier     - { email, businessName, phone }
 * @param {object} params.freightJob  - { id, materialDesc, pickupAddress, deliveryAddress }
 */
async function notifyCarrierAssigned({ carrier, freightJob }) {
  await sendEmail({
    to:      carrier.email,
    subject: `Freight job assigned — ${freightJob.materialDesc || 'Agricultural materials'}`,
    text: [
      `Hi ${carrier.businessName},`,
      '',
      'You have been assigned a freight job:',
      `  Material:  ${freightJob.materialDesc || 'Agricultural materials'}`,
      `  Pickup:    ${JSON.stringify(freightJob.pickupAddress)}`,
      `  Delivery:  ${JSON.stringify(freightJob.deliveryAddress)}`,
      '',
      'Log in to REALM Ag Marketplace for full details.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });

  if (carrier.phone) {
    await sendSMS({
      to:      carrier.phone,
      message: `REALM Ag: Freight job assigned. Check your dashboard for details.`,
    });
  }
}

/**
 * Notifies buyer that proof of delivery has been submitted.
 *
 * @param {object} params
 * @param {object} params.buyer  - { email, businessName }
 * @param {object} params.order  - { orderNumber }
 */
async function notifyPODSubmitted({ buyer, order }) {
  await sendEmail({
    to:      buyer.email,
    subject: `Delivery evidence submitted — Order ${order.orderNumber}`,
    text: [
      `Hi ${buyer.businessName},`,
      '',
      `Proof of delivery has been submitted for Order ${order.orderNumber}.`,
      'Please log in to review and confirm delivery.',
      '',
      'Once confirmed, payment will be released to the seller.',
      '',
      'REALM Ag Marketplace',
    ].join('\n'),
  });
}

module.exports = {
  sendEmail,
  sendSMS,
  notifyNewOffer,
  notifyOfferAccepted,
  notifyOfferRejected,
  notifyOrderCreated,
  notifyOrderStatusChange,
  notifyCarrierAssigned,
  notifyPODSubmitted,
};
