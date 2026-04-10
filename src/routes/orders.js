const router = require('express').Router();
const { Order, Offer, Listing, User, WeighbridgeEvent } = require('../models');
const { v4: uuidv4 } = require('uuid');

// POST /api/orders - Create order from accepted offer
router.post('/', async (req, res, next) => {
  try {
    const { offerId } = req.body;
    const offer = await Offer.findByPk(offerId, { include: [{ model: Listing }] });
    if (!offer || offer.status !== 'accepted') return res.status(400).json({ error: 'Offer not accepted' });
    const platformFee = offer.totalPrice * 0.05;
    const order = await Order.create({
      orderNumber: `RA-${Date.now().toString(36).toUpperCase()}`,
      offerId: offer.id,
      listingId: offer.listingId,
      buyerId: offer.buyerId,
      sellerId: offer.Listing.sellerId,
      totalAmount: offer.totalPrice,
      freightAmount: offer.freightPrice || 0,
      platformFee,
      qualityAssuranceLevel: offer.Listing.qualityLevel
    });
    res.status(201).json(order);
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'businessName', 'phone'] },
        { model: User, as: 'seller', attributes: ['id', 'businessName', 'phone'] },
        { model: User, as: 'carrier', attributes: ['id', 'businessName', 'phone'] },
        { model: Listing },
        { model: WeighbridgeEvent, as: 'weighEvents' }
      ]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
});

// PUT /api/orders/:id/status
router.put('/:id/status', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const { status, deliveryEvidence, disputeReason } = req.body;
    const updates = { status };
    if (deliveryEvidence) updates.deliveryEvidence = deliveryEvidence;
    if (disputeReason) updates.disputeReason = disputeReason;
    if (status === 'confirmed') updates.confirmedAt = new Date();
    if (status === 'completed') updates.paymentReleasedAt = new Date();
    await order.update(updates);
    res.json(order);
  } catch (err) { next(err); }
});

// GET /api/orders/user/:userId
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const orders = await Order.findAll({
      where: { [Op.or]: [{ buyerId: req.params.userId }, { sellerId: req.params.userId }, { carrierId: req.params.userId }] },
      include: [{ model: Listing, attributes: ['title', 'materialType', 'unitType'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) { next(err); }
});

module.exports = router;
