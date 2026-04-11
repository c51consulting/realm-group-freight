# REALM Ag Marketplace

An Airtasker-style marketplace for agricultural materials — hay, fodder, grain, silage, seed, fertiliser, drums and bulk inputs. Trade by weight, per bale, bag, drum or tonne with built-in weighbridge integration, feed testing QA, and escrow payments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 / Express 4 |
| Database | PostgreSQL (Railway) via Sequelize ORM |
| Auth | JWT (bcrypt, 12 rounds) |
| Payments | Stripe Connect — escrow hold & release |
| Notifications | Nodemailer (SMTP) + SMS stub |
| Deploy | Railway + Docker |

## Project Structure

```
src/
  server.js              # Express app entry point
  middleware/
    auth.js              # JWT auth, role & verification guards
  models/
    index.js             # All Sequelize models & associations
  routes/
    auth.js              # Register, login, profile, Stripe onboarding
    listings.js          # CRUD listings with search, publish, pause
    offers.js            # Submit, accept, reject, withdraw offers
    orders.js            # Create orders, status machine, escrow
    freight.js           # Freight job posting and carrier assignment
    weighbridge.js       # API, CSV, OCR, manual weigh event ingestion
    feedtests.js         # Lab & on-farm NIR feed test results
    pod.js               # Proof of delivery submission and review
    users.js             # Profiles, reviews, ratings
    stripe.js            # Stripe webhook handler

lib/
  validation.js          # Input validation (no external schema lib)
  quality.js             # AFIA grade calculation, quality tier logic
  stripe.js              # Payment intent, escrow hold/release helpers
  weighbridge.js         # CSV parsing, OCR stub, weight normalisation
  notifications.js       # Email (nodemailer) + SMS (stub) notifications

supabase/
  migrations/
    001_initial_schema.sql          # All tables, indexes, triggers
    001_initial_schema_rollback.sql # Rollback script
    002_rls_policies.sql            # Row Level Security policies
    002_rls_policies_rollback.sql   # Rollback script
  seed.sql               # Test data for local development
```

## Data Models

| Model | Purpose |
|-------|--------|
| User | Buyers, sellers, carriers, admins — ABN, location, Stripe account, ratings |
| Listing | Sell/buy/freight posts — 11 material types, 12 unit types, draft→active flow |
| FeedTest | Lab or on-farm NIR results — AFIA grades A1–D, auto-calculated RFV |
| QualityTier | Derived quality summary per listing (maintained by DB trigger) |
| Offer | Price, quantity, freight offers — one accepted per listing |
| Order | Escrow lifecycle — pending_payment → paid → in_transit → delivered → completed |
| FreightJob | Standalone or order-linked transport jobs |
| WeighbridgeEvent | Weight records from API, CSV, OCR or manual entry |
| ProofOfDelivery | Photos, signature, GPS, weighbridge link |
| Review | 1–5 star ratings — rolling average maintained by DB trigger |
| Message | Per-order messaging between parties |

## Quality Assurance Tiers

| Tier | Required Evidence | Auto-assigned when |
|------|------------------|--------------------|
| Basic | Vendor estimate or none | Default |
| Verified | At least one on-farm NIR test | NIR test attached |
| Performance | Accredited lab test mandatory | Lab test attached |

AFIA grades (A1 → D) are auto-calculated from RFV and crude protein when not provided.

## Weighbridge Integration

4 ingestion paths — all normalise to a common shape:

| Path | Endpoint | Notes |
|------|----------|-------|
| API | `POST /api/weighbridge/api` | Direct push from weighbridge software |
| CSV | `POST /api/weighbridge/csv` | Bulk import, flexible column names |
| OCR | `POST /api/weighbridge/ocr` | Photo upload — stub, requires verification |
| Manual | `POST /api/weighbridge/manual` | Operator entry — always requires verification |

## Order Status Flow

```
pending_payment → paid → in_transit → delivered → confirmed → completed
                                               ↘ disputed → refunded
```

Stripe side-effects:
- `paid` → PaymentIntent captured (funds held)
- `completed` → Transfer to seller (minus 5% platform fee)
- `refunded` → Full refund issued

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user profile |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/stripe/onboard` | Create Stripe Connect account |

### Listings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/listings` | Search with filters |
| GET | `/api/listings/mine` | My listings (all statuses) |
| GET | `/api/listings/:id` | Listing detail |
| POST | `/api/listings` | Create listing (draft) |
| PUT | `/api/listings/:id` | Update listing |
| PUT | `/api/listings/:id/publish` | Publish draft/paused listing |
| PUT | `/api/listings/:id/pause` | Pause active listing |
| DELETE | `/api/listings/:id` | Cancel listing |

### Offers
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/offers` | Submit offer |
| GET | `/api/offers/mine` | My offers |
| GET | `/api/offers/listing/:id` | Offers on a listing |
| GET | `/api/offers/:id` | Offer detail |
| PUT | `/api/offers/:id/accept` | Accept (auto-rejects others) |
| PUT | `/api/offers/:id/reject` | Reject offer |
| PUT | `/api/offers/:id/withdraw` | Withdraw offer |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create from accepted offer |
| GET | `/api/orders/mine` | My orders |
| GET | `/api/orders/:id` | Order detail |
| PUT | `/api/orders/:id/status` | Update status (state machine) |
| PUT | `/api/orders/:id/assign-carrier` | Assign carrier |

### Freight
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/freight` | Post freight job |
| GET | `/api/freight` | Browse open jobs |
| GET | `/api/freight/:id` | Job detail |
| PUT | `/api/freight/:id` | Update job |
| PUT | `/api/freight/:id/assign` | Assign carrier |
| PUT | `/api/freight/:id/status` | Update status |
| DELETE | `/api/freight/:id` | Cancel job |

### Weighbridge
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/weighbridge/api` | Ingest from weighbridge API |
| POST | `/api/weighbridge/csv` | Upload CSV file |
| POST | `/api/weighbridge/ocr` | Upload ticket photo |
| POST | `/api/weighbridge/manual` | Manual entry |
| GET | `/api/weighbridge/order/:orderId` | Events for an order |
| GET | `/api/weighbridge/:id` | Event detail |
| PUT | `/api/weighbridge/:id/verify` | Verify event |

### Feed Tests
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/feedtests` | Attach test to listing |
| POST | `/api/feedtests/certificate` | Upload lab certificate |
| GET | `/api/feedtests/listing/:id` | Tests for a listing |
| GET | `/api/feedtests/:id` | Test detail |
| PUT | `/api/feedtests/:id/verify` | Verify test |
| DELETE | `/api/feedtests/:id` | Delete test |

### Proof of Delivery
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pod` | Submit POD (photos, signature, GPS) |
| GET | `/api/pod/order/:orderId` | PODs for an order |
| GET | `/api/pod/:id` | POD detail |
| PUT | `/api/pod/:id/review` | Buyer accepts/rejects POD |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/:id` | Public profile |
| PUT | `/api/users/:id` | Update profile |
| GET | `/api/users/:id/reviews` | Reviews received |
| POST | `/api/users/:id/reviews` | Submit review (post-order) |

### Stripe
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/stripe/webhook` | Stripe event handler |

## Database Setup

### Option A — Supabase (recommended for production)

1. Create a Supabase project at https://supabase.com
2. Run migrations in the SQL editor:
   ```sql
   -- Run in order:
   \i supabase/migrations/001_initial_schema.sql
   \i supabase/migrations/002_rls_policies.sql
   ```
3. Optionally seed test data:
   ```sql
   \i supabase/seed.sql
   ```
4. Copy the connection string from Project Settings → Database

### Option B — Railway PostgreSQL (development)

The app uses Sequelize `sync()` in development mode — tables are created automatically on first boot. For production, run the migration SQL files manually.

### Row Level Security

RLS is enabled on all tables. Key policies:

| Table | Read | Write |
|-------|------|-------|
| users | Public | Self only |
| listings | Active listings public; owner sees all | Owner only |
| offers | Buyer sees own; seller sees on their listings | Buyer creates; seller accepts/rejects |
| orders | Buyer, seller, carrier | Participants |
| weigh_events | Order participants | Order participants |
| proof_of_delivery | Order participants | Seller/carrier submits; buyer reviews |
| reviews | Public | Post-order participants only |

## Deploy to Railway

1. Create Railway project with PostgreSQL plugin
2. Add new service from this GitHub repo
3. Railway auto-detects the Dockerfile
4. `DATABASE_URL` is auto-linked from the Postgres plugin
5. Add environment variables:
   ```
   JWT_SECRET=<generate with: openssl rand -hex 64>
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   APP_URL=https://your-domain.up.railway.app
   ```
6. Deploy — the app connects and syncs on first boot
7. Run migrations: `npm run db:migrate`

## Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL URL

# Start development server (auto-restarts on changes)
npm run dev

# Run database migrations (requires psql in PATH)
npm run db:migrate

# Seed test data
npm run db:seed

# Reset database (rollback + migrate + seed)
npm run db:reset
```

### Test Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@realm.ag | Password1! |
| Seller | seller1@example.com | Password1! |
| Seller | seller2@example.com | Password1! |
| Buyer | buyer1@example.com | Password1! |
| Buyer | buyer2@example.com | Password1! |
| Carrier | carrier1@example.com | Password1! |

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Enable Connect in your Stripe dashboard
3. Add `STRIPE_SECRET_KEY` to your environment
4. Create a webhook endpoint pointing to `/api/stripe/webhook`
5. Subscribe to events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `transfer.created`, `account.updated`
6. Add `STRIPE_WEBHOOK_SECRET` to your environment

Sellers onboard via `POST /api/auth/stripe/onboard` which creates a Stripe Express account and returns an onboarding URL.

## License

Private — REALM Group Global

