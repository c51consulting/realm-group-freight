const router = require('express').Router();
const { User, Review, Listing } = require('../models');

// GET /api/users/:id - Public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Listing, as: 'listings', where: { status: 'active' }, required: false }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { businessName, phone, address, abn } = req.body;
    await user.update({ businessName, phone, address, abn });
    res.json(user);
  } catch (err) { next(err); }
});

// GET /api/users/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { revieweeId: req.params.id },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'businessName'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

// POST /api/users/:id/reviews
router.post('/:id/reviews', async (req, res, next) => {
  try {
    const { orderId, reviewerId, rating, comment, role } = req.body;
    const review = await Review.create({ orderId, reviewerId, revieweeId: req.params.id, rating, comment, role });
    // Update user rating
    const user = await User.findByPk(req.params.id);
    const newCount = user.reviewCount + 1;
    const newRating = ((user.rating * user.reviewCount) + rating) / newCount;
    await user.update({ rating: Math.round(newRating * 10) / 10, reviewCount: newCount });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

module.exports = router;
