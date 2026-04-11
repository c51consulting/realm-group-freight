/**
 * @fileoverview Freight job routes — post, browse, assign carrier, update status.
 *
 * Freight jobs can be:
 *   - Standalone: posted by any user needing transport
 *   - Order-linked: created automatically when an order needs a carrier
 */

const router = require('express').Router();

const { FreightJob, User, Order } = require('../models');
const { authenticate }            = require('../middleware/auth');
const { validateFreightJob }      = require('../../lib/validation');
const { notifyCarrierAssigned }   = require('../../lib/notifications');

// ─── POST /api/freight ───────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      orderId, pickupAddress, pickupLat, pickupLng,
      deliveryAddress, deliveryLat, deliveryLng,
      materialType, materialDesc, weightKg, volumeM3,
      requiredBy, priceOffered, notes,
    } = req.body;

    const { valid, errors } = validateFreightJob(req.body);
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    // If linked to an order, verify the user is the seller
    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the order seller can create a linked freight job' });
      }
    }

    const job = await FreightJob.create({
      orderId:         orderId || null,
      postedBy:        req.user.id,
      status:          'open',
      pickupAddress,
      pickupLat:       pickupLat   || null,
      pickupLng:       pickupLng   || null,
      deliveryAddress,
      deliveryLat:     deliveryLat || null,
      deliveryLng:     deliveryLng || null,
      materialType:    materialType || null,
      materialDesc:    materialDesc || null,
      weightKg:        weightKg    || null,
      volumeM3:        volumeM3    || null,
      requiredBy:      requiredBy  || null,
      priceOffered:    priceOffered || null,
      notes:           notes       || null,
    });

    res.status(201).json(job);
  } catch (err) { next(err); }
});

// ─── GET /api/freight ────────────────────────────────────────────────────────
// Browse open freight jobs (carriers looking for work).
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const pageSize = Math.min(Math.max(1, Number(limit)), 50);

    const where = {};
    if (status) where.status = status;

    // Non-admins only see open jobs or their own
    if (req.user.role !== 'admin') {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { status:    'open' },
        { postedBy:  req.user.id },
        { carrierId: req.user.id },
      ];
    }

    const { rows, count } = await FreightJob.findAndCountAll({
      where,
      include: [
        { model: User, as: 'poster',  foreignKey: 'postedBy',  attributes: ['id', 'businessName', 'rating'] },
        { model: User, as: 'carrier', foreignKey: 'carrierId', attributes: ['id', 'businessName', 'rating'] },
      ],
      order:  [['createdAt', 'DESC']],
      limit:  pageSize,
      offset: (pageNum - 1) * pageSize,
    });

    res.json({ jobs: rows, total: count, page: pageNum, totalPages: Math.ceil(count / pageSize) });
  } catch (err) { next(err); }
});

// ─── GET /api/freight/:id ────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const job = await FreightJob.findByPk(req.params.id, {
      include: [
        { model: User, as: 'poster',  foreignKey: 'postedBy',  attributes: ['id', 'businessName', 'phone', 'rating'] },
        { model: User, as: 'carrier', foreignKey: 'carrierId', attributes: ['id', 'businessName', 'phone', 'rating'] },
      ],
    });

    if (!job) return res.status(404).json({ error: 'Freight job not found' });

    // Open jobs visible to all; others only to participants
    const isParticipant = [job.postedBy, job.carrierId].includes(req.user.id);
    if (job.status !== 'open' && !isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(job);
  } catch (err) { next(err); }
});

// ─── PUT /api/freight/:id ────────────────────────────────────────────────────
// Update freight job details (poster only, while still open).
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const job = await FreightJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Freight job not found' });

    if (job.postedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!['open', 'quoted'].includes(job.status)) {
      return res.status(409).json({ error: `Cannot edit a ${job.status} freight job` });
    }

    const { valid, errors } = validateFreightJob(req.body);
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    await job.update(req.body);
    res.json(job);
  } catch (err) { next(err); }
});

// ─── PUT /api/freight/:id/assign ─────────────────────────────────────────────
// Assign a carrier to a freight job.
router.put('/:id/assign', authenticate, async (req, res, next) => {
  try {
    const job = await FreightJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Freight job not found' });

    // Only poster or admin can assign
    if (job.postedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the job poster can assign a carrier' });
    }
    if (!['open', 'quoted'].includes(job.status)) {
      return res.status(409).json({ error: `Cannot assign carrier to a ${job.status} job` });
    }

    const { carrierId, priceAgreed } = req.body;
    if (!carrierId) return res.status(400).json({ error: 'carrierId is required' });

    const carrier = await User.findByPk(carrierId, {
      attributes: ['id', 'email', 'businessName', 'phone', 'role'],
    });
    if (!carrier || carrier.role !== 'carrier') {
      return res.status(400).json({ error: 'Invalid carrier — user must have carrier role' });
    }

    await job.update({
      carrierId,
      priceAgreed: priceAgreed || job.priceOffered,
      status:      'assigned',
      assignedAt:  new Date(),
    });

    // Notify carrier (non-blocking)
    notifyCarrierAssigned({ carrier, freightJob: job }).catch(() => {});

    res.json(job);
  } catch (err) { next(err); }
});

// ─── PUT /api/freight/:id/status ─────────────────────────────────────────────
// Update freight job status (carrier or poster).
router.put('/:id/status', authenticate, async (req, res, next) => {
  try {
    const job = await FreightJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Freight job not found' });

    const isParticipant = [job.postedBy, job.carrierId].includes(req.user.id);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.body;
    const VALID_STATUSES = ['open', 'quoted', 'assigned', 'in_transit', 'delivered', 'cancelled'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(422).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const updates = { status };
    if (status === 'in_transit') updates.pickedUpAt  = new Date();
    if (status === 'delivered')  updates.deliveredAt = new Date();

    await job.update(updates);
    res.json(job);
  } catch (err) { next(err); }
});

// ─── DELETE /api/freight/:id ─────────────────────────────────────────────────
// Cancel a freight job (poster only, while open).
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const job = await FreightJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Freight job not found' });

    if (job.postedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!['open', 'quoted'].includes(job.status)) {
      return res.status(409).json({ error: `Cannot cancel a ${job.status} freight job` });
    }

    await job.update({ status: 'cancelled' });
    res.json({ message: 'Freight job cancelled', id: job.id });
  } catch (err) { next(err); }
});

module.exports = router;
