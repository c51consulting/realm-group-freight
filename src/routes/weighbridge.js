/**
 * @fileoverview Weighbridge routes — API, CSV, OCR and manual ingestion.
 *
 * All four ingestion paths normalise to a common WeighEvent shape via lib/weighbridge.js.
 * Events are linked to orders or freight jobs and require verification before settlement.
 */

const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const { WeighbridgeEvent, Order, FreightJob } = require('../models');
const { authenticate }                         = require('../middleware/auth');
const {
  normaliseWeighEvent,
  parseCSV,
  extractFromOCR,
  validateWeighEvent,
  cleanupUpload,
} = require('../../lib/weighbridge');

// Multer config — store in uploads/weighbridge/
const upload = multer({
  dest:   'uploads/weighbridge/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.jpg', '.jpeg', '.png', '.pdf', '.heic'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─── POST /api/weighbridge/api ───────────────────────────────────────────────
// Direct push from weighbridge software (API integration).
router.post('/api', authenticate, async (req, res, next) => {
  try {
    const normalised = normaliseWeighEvent(
      { ...req.body, recordedBy: req.user.id },
      'api',
    );

    const warnings = validateWeighEvent(normalised);

    // Verify order/freight job access
    if (normalised.orderId) {
      const order = await Order.findByPk(normalised.orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
      if (!isParticipant && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden — not an order participant' });
      }
    }

    const event = await WeighbridgeEvent.create(normalised);
    res.status(201).json({ event, warnings });
  } catch (err) { next(err); }
});

// ─── POST /api/weighbridge/csv ───────────────────────────────────────────────
// Bulk import from CSV file upload.
router.post('/csv', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required (field name: file)' });

    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const context    = {
      orderId:      req.body.orderId      || null,
      freightJobId: req.body.freightJobId || null,
      recordedBy:   req.user.id,
    };

    const { events: parsed, errors: parseErrors } = parseCSV(csvContent, context);

    cleanupUpload(req.file.path);

    if (parsed.length === 0) {
      return res.status(400).json({
        error:  'No valid rows found in CSV',
        errors: parseErrors,
      });
    }

    // Bulk insert
    const created = await WeighbridgeEvent.bulkCreate(parsed, { validate: true });

    res.status(201).json({
      imported:    created.length,
      parseErrors,
      events:      created,
    });
  } catch (err) {
    if (req.file) cleanupUpload(req.file.path);
    next(err);
  }
});

// ─── POST /api/weighbridge/ocr ───────────────────────────────────────────────
// Upload a photo of a printed weighbridge docket for OCR extraction.
router.post('/ocr', authenticate, upload.single('ticket'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Ticket image is required (field name: ticket)' });

    const context = {
      orderId:      req.body.orderId      || null,
      freightJobId: req.body.freightJobId || null,
      recordedBy:   req.user.id,
    };

    const normalised = await extractFromOCR(req.file.path, context);
    const warnings   = validateWeighEvent(normalised);

    const event = await WeighbridgeEvent.create(normalised);

    res.status(201).json({
      event,
      warnings,
      note: 'OCR extraction is pending — please verify and correct weight values.',
    });
  } catch (err) {
    if (req.file) cleanupUpload(req.file.path);
    next(err);
  }
});

// ─── POST /api/weighbridge/manual ───────────────────────────────────────────
// Manual operator entry — always requires verification.
router.post('/manual', authenticate, async (req, res, next) => {
  try {
    const normalised = normaliseWeighEvent(
      { ...req.body, recordedBy: req.user.id },
      'manual',
    );
    normalised.verified = false; // manual entries always need verification

    const warnings = validateWeighEvent(normalised);
    if (warnings.length > 0 && req.body.strict) {
      return res.status(422).json({ error: 'Weight validation failed', warnings });
    }

    const event = await WeighbridgeEvent.create(normalised);
    res.status(201).json({ event, warnings });
  } catch (err) { next(err); }
});

// ─── GET /api/weighbridge/order/:orderId ─────────────────────────────────────
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const events = await WeighbridgeEvent.findAll({
      where: { orderId: req.params.orderId },
      order: [['weighedAt', 'DESC']],
    });

    res.json(events);
  } catch (err) { next(err); }
});

// ─── GET /api/weighbridge/:id ────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await WeighbridgeEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Weigh event not found' });
    res.json(event);
  } catch (err) { next(err); }
});

// ─── PUT /api/weighbridge/:id/verify ─────────────────────────────────────────
// Verify a weigh event — only order participants or admin.
router.put('/:id/verify', authenticate, async (req, res, next) => {
  try {
    const event = await WeighbridgeEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Weigh event not found' });

    // Check access via linked order
    if (event.orderId) {
      const order = await Order.findByPk(event.orderId);
      if (order) {
        const isParticipant = [order.buyerId, order.sellerId, order.carrierId].includes(req.user.id);
        if (!isParticipant && req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
    }

    // Allow correcting weight values during verification
    const updates = {
      verified:         true,
      verifiedBy:       req.user.id,
      verifiedAt:       new Date(),
      settlementStatus: 'matched',
    };

    if (req.body.grossWeight !== undefined) updates.grossWeight = req.body.grossWeight;
    if (req.body.tareWeight  !== undefined) updates.tareWeight  = req.body.tareWeight;
    if (req.body.netWeight   !== undefined) updates.netWeight   = req.body.netWeight;

    await event.update(updates);
    res.json(event);
  } catch (err) { next(err); }
});

module.exports = router;

