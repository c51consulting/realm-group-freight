/**
 * @fileoverview Order routes — create from offer, status transitions, escrow.
 *
 * Order status flow:
 *   pending_payment → paid → in_transit → delivered → confirmed → completed
 *                                                    ↘ disputed → refunded
 */

const router = require('express').Router();
const { Op } = require('sequelize');

const { Order, Offer, Listing, User, WeighbridgeEvent } = require('../models');
const { authenticate }        = require('../middleware/auth');
const { validateOrderStatus } = require('../../lib/validation');
const {
  createPaymentIntent,
  capturePaymentIntent,
  releaseEscrow,
  refundPaymentIntent,
  toCents,
} = require('../../lib/stripe');
const {
  notifyOrderCreated,
  notifyOrderStatusChange,
} = require('../../lib/notifications');

// Valid status transitions (from → allowed nexts)
const STATUS_TRANSITIONS = {
  pending_payment: ['paid'],
  paid:            ['in_transit'],
  in_transit:      ['delivered'],
  delivered:       ['confirmed', 'disputed'],
  confirmed:       ['completed'],
  disputed:        ['refunded', 'completed'],
  refunded:        [],
  completed:       [],
};

// ─── POST /api/orders ────────────────────────────────────────────────────────
// Creates an order from an accepted offer and initialises a Stripe PaymentIntent.
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { offerId } = req.body;
    if (!offerId) return res.status(400).json({ error: 'offerId is required' });

    const offer = await Offer.findByPk(offerId, {
      include: [{ model: Listing }],
    });

    if (!offer)                       return res.status(404).json({ error: 'Offer not found' });
    if (offer.status !== 'accepted')  return res.status(400).json({ error: 'Offer must be accepted before creating an order' });
    if (offer.buyerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the offer buyer can create an order' });
    }

    // Prevent duplicate orders for the same offer
    const existing = await Order.findOne({ where: { offerId } });
    if (existing) return res.status(409).json({ error: 'An order already exists for this offer', orderId: existing.id });

    const listing     = offer.Listing;
    const platformFee = Math.round(offer.totalPrice * 0.05 * 100) / 100;
    const orderNumber = `RA-${Date.now().toString(36).toUpperCase()}`;

    // Fetch seller for Stripe account
    const seller = await User.findByPk(listing.sellerId, { attributes: ['id', 'email', 'businessName', 'stripeAccountId'] });
    const buyer  = await User.findByPk(offer.buyerId,    { attributes: ['id', 'email', 'businessName'] });

    // Create Stripe PaymentIntent (manual capture — funds held)
    let stripePaymentIntentId = null;
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const intent = await createPaymentIntent({
          amountCents:    toCents(offer.totalPrice),
          orderId:        'pending',   // updated after order created
          orderNumber,
          buyerEmail:     buyer.email,
          sellerStripeId: seller.stripeAccountId,
        });
        stripePaymentIntentId = intent.id;
      } catch (stripeErr) {
        console.error('[orders] Stripe PaymentIntent creation failed:', stripeErr.message);
        // Continue — payment can be retried
      }
    }

    const order = await Order.create({
      orderNumber,
      offerId:               offer.id,
      listingId:             offer.listingId,
      buyerId:               offer.buyerId,
      sellerId:              listing.sellerId,
      totalAmount:           offer.totalPrice,
      freightAmount:         offer.freightPrice || 0,
      platformFee,
      qualityAssuranceLevel: listing.qualityLevel,
      stripePaymentIntentId,
      status:                'pending_payment',
    });

    // Notify both parties (non-blocking)
    notifyOrderCreated({ order, buyer, seller }).catch(() => {});

    res.status(201).json(order);
  } catch (err) { next(err); }
});

// ─── GET /api/orders/mine ────────────────────────────────────────────────────
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: {
        [Op.or]: [
          { buyerId:   req.user.id },
          { sellerId:  req.user.id },
          { carrierId: req.user.id },
        ],
      },
      include: [{ model: Listing, attributes: ['title', 'materialType', 'unitType'] }],
      order:   [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) { next(err); }
});

// ─── GET /api/orders/:id ─────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer',   attributes: ['id', 'businessName', 'phone', 'email'] },
        { model: User, as: 'seller',  attributes: ['id', 'businessName', 'phone', 'email'] },
        { model: User, as: 'carrier', attributes: ['id', 'businessName', 'phone', 'email'] },
        { model: Listing },
        { model: WeighbridgeEvent, as: 'weighEvents' },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only participants or admin can view
    const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(order);
  } catch (err) { next(err); }
});

// ─── PUT /api/orders/:id/status ──────────────────────────────────────────────
router.put('/:id/status', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer',   attributes: ['id', 'email', 'businessName', 'phone'] },
        { model: User, as: 'seller',  attributes: ['id', 'email', 'businessName', 'phone', 'stripeAccountId'] },
        { model: User, as: 'carrier', attributes: ['id', 'email', 'businessName', 'phone'] },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Auth: only participants or admin
    const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status, deliveryEvidence, disputeReason } = req.body;

    const { valid, errors } = validateOrderStatus({ status });
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    // Enforce state machine
    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        error:   `Cannot transition from '${order.status}' to '${status}'`,
        allowed,
      });
    }

    const updates = { status };
    if (deliveryEvidence) updates.deliveryEvidence = deliveryEvidence;
    if (disputeReason)    updates.disputeReason    = disputeReason;
    if (status === 'confirmed') updates.confirmedAt = new Date();

    // ── Stripe side-effects ──────────────────────────────────────────────────
    if (process.env.STRIPE_SECRET_KEY && order.stripePaymentIntentId) {
      try {
        if (status === 'paid') {
          // Capture the held funds
          await capturePaymentIntent(order.stripePaymentIntentId);
          updates.paymentHeld = true;
        }

        if (status === 'completed' && order.seller && order.seller.stripeAccountId) {
          // Release escrow — transfer seller's share
          const transfer = await releaseEscrow({
            totalAmountCents: toCents(order.totalAmount),
            sellerStripeId:   order.seller.stripeAccountId,
            orderId:          order.id,
            orderNumber:      order.orderNumber,
          });
          updates.stripeTransferId    = transfer.id;
          updates.paymentReleasedAt   = new Date();
          updates.paymentHeld         = false;
        }

        if (status === 'refunded') {
          await refundPaymentIntent({
            paymentIntentId: order.stripePaymentIntentId,
            reason:          'requested_by_customer',
          });
          updates.paymentHeld = false;
        }
      } catch (stripeErr) {
        console.error('[orders] Stripe operation failed:', stripeErr.message);
        // Log but don't block the status update
      }
    }

    await order.update(updates);

    // Notify participants (non-blocking)
    notifyOrderStatusChange({
      order:   { orderNumber: order.orderNumber, status },
      buyer:   order.buyer,
      seller:  order.seller,
      carrier: order.carrier,
    }).catch(() => {});

    res.json(order);
  } catch (err) { next(err); }
});

// ─── PUT /api/orders/:id/assign-carrier ─────────────────────────────────────
router.put('/:id/assign-carrier', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only seller or admin can assign a carrier
    if (order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the seller can assign a carrier' });
    }

    const { carrierId } = req.body;
    if (!carrierId) return res.status(400).json({ error: 'carrierId is required' });

    const carrier = await User.findByPk(carrierId);
    if (!carrier || carrier.role !== 'carrier') {
      return res.status(400).json({ error: 'Invalid carrier ID' });
    }

    await order.update({ carrierId });
    res.json(order);
  } catch (err) { next(err); }
});

// ─── GET /api/orders/user/:userId ────────────────────────────────────────────
// Admin or self only.
router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const orders = await Order.findAll({
      where: {
        [Op.or]: [
          { buyerId:   req.params.userId },
          { sellerId:  req.params.userId },
          { carrierId: req.params.userId },
        ],
      },
      include: [{ model: Listing, attributes: ['title', 'materialType', 'unitType'] }],
      order:   [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (err) { next(err); }
});

module.exports = router;

