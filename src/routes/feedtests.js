/**
 * @fileoverview Feed test routes — attach, upload certificate, verify, list.
 *
 * QA rules enforced:
 *   - performance listings: lab test required
 *   - verified listings: NIR or lab test required
 *   - Adding a lab test auto-upgrades listing quality tier
 */

const router = require('express').Router();
const multer = require('multer');
const path   = require('path');

const { FeedTest, Listing } = require('../models');
const { authenticate }      = require('../middleware/auth');
const { validateFeedTest }  = require('../../lib/validation');
const {
  calculateAfiaGrade,
  calculateRFV,
  validateQualityRequirements,
  buildQualityTierSummary,
} = require('../../lib/quality');
const { cleanupUpload } = require('../../lib/weighbridge');

const upload = multer({
  dest:   'uploads/feedtests/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─── POST /api/feedtests ─────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      listingId, source, labName, deviceId, testDate,
      dryMatter, moisture, crudeProtein, metabolisableEnergy,
      ndf, adf, digestibility, afiaGrade, rfv, fei, ash, rawData,
    } = req.body;

    const { valid, errors } = validateFeedTest(req.body);
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    const listing = await Listing.findByPk(listingId, {
      include: [{ association: 'feedTests' }],
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Only listing owner or admin can attach feed tests
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Enforce QA rules for performance listings
    if (listing.qualityLevel === 'performance' && source !== 'lab') {
      return res.status(400).json({
        error: 'Performance-grade listings require an accredited lab feed test',
      });
    }

    // Auto-calculate RFV if NDF and ADF provided but RFV missing
    let computedRFV = rfv;
    if (!rfv && ndf && adf) {
      computedRFV = calculateRFV(Number(ndf), Number(adf));
    }

    // Auto-calculate AFIA grade if not provided
    let computedGrade = afiaGrade;
    if (!afiaGrade && computedRFV && crudeProtein) {
      computedGrade = calculateAfiaGrade(Number(computedRFV), Number(crudeProtein));
    }

    const feedTest = await FeedTest.create({
      listingId,
      uploadedBy: req.user.id,
      source,
      labName:              labName    || null,
      deviceId:             deviceId   || null,
      testDate:             testDate   || null,
      dryMatter:            dryMatter  || null,
      moisture:             moisture   || null,
      crudeProtein:         crudeProtein || null,
      metabolisableEnergy:  metabolisableEnergy || null,
      ndf:                  ndf        || null,
      adf:                  adf        || null,
      digestibility:        digestibility || null,
      afiaGrade:            computedGrade || null,
      rfv:                  computedRFV   || null,
      fei:                  fei        || null,
      ash:                  ash        || null,
      rawData:              rawData    || null,
      verified:             source === 'lab',
    });

    // Recalculate quality tier summary (DB trigger handles this, but return updated summary)
    const allTests = await FeedTest.findAll({ where: { listingId } });
    const summary  = buildQualityTierSummary(allTests);

    res.status(201).json({ feedTest, qualityTierSummary: summary });
  } catch (err) { next(err); }
});

// ─── POST /api/feedtests/certificate ─────────────────────────────────────────
// Upload a lab certificate PDF/image and attach to an existing feed test.
router.post('/certificate', authenticate, upload.single('certificate'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Certificate file is required (field name: certificate)' });

    const feedTest = await FeedTest.findByPk(req.body.feedTestId, {
      include: [{ model: Listing }],
    });
    if (!feedTest) {
      cleanupUpload(req.file.path);
      return res.status(404).json({ error: 'Feed test not found' });
    }

    // Only listing owner or admin
    if (feedTest.Listing && feedTest.Listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      cleanupUpload(req.file.path);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // In production: upload to S3/Supabase Storage and store the URL
    // For now: store the local path (replace with storage URL in production)
    await feedTest.update({
      certificateUrl: req.file.path,
      verified:       true,
    });

    res.json(feedTest);
  } catch (err) {
    if (req.file) cleanupUpload(req.file.path);
    next(err);
  }
});

// ─── GET /api/feedtests/listing/:listingId ───────────────────────────────────
router.get('/listing/:listingId', async (req, res, next) => {
  try {
    const tests = await FeedTest.findAll({
      where: { listingId: req.params.listingId },
      order: [['testDate', 'DESC']],
    });
    const summary = buildQualityTierSummary(tests);
    res.json({ tests, qualityTierSummary: summary });
  } catch (err) { next(err); }
});

// ─── GET /api/feedtests/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const test = await FeedTest.findByPk(req.params.id);
    if (!test) return res.status(404).json({ error: 'Feed test not found' });
    res.json(test);
  } catch (err) { next(err); }
});

// ─── PUT /api/feedtests/:id/verify ──────────────────────────────────────────
// Admin or listing owner can manually verify a feed test.
router.put('/:id/verify', authenticate, async (req, res, next) => {
  try {
    const test = await FeedTest.findByPk(req.params.id, {
      include: [{ model: Listing }],
    });
    if (!test) return res.status(404).json({ error: 'Feed test not found' });

    const isOwner = test.Listing && test.Listing.sellerId === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await test.update({
      verified:   true,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    });

    res.json(test);
  } catch (err) { next(err); }
});

// ─── DELETE /api/feedtests/:id ───────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const test = await FeedTest.findByPk(req.params.id, {
      include: [{ model: Listing }],
    });
    if (!test) return res.status(404).json({ error: 'Feed test not found' });

    const isOwner = test.Listing && test.Listing.sellerId === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await test.destroy();
    res.json({ message: 'Feed test deleted', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;

