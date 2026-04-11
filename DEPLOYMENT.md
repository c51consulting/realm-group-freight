# REALM Ag Marketplace — Deployment Guide

Complete step-by-step instructions for deploying to Railway, configuring environment variables, running database migrations, setting up Stripe webhooks, and verifying the deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Deployment](#railway-deployment)
3. [Environment Variables](#environment-variables)
4. [Database Setup & Migrations](#database-setup--migrations)
5. [Stripe Configuration](#stripe-configuration)
6. [Health Check Verification](#health-check-verification)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling & Performance](#scaling--performance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Railway account](https://railway.app) (free tier works for staging)
- [Stripe account](https://stripe.com) with Connect enabled
- Node.js 18+ installed locally
- Git repository connected to Railway

---

## Railway Deployment

### Step 1 — Create a Railway Project

1. Log in to [railway.app](https://railway.app) and click **New Project**.
2. Select **Deploy from GitHub repo** and authorise Railway to access your repository.
3. Select the `realm-ag-marketplace` repository.
4. Railway will detect the `Dockerfile` and configure the build automatically.

### Step 2 — Add a PostgreSQL Database

1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway provisions a managed Postgres instance and automatically injects `DATABASE_URL` into your service's environment.
3. No manual connection string configuration is needed.

### Step 3 — Configure Environment Variables

1. Click on your service in the Railway dashboard.
2. Go to the **Variables** tab.
3. Add each variable from the [Environment Variables](#environment-variables) section below.
4. At minimum, set `JWT_SECRET`, `NODE_ENV=production`, and `STRIPE_SECRET_KEY`.

### Step 4 — Deploy

1. Railway triggers a deployment automatically on every push to your configured branch (default: `main`).
2. To trigger a manual deploy, click **Deploy** in the Railway dashboard.
3. Monitor the build logs in the **Deployments** tab.
4. A successful deployment shows `REALM Ag Marketplace running on port 3000` in the logs.

### Step 5 — Verify Deployment

```bash
# Replace with your Railway-assigned domain
curl https://your-app.railway.app/health
# Expected: {"status":"ok","service":"realm-ag-marketplace","version":"1.0.0"}
```

---

## Environment Variables

Copy `.env.production` to `.env` for local development. In Railway, set these in the **Variables** tab.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Auto | Set by Railway automatically |
| `DATABASE_URL` | Auto | Injected by Railway Postgres |
| `JWT_SECRET` | **Yes** | Random secret ≥ 32 chars |
| `JWT_EXPIRES_IN` | No | Default: `7d` |
| `STRIPE_SECRET_KEY` | For payments | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | `whsec_...` |
| `STRIPE_PLATFORM_FEE_PERCENT` | No | Default: `5` |
| `NEXT_PUBLIC_API_URL` | No | Your Railway domain |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | `pk_live_...` |
| `UPLOAD_DIR` | No | Default: `uploads` |
| `MAX_UPLOAD_SIZE_MB` | No | Default: `10` |
| `RATE_LIMIT_WINDOW_MS` | No | Default: `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Default: `100` |

### Generating a Secure JWT Secret

```bash
# Option 1: openssl
openssl rand -base64 48

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## Database Setup & Migrations

### Automatic Schema Creation

On first boot, Sequelize automatically creates all tables via `sequelize.sync()`. This is safe for initial deployment.

```
# Logs on successful startup:
Database connected
Models synced
REALM Ag Marketplace running on port 3000
```

### Manual Migration (Sequelize CLI)

For production schema changes, use migrations instead of `sync`:

```bash
# Install Sequelize CLI globally
npm install -g sequelize-cli

# Run all pending migrations
npm run migrate

# Seed test data (staging only — never run in production)
npm run seed
```

### Connecting to the Railway Database Locally

```bash
# Install Railway CLI
npm install -g @railway/cli

# Link to your project
railway link

# Open a psql shell to the Railway database
railway run psql $DATABASE_URL

# Or run migrations against Railway's database
railway run npm run migrate
```

### Database Backup

Railway provides automatic daily backups for PostgreSQL. To create a manual backup:

```bash
# Via Railway CLI
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
railway run psql $DATABASE_URL < backup_20240101.sql
```

---

## Stripe Configuration

### Step 1 — Enable Stripe Connect

1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Go to **Connect** → **Settings** and enable Connect for your platform.
3. Configure your platform profile (business name, support email, etc.).

### Step 2 — Get API Keys

1. Go to **Developers** → **API Keys**.
2. Copy the **Secret key** (`sk_live_...`) → set as `STRIPE_SECRET_KEY`.
3. Copy the **Publishable key** (`pk_live_...`) → set as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### Step 3 — Configure Webhooks

1. Go to **Developers** → **Webhooks** → **Add endpoint**.
2. Set the endpoint URL to: `https://your-app.railway.app/api/webhooks/stripe`
3. Select the following events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.dispute.created`
   - `charge.dispute.closed`
   - `transfer.created`
   - `payout.paid`
4. Click **Add endpoint** and copy the **Signing secret** (`whsec_...`).
5. Set this as `STRIPE_WEBHOOK_SECRET` in Railway.

### Step 4 — Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger a test event
stripe trigger payment_intent.succeeded
```

### Platform Fee Structure

The platform charges a 5% fee on each completed order. This is configured via `STRIPE_PLATFORM_FEE_PERCENT`. The fee is calculated in `src/routes/orders.js` when an order is created:

```
platformFee = totalAmount × (STRIPE_PLATFORM_FEE_PERCENT / 100)
```

---

## Health Check Verification

### Endpoint

```
GET /health
```

### Expected Response

```json
{
  "status": "ok",
  "service": "realm-ag-marketplace",
  "version": "1.0.0"
}
```

### Railway Health Check Configuration

Railway automatically monitors your service. To configure a custom health check:

1. In your service settings, go to **Settings** → **Health Check**.
2. Set the path to `/health`.
3. Set the timeout to `30` seconds.
4. Set the interval to `60` seconds.

### Manual Verification

```bash
# Basic health check
curl -f https://your-app.railway.app/health

# Check API root
curl https://your-app.railway.app/

# Test auth endpoint
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

### Run Integration Tests Against Production

```bash
# Point tests at your Railway deployment
TEST_API_URL=https://your-app.railway.app npm test
```

---

## Monitoring & Logging

### Railway Logs

View real-time logs in the Railway dashboard under **Deployments** → **View Logs**, or via CLI:

```bash
railway logs
railway logs --tail  # Stream live logs
```

### Structured Logging

The application uses structured JSON logging in production. Each log entry includes:

```json
{
  "level": "info",
  "message": "Database connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Log levels: `debug` (dev only), `info`, `warn`, `error`.

### Key Log Events to Monitor

| Event | Level | Action |
|-------|-------|--------|
| `Database connected` | info | Normal startup |
| `Failed to start` | error | Check DATABASE_URL |
| `Invalid token` | warn | Possible auth attack |
| `Internal server error` | error | Check stack trace |

### Setting Up Alerts

Railway supports webhook notifications for deployment failures. Configure in **Project Settings** → **Notifications**.

For production monitoring, consider integrating:
- **Sentry** for error tracking: add `SENTRY_DSN` and install `@sentry/node`
- **Datadog** or **New Relic** for APM
- **UptimeRobot** for uptime monitoring (free tier available)

---

## Scaling & Performance

### Database Connection Pooling

Sequelize uses connection pooling by default. For high-traffic deployments, tune the pool in `src/models/index.js`:

```javascript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  pool: {
    max: 10,        // Maximum connections (default: 5)
    min: 2,         // Minimum connections
    acquire: 30000, // Max ms to wait for connection
    idle: 10000,    // Max ms a connection can be idle
  },
});
```

Railway's managed Postgres supports up to 100 connections on the Hobby plan.

### Horizontal Scaling

Railway supports multiple replicas. To scale:

1. Go to your service settings → **Scaling**.
2. Set the number of replicas (2–10 recommended for production).
3. Ensure your session/state is stateless (JWT auth is already stateless).

### File Upload Considerations

The default file upload handler stores files locally (`uploads/` directory). This does **not** persist across Railway deployments or multiple replicas.

For production, migrate to cloud storage:

```bash
# Install AWS SDK or Supabase client
npm install @supabase/storage-js
# or
npm install @aws-sdk/client-s3
```

Update `src/routes/weighbridge.js` and `src/routes/feedtests.js` to upload to cloud storage instead of local disk.

### Caching

For frequently-accessed data (listings, user profiles), consider adding Redis:

1. Add a Redis service in Railway (**+ New** → **Database** → **Add Redis**).
2. Railway injects `REDIS_URL` automatically.
3. Install `ioredis`: `npm install ioredis`
4. Cache listing search results with a 60-second TTL.

---

## Troubleshooting

### Service Won't Start

**Symptom**: Deployment fails, logs show `Failed to start`.

**Causes & fixes**:

1. **Missing DATABASE_URL**: Ensure the Postgres service is linked to your app service in Railway. Check **Variables** tab for `DATABASE_URL`.

2. **Missing JWT_SECRET**: Add `JWT_SECRET` to Railway Variables.

3. **Database connection refused**: Check that the Postgres service is running. In Railway, click the Postgres service and verify it shows "Active".

4. **Port conflict**: Railway sets `PORT` automatically. Do not hardcode a port.

```bash
# Check logs for the specific error
railway logs | grep "Failed to start"
```

---

### Database Migration Errors

**Symptom**: `SequelizeDatabaseError` or `relation does not exist`.

**Fix**: The app uses `sequelize.sync()` on startup. If tables are out of sync:

```bash
# Connect to the database and check tables
railway run psql $DATABASE_URL -c "\dt"

# Force re-sync (WARNING: drops and recreates tables in development only)
NODE_ENV=development railway run node -e "
  const { sequelize } = require('./src/models');
  sequelize.sync({ force: true }).then(() => process.exit(0));
"
```

---

### JWT Authentication Errors

**Symptom**: `401 Invalid token` or `401 Token expired`.

**Causes & fixes**:

1. **Wrong JWT_SECRET**: If you change `JWT_SECRET`, all existing tokens are invalidated. Users must log in again.

2. **Token expired**: Default expiry is 7 days. Users need to log in again.

3. **Missing Authorization header**: Ensure the client sends `Authorization: Bearer <token>`.

---

### Stripe Webhook Failures

**Symptom**: Stripe dashboard shows webhook delivery failures.

**Causes & fixes**:

1. **Wrong STRIPE_WEBHOOK_SECRET**: Regenerate the signing secret in the Stripe dashboard and update Railway Variables.

2. **Endpoint not reachable**: Verify the Railway service is running and the URL is correct.

3. **Payload too large**: Ensure `express.json({ limit: '10mb' })` is configured (already done in `src/server.js`).

```bash
# Test webhook delivery manually
stripe trigger payment_intent.succeeded \
  --api-key $STRIPE_SECRET_KEY
```

---

### File Upload Failures

**Symptom**: `ENOENT: no such file or directory, open 'uploads/...'`.

**Fix**: The `uploads/` directory is created in the Dockerfile. If running locally:

```bash
mkdir -p uploads/weighbridge uploads/feedtests
```

For Railway deployments, the directory is created during the Docker build. However, files are lost on redeploy. Migrate to cloud storage for persistence.

---

### High Memory Usage

**Symptom**: Service restarts due to OOM (out of memory).

**Fixes**:

1. Reduce database connection pool size.
2. Add pagination to all list endpoints (already implemented).
3. Upgrade Railway plan for more memory.
4. Profile with: `node --inspect src/server.js` and connect Chrome DevTools.

---

### Rate Limiting

**Symptom**: Clients receive `429 Too Many Requests`.

**Fix**: Adjust rate limit settings in Railway Variables:

```
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200   # Increase if needed
```

---

## Quick Reference

```bash
# Deploy
git push origin main  # Railway auto-deploys on push

# View logs
railway logs --tail

# Run migrations
railway run npm run migrate

# Seed test data (staging only)
railway run npm run seed

# Run integration tests
TEST_API_URL=https://your-app.railway.app npm test

# Open database shell
railway run psql $DATABASE_URL

# Check environment variables
railway variables

# Restart service
railway service restart
```

---

*Last updated: 2024 · REALM Group Global*
