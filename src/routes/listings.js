const router = require('express').Router();
const { Listing, User, FeedTest, Offer } = require('../models');
const { Op } = require('sequelize');

// GET /api/listings - Search & filter listings
router.get('/', async (req, res, next) => {
  try {
    const { materialType, type, unitType, minPrice, maxPrice, lat, lng, radius, qualityLevel, pricingType, page = 1, limit = 20 } = req.query;
    const where = { status: 'active' };
    if (materialType) where.materialType = materialType;
    if (type) where.type = type;
    if (unitType) where.unitType = unitType;
    if (qualityLevel) where.qualityLevel = qualityLevel;
    if (pricingType) where.pricingType = pricingType;
    if (minPrice || maxPrice) {
      where.pricePerUnit = {};
      if (minPrice) where.pricePerUnit[Op.gte] = minPrice;
      if (maxPrice) where.pricePerUnit[Op.lte] = maxPrice;
    }
    const listings = await Listing.findAndCountAll({
      where,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'businessName', 'rating', 'reviewCount', 'verified'] },
        { model: FeedTest, as: 'feedTests' }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(limit, 50),
      offset: (page - 1) * limit
    });
    res.json({ listings: listings.rows, total: listings.count, page: Number(page), totalPages: Math.ceil(listings.count / limit) });
  } catch (err) { next(err); }
});

// GET /api/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [
        { model: User, as: 'seller', attributes: ['id', 'businessName', 'phone', 'rating', 'reviewCount', 'verified', 'address'] },
        { model: FeedTest, as: 'feedTests' },
        { model: Offer, as: 'offers', attributes: ['id', 'status', 'pricePerUnit', 'quantity', 'createdAt'] }
      ]
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
});

// POST /api/listings
router.post('/', async (req, res, next) => {
  try {
    const { materialType, type, unitType, title, description, pricePerUnit, quantityAvailable, minimumOrder, estimatedWeightPerUnit, pricingType, freightIncluded, deliveryRadius, pickupAddress, loadingAvailable, qualityLevel, materialSubtype, unitLabel, expiresAt } = req.body;
    // Auto-calc tonne equivalent
    let pricePerTonneEquiv = null;
    if (pricePerUnit && estimatedWeightPerUnit) {
      pricePerTonneEquiv = (pricePerUnit / estimatedWeightPerUnit) * 1000;
    }
    const listing = await Listing.create({
      sellerId: req.body.userId,
      materialType, type, unitType, title, description, pricePerUnit, pricePerTonneEquiv, quantityAvailable, minimumOrder, estimatedWeightPerUnit, pricingType, freightIncluded, deliveryRadius, pickupAddress, loadingAvailable, qualityLevel, materialSubtype, unitLabel, expiresAt
    });
    res.status(201).json(listing);
  } catch (err) { next(err); }
});

// PUT /api/listings/:id
router.put('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    await listing.update(req.body);
    res.json(listing);
  } catch (err) { next(err); }
});

// DELETE /api/listings/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    await listing.update({ status: 'cancelled' });
    res.json({ message: 'Listing cancelled' });
  } catch (err) { next(err); }
});

module.exports = router;
