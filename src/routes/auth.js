/**
 * @fileoverview Authentication routes — register, login, profile, Stripe onboarding.
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const { User }                  = require('../models');
const { authenticate }          = require('../middleware/auth');
const { validateRegister }      = require('../../lib/validation');
const { createConnectAccount, createOnboardingLink } = require('../../lib/stripe');

const JWT_SECRET    = process.env.JWT_SECRET || 'realm-ag-dev-secret';
const JWT_EXPIRES   = process.env.JWT_EXPIRES || '7d';
const BCRYPT_ROUNDS = 12;

/** Strips sensitive fields before sending user to client. */
function safeUser(user) {
  const u = user.toJSON ? user.toJSON() : { ...user };
  delete u.passwordHash;
  return u;
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, businessName, abn, phone, role, address } = req.body;

    // Validate input
    const { valid, errors } = validateRegister({ email, password, role, abn });
    if (!valid) return res.status(422).json({ error: 'Validation failed', errors });

    // Check uniqueness
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      businessName,
      abn,
      phone,
      role: role || 'buyer',
      address,
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({
      user: safeUser(user),
      token,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    // Constant-time comparison even on miss (prevents timing attacks)
    const dummyHash = '$2b$12$invalidhashfortimingnormalization000000000000000000000';
    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({ user: safeUser(user), token });
  } catch (err) { next(err); }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    // req.user is already set by authenticate middleware (no passwordHash)
    res.json(req.user);
  } catch (err) { next(err); }
});

// ─── PUT /api/auth/me ────────────────────────────────────────────────────────
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { businessName, phone, address, abn, lat, lng } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ businessName, phone, address, abn, lat, lng });
    res.json(safeUser(user));
  } catch (err) { next(err); }
});

// ─── POST /api/auth/change-password ─────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(422).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.update({ passwordHash });

    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/stripe/onboard ──────────────────────────────────────────
// Creates a Stripe Connect Express account and returns an onboarding link.
router.post('/stripe/onboard', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let stripeAccountId = user.stripeAccountId;

    // Create account if not already set up
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email:        user.email,
        businessName: user.businessName || user.email,
      });
      stripeAccountId = account.id;
      await user.update({ stripeAccountId });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const link = await createOnboardingLink({
      accountId:  stripeAccountId,
      refreshUrl: `${baseUrl}/api/auth/stripe/onboard`,
      returnUrl:  `${baseUrl}/dashboard?stripe=connected`,
    });

    res.json({ url: link.url, stripeAccountId });
  } catch (err) { next(err); }
});

module.exports = router;

