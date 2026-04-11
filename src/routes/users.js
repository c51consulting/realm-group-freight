/**
 * @fileoverview User routes — public profiles, reviews, ratings.
 */

const router = require('express').Router();

const { User, Review, Listing, Order } = require('../models');
const { authenticate, optionalAuth }   = require('../middleware/auth');
const { validateReview }               = require('../../lib/validation');

// ─── GET /api/users/:id ──────────────────────────────────────────────────────
// Public profile — active listings included.
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash', 'stripeAccountId'] },
      include: [{
        model:    Listing,
        as:       'listings',
        where:    { status: 'active' },
        required: false,
        attributes: ['id', 'title', 'materialType', 'unitType', 'pricePerUnit', 'qualityLevel', 'createdAt'],
      }],
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// ─── PUT /api/users/:id ──────────────────────────────────────────────────────
// Self or admin only.
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { businessName, phone, address, abn, lat, lng } = req.body;
    await user.update({ businessName, phone, address, abn, lat, lng });

    const safe = user.toJSON();
    delete safe.passwordHash;
    delete safe.stripeAccountId;
    res.json(safe);
  } catch (err) { next(err); }
});

// ─── GET /api/users/:id/reviews ──────────────────────────────────────────────
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where:   { revieweeId: req.params.id },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'businessName'] }],
      order:   [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

// ─── POST /api/users/:id/reviews ─────────────────────────────────────────────
// Authenticated — can only review after a completed order.
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const revieweeId = req.params.id;
    const reviewerId = req.user.id;

    if (reviewerId === revieweeId) {
      return res.status(400).json({ error: 'You cannot review yourself' });
    }

    const { orderId, rating, comment, role } = req.body;

    const { valid, errors } = validateReview({ orderId, revieweeId, rating });
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    // Verify order is completed and reviewer is a participant
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted after order completion' });
    }

    const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(reviewerId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You must be an order participant to leave a review' });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ where: { orderId, reviewerId, revieweeId } });
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this user for this order' });
    }

    const review = await Review.create({
      orderId,
      reviewerId,
      revieweeId,
      rating: Number(rating),
      comment: comment || null,
      role:    role    || null,
    });

    // Rolling average is maintained by DB trigger (update_user_rating)
    // Fetch updated user for response
    const updatedUser = await User.findByPk(revieweeId, {
      attributes: ['id', 'rating', 'reviewCount'],
    });

    res.status(201).json({ review, userRating: updatedUser });
  } catch (err) { next(err); }
});

module.exports = router;

