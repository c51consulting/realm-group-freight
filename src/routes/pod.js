/**
 * @fileoverview Proof of Delivery routes — submit, review, list.
 *
 * POD is submitted by the carrier or seller after delivery.
 * The buyer reviews and accepts/rejects the POD.
 * Accepted POD triggers order confirmation flow.
 */

const router = require('express').Router();
const multer = require('multer');
const path   = require('path');

const { ProofOfDelivery, Order, WeighbridgeEvent } = require('../models');
const { authenticate }                              = require('../middleware/auth');
const { validatePOD }                               = require('../../lib/validation');
const { notifyPODSubmitted }                        = require('../../lib/notifications');
const { cleanupUpload }                             = require('../../lib/weighbridge');

const upload = multer({
  dest:   'uploads/pod/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.heic', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─── POST /api/pod ───────────────────────────────────────────────────────────
// Submit proof of delivery (carrier or seller).
router.post('/', authenticate, upload.array('photos', 10), async (req, res, next) => {
  try {
    const { orderId, notes, gpsLat, gpsLng, signatureUrl, weighEventId } = req.body;

    // Build photo URLs from uploaded files
    const photoUrls = (req.files || []).map((f) => f.path);

    // Merge with any pre-uploaded URLs passed in body
    const bodyUrls = Array.isArray(req.body.photoUrls)
      ? req.body.photoUrls
      : req.body.photoUrls
        ? [req.body.photoUrls]
        : [];
    const allPhotoUrls = [...photoUrls, ...bodyUrls];

    const { valid, errors } = validatePOD({ orderId, photoUrls: allPhotoUrls });
    if (!valid) {
      (req.files || []).forEach((f) => cleanupUpload(f.path));
      return res.status(422).json({ error: 'Validation failed', errors });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        { association: 'buyer',  attributes: ['id', 'email', 'businessName'] },
        { association: 'seller', attributes: ['id', 'email', 'businessName'] },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only seller or carrier can submit POD
    const canSubmit = [order.sellerId, order.carrierId].includes(req.user.id) || req.user.role === 'admin';
    if (!canSubmit) {
      (req.files || []).forEach((f) => cleanupUpload(f.path));
      return res.status(403).json({ error: 'Only the seller or carrier can submit proof of delivery' });
    }

    if (!['paid', 'in_transit', 'delivered'].includes(order.status)) {
      (req.files || []).forEach((f) => cleanupUpload(f.path));
      return res.status(409).json({ error: `Cannot submit POD for an order with status '${order.status}'` });
    }

    // Validate weigh event link if provided
    if (weighEventId) {
      const weighEvent = await WeighbridgeEvent.findByPk(weighEventId);
      if (!weighEvent || weighEvent.orderId !== orderId) {
        return res.status(400).json({ error: 'Invalid weighEventId — must belong to this order' });
      }
    }

    const pod = await ProofOfDelivery.create({
      orderId,
      submittedBy:   req.user.id,
      status:        'submitted',
      photoUrls:     allPhotoUrls,
      signatureUrl:  signatureUrl  || null,
      notes:         notes         || null,
      gpsLat:        gpsLat        ? Number(gpsLat)  : null,
      gpsLng:        gpsLng        ? Number(gpsLng)  : null,
      weighEventId:  weighEventId  || null,
    });

    // Update order status to 'delivered' if not already
    if (order.status !== 'delivered') {
      await order.update({ status: 'delivered' });
    }

    // Notify buyer (non-blocking)
    if (order.buyer) {
      notifyPODSubmitted({ buyer: order.buyer, order }).catch(() => {});
    }

    res.status(201).json(pod);
  } catch (err) {
    (req.files || []).forEach((f) => cleanupUpload(f.path));
    next(err);
  }
});

// ─── GET /api/pod/order/:orderId ─────────────────────────────────────────────
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const pods = await ProofOfDelivery.findAll({
      where: { orderId: req.params.orderId },
      order: [['createdAt', 'DESC']],
    });

    res.json(pods);
  } catch (err) { next(err); }
});

// ─── GET /api/pod/:id ────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const pod = await ProofOfDelivery.findByPk(req.params.id);
    if (!pod) return res.status(404).json({ error: 'Proof of delivery not found' });

    const order = await Order.findByPk(pod.orderId);
    if (order) {
      const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
      if (!isParticipant && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json(pod);
  } catch (err) { next(err); }
});

// ─── PUT /api/pod/:id/review ─────────────────────────────────────────────────
// Buyer accepts or rejects the POD.
router.put('/:id/review', authenticate, async (req, res, next) => {
  try {
    const pod = await ProofOfDelivery.findByPk(req.params.id);
    if (!pod) return res.status(404).json({ error: 'Proof of delivery not found' });

    const order = await Order.findByPk(pod.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only buyer or admin can review POD
    if (order.buyerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the buyer can review proof of delivery' });
    }

    const { decision, rejectionReason } = req.body;
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(422).json({ error: "decision must be 'accepted' or 'rejected'" });
    }

    if (decision === 'rejected' && !rejectionReason) {
      return res.status(422).json({ error: 'rejectionReason is required when rejecting POD' });
    }

    await pod.update({
      status:          decision,
      reviewedBy:      req.user.id,
      reviewedAt:      new Date(),
      rejectionReason: decision === 'rejected' ? rejectionReason : null,
    });

    // If accepted, move order to 'confirmed'
    if (decision === 'accepted' && order.status === 'delivered') {
      await order.update({ status: 'confirmed', confirmedAt: new Date() });
    }

    res.json(pod);
  } catch (err) { next(err); }
});

module.exports = router;
