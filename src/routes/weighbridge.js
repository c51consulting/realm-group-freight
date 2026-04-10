const router = require('express').Router();
const multer = require('multer');
const { WeighbridgeEvent, Order } = require('../models');
const upload = multer({ dest: 'uploads/weighbridge/' });

// POST /api/weighbridge/api - Ingest from weighbridge API
router.post('/api', async (req, res, next) => {
  try {
    const { orderId, sourceSystem, sourceTicketId, siteId, siteName, vehicleRego, grossWeight, tareWeight, netWeight, weightUnit, weighedAt, operatorName, tradeApproved, rawData } = req.body;
    const event = await WeighbridgeEvent.create({
      orderId, source: 'api', sourceSystem, sourceTicketId, siteId, siteName, vehicleRego, grossWeight, tareWeight, netWeight, weightUnit, weighedAt, operatorName, tradeApproved, rawData, verified: tradeApproved || false
    });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// POST /api/weighbridge/csv - Ingest from CSV upload
router.post('/csv', upload.single('file'), async (req, res, next) => {
  try {
    // Parse CSV and create events
    const fs = require('fs');
    const csv = fs.readFileSync(req.file.path, 'utf8');
    const lines = csv.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const events = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx]; });
      const event = await WeighbridgeEvent.create({
        orderId: req.body.orderId || null,
        source: 'csv_import',
        sourceTicketId: row.ticketId || row.ticket_id || `CSV-${i}`,
        vehicleRego: row.rego || row.vehicle,
        grossWeight: parseFloat(row.gross || row.grossWeight) || null,
        tareWeight: parseFloat(row.tare || row.tareWeight) || null,
        netWeight: parseFloat(row.net || row.netWeight) || null,
        weightUnit: row.unit || 'kg',
        weighedAt: row.date || row.timestamp || new Date(),
        rawData: row
      });
      events.push(event);
    }
    fs.unlinkSync(req.file.path);
    res.status(201).json({ imported: events.length, events });
  } catch (err) { next(err); }
});

// POST /api/weighbridge/ocr - Upload ticket photo for OCR
router.post('/ocr', upload.single('ticket'), async (req, res, next) => {
  try {
    const event = await WeighbridgeEvent.create({
      orderId: req.body.orderId || null,
      source: 'ocr_upload',
      ticketImageUrl: req.file.path,
      vehicleRego: req.body.vehicleRego,
      grossWeight: req.body.grossWeight || null,
      tareWeight: req.body.tareWeight || null,
      netWeight: req.body.netWeight || null,
      weightUnit: req.body.weightUnit || 'kg',
      weighedAt: req.body.weighedAt || new Date(),
      verified: false
    });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// POST /api/weighbridge/manual - Manual entry
router.post('/manual', async (req, res, next) => {
  try {
    const event = await WeighbridgeEvent.create({ ...req.body, source: 'manual', verified: false });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// GET /api/weighbridge/order/:orderId
router.get('/order/:orderId', async (req, res, next) => {
  try {
    const events = await WeighbridgeEvent.findAll({
      where: { orderId: req.params.orderId },
      order: [['weighedAt', 'DESC']]
    });
    res.json(events);
  } catch (err) { next(err); }
});

// PUT /api/weighbridge/:id/verify
router.put('/:id/verify', async (req, res, next) => {
  try {
    const event = await WeighbridgeEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.update({ verified: true, verifiedBy: req.body.userId, settlementStatus: 'matched' });
    res.json(event);
  } catch (err) { next(err); }
});

module.exports = router;
