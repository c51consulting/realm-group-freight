/**
 * @fileoverview Offer routes — submit, accept, reject, withdraw.
 */

const router   = require('express').Router();
const { Op }   = require('sequelize');

const { Offer, Listing, User } = require('../models');
const { authenticate }         = require('../middleware/auth');
const { validateOffer }        = require('../../lib/validation');
const {
  notifyNewOffer,
  notifyOfferAccepted,
  notifyOfferRejected,
} = require('../../lib/notifications');

// ─── POST /api/offers ────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      listingId, pricePerUnit, quantity,
      freightIncluded, freightPrice, deliveryDate, message,
    } = req.body;

    const { valid, errors } = validateOffer(req.body);
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    const listing = await Listing.findByPk(listingId, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'email', 'businessName', 'phone'] }],
    });
    if (!listing || listing.status !== 'active') {
      return res.status(400).json({ error: 'Listing is not available for offers' });
    }

    // Sellers cannot offer on their own listing
    if (listing.sellerId === req.user.id) {
      return res.status(403).json({ error: 'You cannot make an offer on your own listing' });
    }

    // Check for existing pending offer from same buyer
    const existingOffer = await Offer.findOne({
      where: { listingId, buyerId: req.user.id, status: 'pending' },
    });
    if (existingOffer) {
      return res.status(409).json({
        error: 'You already have a pending offer on this listing. Withdraw it before submitting a new one.',
        existingOfferId: existingOffer.id,
      });
    }

    const totalPrice = Number(pricePerUnit) * Number(quantity) + Number(freightPrice || 0);

    const offer = await Offer.create({
      listingId,
      buyerId: req.user.id,
      pricePerUnit,
      quantity,
      totalPrice,
      freightIncluded: Boolean(freightIncluded),
      freightPrice:    freightPrice || null,
      deliveryDate:    deliveryDate || null,
      message:         message || null,
    });

    // Notify seller (non-blocking)
    notifyNewOffer({
      seller:  listing.seller,
      listing: { title: listing.title },
      offer:   { pricePerUnit, quantity, totalPrice },
      buyer:   { businessName: req.user.businessName || req.user.email },
    }).catch(() => {});

    res.status(201).json(offer);
  } catch (err) { next(err); }
});

// ─── GET /api/offers/mine ────────────────────────────────────────────────────
// Returns all offers made by the authenticated buyer.
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const offers = await Offer.findAll({
      where:   { buyerId: req.user.id },
      include: [{ model: Listing, attributes: ['id', 'title', 'materialType', 'unitType', 'status'] }],
      order:   [['createdAt', 'DESC']],
    });
    res.json(offers);
  } catch (err) { next(err); }
});

// ─── GET /api/offers/listing/:listingId ─────────────────────────────────────
// Seller can see all offers on their listing; buyers see only their own.
router.get('/listing/:listingId', authenticate, async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const isSeller = listing.sellerId === req.user.id;
    const isAdmin  = req.user.role === 'admin';

    const where = { listingId: req.params.listingId };
    if (!isSeller && !isAdmin) {
      // Buyers can only see their own offers
      where.buyerId = req.user.id;
    }

    const offers = await Offer.findAll({
      where,
      include: [{ model: User, as: 'buyer', attributes: ['id', 'businessName', 'rating', 'verified'] }],
      order:   [['createdAt', 'DESC']],
    });

    res.json(offers);
  } catch (err) { next(err); }
});

// ─── GET /api/offers/:id ─────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [
        { model: User,    as: 'buyer',   attributes: ['id', 'businessName', 'rating', 'verified'] },
        { model: Listing, attributes: ['id', 'title', 'materialType', 'sellerId'] },
      ],
    });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    // Only buyer, listing seller, or admin can view
    const isBuyer  = offer.buyerId === req.user.id;
    const isSeller = offer.Listing && offer.Listing.sellerId === req.user.id;
    if (!isBuyer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(offer);
  } catch (err) { next(err); }
});

// ─── PUT /api/offers/:id/accept ──────────────────────────────────────────────
// Only the listing's seller can accept an offer.
router.put('/:id/accept', authenticate, async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ model: Listing, include: [{ model: User, as: 'seller' }] }],
    });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const listing = offer.Listing;
    if (!listing) return res.status(404).json({ error: 'Associated listing not found' });

    // Auth: only seller or admin
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the listing seller can accept offers' });
    }

    if (offer.status !== 'pending') {
      return res.status(409).json({ error: `Cannot accept an offer with status '${offer.status}'` });
    }

    // Accept this offer
    await offer.update({ status: 'accepted' });

    // Auto-reject all other pending offers on the same listing
    await Offer.update(
      { status: 'rejected' },
      { where: { listingId: offer.listingId, id: { [Op.ne]: offer.id }, status: 'pending' } },
    );

    // Pause the listing (no more offers while order is being created)
    await listing.update({ status: 'paused' });

    // Notify buyer (non-blocking)
    const buyer = await User.findByPk(offer.buyerId, { attributes: ['email', 'businessName'] });
    if (buyer) {
      notifyOfferAccepted({
        buyer,
        listing: { title: listing.title },
        offer:   { totalPrice: offer.totalPrice },
      }).catch(() => {});
    }

    res.json(offer);
  } catch (err) { next(err); }
});

// ─── PUT /api/offers/:id/reject ──────────────────────────────────────────────
router.put('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ model: Listing }],
    });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const listing = offer.Listing;
    if (listing && listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the listing seller can reject offers' });
    }

    if (!['pending'].includes(offer.status)) {
      return res.status(409).json({ error: `Cannot reject an offer with status '${offer.status}'` });
    }

    await offer.update({ status: 'rejected' });

    // Notify buyer (non-blocking)
    const buyer = await User.findByPk(offer.buyerId, { attributes: ['email', 'businessName'] });
    if (buyer && listing) {
      notifyOfferRejected({ buyer, listing: { title: listing.title } }).catch(() => {});
    }

    res.json(offer);
  } catch (err) { next(err); }
});

// ─── PUT /api/offers/:id/withdraw ────────────────────────────────────────────
// Only the buyer who made the offer can withdraw it.
router.put('/:id/withdraw', authenticate, async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    if (offer.buyerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the offer creator can withdraw it' });
    }

    if (!['pending'].includes(offer.status)) {
      return res.status(409).json({ error: `Cannot withdraw an offer with status '${offer.status}'` });
    }

    await offer.update({ status: 'withdrawn' });
    res.json(offer);
  } catch (err) { next(err); }
});

module.exports = router;

