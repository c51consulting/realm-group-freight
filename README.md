# REALM Ag Marketplace

An Airtasker-style marketplace for agricultural materials - hay, fodder, grain, silage, seed, fertiliser, drums and bulk inputs. Trade by weight, per bale, bag, drum or tonne with built-in weighbridge integration, feed testing QA, and escrow payments.

## Tech Stack

- **Backend**: Node.js / Express
- **Database**: PostgreSQL via Sequelize ORM
- **Auth**: JWT with bcrypt
- **Payments**: Stripe Connect (escrow hold & release)
- **Deploy**: Railway + Docker

## Project Structure

```
src/
  server.js              # Express app entry point
  middleware/
    auth.js              # JWT auth, role & verification guards
  models/
    index.js             # All Sequelize models & associations
  routes/
    auth.js              # Register, login, profile
    listings.js          # CRUD listings with search & filters
    offers.js            # Submit, accept, reject, withdraw offers
    orders.js            # Create orders, status flow, escrow
    weighbridge.js       # API, CSV, OCR, manual weigh events
    feedtests.js         # Lab & on-farm NIR feed test results
    users.js             # Profiles, reviews, ratings
```

## Data Models

| Model | Purpose |
|-------|--------|
| User | Buyers, sellers, carriers, admins with ABN, location, ratings |
| Listing | Sell/buy/freight posts with 11 material types, 12 unit types |
| FeedTest | Lab or on-farm NIR results with AFIA grades A1-D |
| Offer | Price, quantity, freight offers on listings |
| Order | Escrow transaction flow with delivery evidence |
| WeighbridgeEvent | Weight records from API, CSV, OCR or manual entry |
| Review | 1-5 star ratings with rolling average |
| Message | Per-order messaging between parties |

## Quality Assurance Tiers

| Deal Size | QA Level | Required Evidence |
|-----------|----------|------------------|
| Small / spot | Basic | On-farm NIR or vendor estimate |
| Medium / seasonal | Verified | At least 1 lab feedtest + on-farm NIR |
| Large / performance | Performance | Lab feedtest mandatory, AFIA grade |

## Weighbridge Integration

4 ingestion paths supported:
1. **API** - Direct from weighbridge software (REST)
2. **CSV** - File upload/import from legacy systems
3. **OCR** - Phone photo of printed docket
4. **Manual** - Operator entry with verification workflow

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Current user profile

### Listings
- `GET /api/listings` - Search with filters (materialType, unitType, price range, quality)
- `GET /api/listings/:id` - Listing detail with feedtests & offers
- `POST /api/listings` - Create listing (auto-calculates price/tonne equivalent)
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Cancel listing

### Offers
- `POST /api/offers` - Submit offer on listing
- `GET /api/offers/listing/:id` - All offers for a listing
- `PUT /api/offers/:id/accept` - Accept (auto-rejects others)
- `PUT /api/offers/:id/reject` - Reject
- `PUT /api/offers/:id/withdraw` - Withdraw

### Orders
- `POST /api/orders` - Create from accepted offer (5% platform fee)
- `GET /api/orders/:id` - Order detail with weighbridge events
- `PUT /api/orders/:id/status` - Update status through escrow flow
- `GET /api/orders/user/:userId` - All orders for a user

### Weighbridge
- `POST /api/weighbridge/api` - Ingest from weighbridge API
- `POST /api/weighbridge/csv` - Upload CSV file
- `POST /api/weighbridge/ocr` - Upload ticket photo
- `POST /api/weighbridge/manual` - Manual entry
- `GET /api/weighbridge/order/:orderId` - Events for an order
- `PUT /api/weighbridge/:id/verify` - Verify a weigh event

### Feed Tests
- `POST /api/feedtests` - Add test to listing (enforces QA rules)
- `POST /api/feedtests/certificate` - Upload lab certificate
- `GET /api/feedtests/listing/:id` - Tests for a listing

### Users
- `GET /api/users/:id` - Public profile with active listings
- `PUT /api/users/:id` - Update profile
- `GET /api/users/:id/reviews` - Reviews received
- `POST /api/users/:id/reviews` - Leave review (updates rolling avg)

## Order Flow

```
Listing created -> Offers submitted -> Offer accepted
-> Order created (payment held) -> In transit
-> Delivered (weighbridge + photos) -> Buyer confirms
-> Payment released (minus 5% fee) -> Completed
```

## Environment Variables

```
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deploy to Railway

1. Create Railway project with PostgreSQL
2. Add new service from GitHub repo
3. Railway auto-detects Dockerfile
4. DATABASE_URL is auto-linked from Postgres
5. Add JWT_SECRET and NODE_ENV=production
6. Deploy - tables auto-create on first boot

## Local Development

```bash
npm install
cp .env.example .env  # Edit with your local DB
npm run dev
```

## License

Private - REALM Group Global
