const router = require('express').Router();
const { Offer, Listing, User } = require('../models');

// POST /api/offers - Submit offer on a listing
router.post('/', async (req, res, next) => {
  try {
    const { listingId, buyerId, pricePerUnit, quantity, freightIncluded, freightPrice, deliveryDate, message } = req.body;
    const listing = await Listing.findByPk(listingId);
    if (!listing || listing.status !== 'active') return res.status(400).json({ error: 'Listing not available' });
    const totalPrice = pricePerUnit * quantity + (freightPrice || 0);
    const offer = await Offer.create({ listingId, buyerId, pricePerUnit, quantity, totalPrice, freightIncluded, freightPrice, deliveryDate, message });
    res.status(201).json(offer);
  } catch (err) { next(err); }
});

// GET /api/offers/listing/:listingId
router.get('/listing/:listingId', async (req, res, next) => {
  try {
    const offers = await Offer.findAll({
      where: { listingId: req.params.listingId },
      include: [{ model: User, as: 'buyer', attributes: ['id', 'businessName', 'rating', 'verified'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(offers);
  } catch (err) { next(err); }
});

// PUT /api/offers/:id/accept
router.put('/:id/accept', async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    await offer.update({ status: 'accepted' });
    // Reject other pending offers on same listing
    await Offer.update({ status: 'rejected' }, { where: { listingId: offer.listingId, id: { [require('sequelize').Op.ne]: offer.id }, status: 'pending' } });
    res.json(offer);
  } catch (err) { next(err); }
});

// PUT /api/offers/:id/reject
router.put('/:id/reject', async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    await offer.update({ status: 'rejected' });
    res.json(offer);
  } catch (err) { next(err); }
});

// PUT /api/offers/:id/withdraw
router.put('/:id/withdraw', async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    await offer.update({ status: 'withdrawn' });
    res.json(offer);
  } catch (err) { next(err); }
});

module.exports = router;
