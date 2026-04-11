/**
 * @fileoverview Listing routes — CRUD, search, publish/pause.
 */

const router   = require('express').Router();
const { Op }   = require('sequelize');

const { Listing, User, FeedTest, Offer } = require('../models');
const { authenticate, optionalAuth }     = require('../middleware/auth');
const { validateListing }                = require('../../lib/validation');
const { calcPricePerTonneEquiv }         = require('../../lib/quality');

// ─── GET /api/listings ───────────────────────────────────────────────────────
// Public — search & filter active listings.
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      materialType, type, unitType, minPrice, maxPrice,
      qualityLevel, pricingType, search,
      page = 1, limit = 20,
    } = req.query;

    const where = { status: 'active' };

    if (materialType) where.materialType = materialType;
    if (type)         where.type         = type;
    if (unitType)     where.unitType     = unitType;
    if (qualityLevel) where.qualityLevel = qualityLevel;
    if (pricingType)  where.pricingType  = pricingType;

    if (minPrice || maxPrice) {
      where.pricePerUnit = {};
      if (minPrice) where.pricePerUnit[Op.gte] = Number(minPrice);
      if (maxPrice) where.pricePerUnit[Op.lte] = Number(maxPrice);
    }

    if (search) {
      where[Op.or] = [
        { title:           { [Op.iLike]: `%${search}%` } },
        { description:     { [Op.iLike]: `%${search}%` } },
        { materialSubtype: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pageNum  = Math.max(1, Number(page));
    const pageSize = Math.min(Math.max(1, Number(limit)), 50);

    const { rows, count } = await Listing.findAndCountAll({
      where,
      include: [
        {
          model:      User,
          as:         'seller',
          attributes: ['id', 'businessName', 'rating', 'reviewCount', 'verified'],
        },
        {
          model: FeedTest,
          as:    'feedTests',
          attributes: ['id', 'source', 'afiaGrade', 'rfv', 'crudeProtein', 'testDate', 'verified'],
        },
      ],
      order:  [['createdAt', 'DESC']],
      limit:  pageSize,
      offset: (pageNum - 1) * pageSize,
    });

    res.json({
      listings:   rows,
      total:      count,
      page:       pageNum,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (err) { next(err); }
});

// ─── GET /api/listings/mine ──────────────────────────────────────────────────
// Returns all listings for the authenticated seller (all statuses).
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const listings = await Listing.findAll({
      where:   { sellerId: req.user.id },
      include: [{ model: FeedTest, as: 'feedTests' }],
      order:   [['createdAt', 'DESC']],
    });
    res.json(listings);
  } catch (err) { next(err); }
});

// ─── GET /api/listings/:id ───────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [
        {
          model:      User,
          as:         'seller',
          attributes: ['id', 'businessName', 'phone', 'rating', 'reviewCount', 'verified', 'address'],
        },
        { model: FeedTest, as: 'feedTests' },
        {
          model:      Offer,
          as:         'offers',
          attributes: ['id', 'status', 'pricePerUnit', 'quantity', 'createdAt'],
          // Only show offer counts to non-owners; full list to seller
        },
      ],
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Non-owners can't see draft/cancelled listings
    const isOwner = req.user && req.user.id === listing.sellerId;
    if (!isOwner && !['active', 'paused'].includes(listing.status)) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (err) { next(err); }
});

// ─── POST /api/listings ──────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      materialType, type, unitType, title, description,
      pricePerUnit, quantityAvailable, minimumOrder,
      estimatedWeightPerUnit, pricingType, freightIncluded,
      deliveryRadius, pickupAddress, pickupLat, pickupLng,
      loadingAvailable, qualityLevel, materialSubtype,
      unitLabel, expiresAt, images,
    } = req.body;

    const { valid, errors } = validateListing(req.body, false);
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    const pricePerTonneEquiv = calcPricePerTonneEquiv(pricePerUnit, estimatedWeightPerUnit);

    const listing = await Listing.create({
      sellerId: req.user.id,
      materialType, type, unitType, title, description,
      pricePerUnit, pricePerTonneEquiv, quantityAvailable, minimumOrder,
      estimatedWeightPerUnit, pricingType,
      freightIncluded: Boolean(freightIncluded),
      deliveryRadius, pickupAddress, pickupLat, pickupLng,
      loadingAvailable: Boolean(loadingAvailable),
      qualityLevel: qualityLevel || 'basic',
      materialSubtype, unitLabel, expiresAt,
      images: images || [],
      status: 'draft',
    });

    res.status(201).json(listing);
  } catch (err) { next(err); }
});

// ─── PUT /api/listings/:id ───────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Only owner or admin can update
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Cannot edit a sold/completed listing
    if (['sold', 'expired'].includes(listing.status)) {
      return res.status(409).json({ error: `Cannot edit a ${listing.status} listing` });
    }

    const { valid, errors } = validateListing(req.body, true);
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    // Recalculate tonne equiv if price or weight changed
    const pricePerUnit           = req.body.pricePerUnit           ?? listing.pricePerUnit;
    const estimatedWeightPerUnit = req.body.estimatedWeightPerUnit ?? listing.estimatedWeightPerUnit;
    const pricePerTonneEquiv     = calcPricePerTonneEquiv(pricePerUnit, estimatedWeightPerUnit);

    await listing.update({ ...req.body, pricePerTonneEquiv });
    res.json(listing);
  } catch (err) { next(err); }
});

// ─── PUT /api/listings/:id/publish ──────────────────────────────────────────
router.put('/:id/publish', authenticate, async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!['draft', 'paused'].includes(listing.status)) {
      return res.status(409).json({ error: `Cannot publish a ${listing.status} listing` });
    }

    await listing.update({ status: 'active' });
    res.json(listing);
  } catch (err) { next(err); }
});

// ─── PUT /api/listings/:id/pause ────────────────────────────────────────────
router.put('/:id/pause', authenticate, async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (listing.status !== 'active') {
      return res.status(409).json({ error: 'Only active listings can be paused' });
    }

    await listing.update({ status: 'paused' });
    res.json(listing);
  } catch (err) { next(err); }
});

// ─── DELETE /api/listings/:id ────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Soft-delete: mark as cancelled
    await listing.update({ status: 'cancelled' });
    res.json({ message: 'Listing cancelled', id: listing.id });
  } catch (err) { next(err); }
});

module.exports = router;

