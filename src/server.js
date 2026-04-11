/**
 * @fileoverview REALM Ag Marketplace — Express application entry point.
 *
 * Route map:
 *   /api/auth          — register, login, profile, Stripe onboarding
 *   /api/listings      — CRUD listings with search & filters
 *   /api/offers        — submit, accept, reject, withdraw offers
 *   /api/orders        — create orders, status flow, escrow
 *   /api/freight       — freight job posting and carrier assignment
 *   /api/weighbridge   — API, CSV, OCR, manual weigh event ingestion
 *   /api/feedtests     — lab & on-farm NIR feed test results
 *   /api/pod           — proof of delivery submission and review
 *   /api/users         — public profiles, reviews, ratings
 *   /api/stripe/webhook — Stripe payment event handler
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { sequelize } = require('./models');

// ─── Route imports ───────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const listingRoutes    = require('./routes/listings');
const offerRoutes      = require('./routes/offers');
const orderRoutes      = require('./routes/orders');
const freightRoutes    = require('./routes/freight');
const weighbridgeRoutes = require('./routes/weighbridge');
const feedtestRoutes   = require('./routes/feedtests');
const podRoutes        = require('./routes/pod');
const userRoutes       = require('./routes/users');
const stripeRoutes     = require('./routes/stripe');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security & logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Stripe webhook — must receive raw body BEFORE express.json() ────────────
// Mount before the JSON body parser so Stripe signature verification works.
app.use(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeRoutes,
);

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Root route ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name:        'REALM Ag Marketplace',
    version:     '1.0.0',
    description: 'Agricultural materials marketplace — hay, grain, fodder by weight, bale, bag or drum',
    endpoints: {
      auth:        '/api/auth',
      listings:    '/api/listings',
      offers:      '/api/offers',
      orders:      '/api/orders',
      freight:     '/api/freight',
      weighbridge: '/api/weighbridge',
      feedtests:   '/api/feedtests',
      pod:         '/api/pod',
      users:       '/api/users',
      stripe:      '/api/stripe/webhook',
      health:      '/health',
    },
  });
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', service: 'realm-ag-marketplace', version: '1.0.0', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', service: 'realm-ag-marketplace', db: 'disconnected' });
  }
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/listings',    listingRoutes);
app.use('/api/offers',      offerRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/freight',     freightRoutes);
app.use('/api/weighbridge', weighbridgeRoutes);
app.use('/api/feedtests',   feedtestRoutes);
app.use('/api/pod',         podRoutes);
app.use('/api/users',       userRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message, err.stack);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      error:  'Validation error',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error:  'Duplicate entry',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start server ────────────────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('[db] Connected to PostgreSQL');

    // In development, sync models to DB (alter: true updates columns safely)
    // In production, use migrations instead
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('[db] Models synced (development mode)');
    } else {
      await sequelize.sync({ force: false });
      console.log('[db] Models verified');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server] REALM Ag Marketplace running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();

