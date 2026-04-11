require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const offerRoutes = require('./routes/offers');
const orderRoutes = require('./routes/orders');
const weighbridgeRoutes = require('./routes/weighbridge');
const feedtestRoutes = require('./routes/feedtests');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'REALM Ag Marketplace',
    version: '1.0.0',
    description: 'Agricultural materials marketplace - hay, grain, fodder by weight, bale, bag or drum',
    endpoints: {
      auth: '/api/auth',
      listings: '/api/listings',
      offers: '/api/offers',
      orders: '/api/orders',
      weighbridge: '/api/weighbridge',
      feedtests: '/api/feedtests',
      users: '/api/users',
      health: '/health'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'realm-ag-marketplace', version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/weighbridge', weighbridgeRoutes);
app.use('/api/feedtests', feedtestRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Models synced');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`REALM Ag Marketplace running on port ${PORT}`);
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────
    // Handles SIGTERM (Railway stop/redeploy) and SIGINT (Ctrl+C in dev).
    // Stops accepting new connections, waits for in-flight requests to finish,
    // then closes the database pool before exiting.

    let isShuttingDown = false;

    function shutdown(signal) {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\n${signal} received — shutting down gracefully`);

      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await sequelize.close();
          console.log('Database pool closed');
        } catch (err) {
          console.error('Error closing database pool:', err.message);
        }
        process.exit(0);
      });

      // Force exit after 30 seconds if graceful shutdown stalls
      setTimeout(() => {
        console.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 30_000).unref();
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Log unhandled promise rejections instead of crashing silently
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled promise rejection:', reason);
    });

  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
