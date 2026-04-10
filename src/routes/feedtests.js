const router = require('express').Router();
const multer = require('multer');
const { FeedTest, Listing } = require('../models');
const upload = multer({ dest: 'uploads/feedtests/' });

// POST /api/feedtests - Add feed test to listing
router.post('/', async (req, res, next) => {
  try {
    const { listingId, source, labName, deviceId, testDate, dryMatter, moisture, crudeProtein, metabolisableEnergy, ndf, adf, digestibility, afiaGrade, rfv, fei, ash, rawData } = req.body;
    const listing = await Listing.findByPk(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    // Enforce QA level rules
    if (listing.qualityLevel === 'performance' && source !== 'lab') {
      return res.status(400).json({ error: 'Performance-grade listings require lab feedtest' });
    }
    const feedTest = await FeedTest.create({
      listingId, source, labName, deviceId, testDate, dryMatter, moisture, crudeProtein, metabolisableEnergy, ndf, adf, digestibility, afiaGrade, rfv, fei, ash, rawData, verified: source === 'lab'
    });
    // Auto-upgrade listing quality level if lab test added
    if (source === 'lab' && listing.qualityLevel === 'basic') {
      await listing.update({ qualityLevel: 'verified' });
    }
    res.status(201).json(feedTest);
  } catch (err) { next(err); }
});

// POST /api/feedtests/certificate - Upload lab certificate
router.post('/certificate', upload.single('certificate'), async (req, res, next) => {
  try {
    const feedTest = await FeedTest.findByPk(req.body.feedTestId);
    if (!feedTest) return res.status(404).json({ error: 'Feed test not found' });
    await feedTest.update({ certificateUrl: req.file.path });
    res.json(feedTest);
  } catch (err) { next(err); }
});

// GET /api/feedtests/listing/:listingId
router.get('/listing/:listingId', async (req, res, next) => {
  try {
    const tests = await FeedTest.findAll({
      where: { listingId: req.params.listingId },
      order: [['testDate', 'DESC']]
    });
    res.json(tests);
  } catch (err) { next(err); }
});

// GET /api/feedtests/:id
router.get('/:id', async (req, res, next) => {
  try {
    const test = await FeedTest.findByPk(req.params.id);
    if (!test) return res.status(404).json({ error: 'Feed test not found' });
    res.json(test);
  } catch (err) { next(err); }
});

module.exports = router;
