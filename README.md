# REALM Ag Marketplace

An Airtasker-style marketplace for agricultural materials — hay, fodder, grain, silage, seed, fertiliser, drums and bulk inputs. Trade by weight, per bale, bag, drum or tonne with built-in weighbridge integration, feed-testing QA, and escrow payments.

## Tech Stack

- **Frontend / Full-stack**: Next.js 14 (App Router, TypeScript)
- **Client (standalone)**: Next.js 14 in `client/` — React 18, TypeScript, Tailwind CSS
- **Database**: PostgreSQL via Supabase (or direct `DATABASE_URL`)
- **Auth**: Supabase Auth (JWT) + Express JWT (for `src/` API)
- **Payments**: Stripe Connect (escrow hold & release)
- **Deploy**: Railway (Railpack builder + Docker)

## Project Structure

```
app/                          # Next.js App Router
  layout.tsx                  # Root layout with header/nav/footer
  page.tsx                    # Homepage
  globals.css                 # Tailwind base + component classes
  dashboard/page.tsx          # Dashboard overview
  listings/
    page.tsx                  # Browse listings with filters
    create/page.tsx           # Create listing form
    [id]/page.tsx             # Listing detail + offer sidebar
  freight/
    page.tsx                  # Browse freight jobs
    create/page.tsx           # Post freight job form
    [id]/page.tsx             # Freight job detail
  quality/
    page.tsx                  # Quality tiers + AFIA grade reference
    [id]/page.tsx             # Quality tier + feed test detail
  offers/
    page.tsx                  # Offers list with status tabs
    [id]/page.tsx             # Offer detail + accept/reject actions
  orders/
    page.tsx                  # Orders list with status tabs
    [id]/page.tsx             # Order detail + weigh events + POD
  api/
    health/route.ts           # GET /api/health — Railway health check

components/
  Header.tsx                  # Sticky header with mobile nav
  Navigation.tsx              # Active-link nav menu
  LoadingSpinner.tsx          # Accessible loading indicator

lib/
  types.ts                    # TypeScript types for all entities
  constants.ts                # Material types, quality levels, nav links
  supabase.ts                 # Supabase browser + service-role clients
  api.ts                      # CRUD helpers (listings, freight, offers, orders…)

src/                          # Express API (preserved for reference)
  server.js
  middleware/auth.js
  models/index.js
  routes/

client/                       # Standalone Next.js 14 frontend (Express API client)
  app/                        # App Router pages
    layout.tsx                # Root layout (Navbar, AuthProvider, NotificationProvider)
    page.tsx                  # Landing page
    auth/login/               # Login page
    auth/register/            # Registration page
    dashboard/                # User dashboard with stats
    listings/                 # Browse, detail, create, edit
    freight/                  # Freight jobs browse, detail, create
    offers/                   # My offers list
    orders/                   # My orders list + detail with timeline
    quality/                  # Quality tiers reference
    profile/                  # User profile (own + public)
  components/                 # Reusable React components
    Navbar.tsx                # Responsive navigation with mobile menu
    ListingCard.tsx           # Listing browse card
    OfferForm.tsx             # Submit offer on listing
    ListingForm.tsx           # Create / edit listing
    AuthForm.tsx              # Login / register forms
    OrderTimeline.tsx         # Visual order status flow
    WeighEventForm.tsx        # Manual weigh event entry
    PODForm.tsx               # Proof of delivery upload
    ReviewForm.tsx            # Post-order star review
    FeedTestUpload.tsx        # Feed test certificate upload
    UserProfile.tsx           # Profile display + inline edit
    SearchFilters.tsx         # Listing filter sidebar
    PaginationControls.tsx    # Page navigation
  lib/
    types.ts                  # Shared TypeScript types
    client.ts                 # Typed API fetch wrapper (JWT Bearer)
    client-utils.ts           # Currency, dates, validation helpers
    context/
      AuthContext.tsx         # Global auth state (login/logout/register)
      NotificationContext.tsx # Toast notification system
    hooks/
      useAuth.ts / useListings.ts / useOffers.ts / useOrders.ts / useUser.ts / useForm.ts
```

## Data Models

| Entity | Purpose |
|--------|---------|
| User | Buyers, sellers, carriers, admins with ABN, location, ratings |
| Listing | Sell/buy/freight posts — 11 material types, 12 unit types |
| FeedTest | Lab or on-farm NIR results with AFIA grades A1–D |
| QualityTier | Derived quality summary per listing |
| Offer | Price, quantity, freight offers on listings |
| Order | Escrow transaction flow with delivery evidence |
| FreightJob | Standalone or order-linked transport jobs |
| WeighEvent | Weight records from API, CSV, OCR or manual entry |
| ProofOfDelivery | Photos, signatures and weighbridge evidence |
| Review | 1–5 star ratings with rolling average |

## Quality Assurance Tiers

| Deal Size | QA Level | Required Evidence |
|-----------|----------|------------------|
| Small / spot | Basic | On-farm NIR or vendor estimate |
| Medium / seasonal | Verified | ≥1 lab feed test + on-farm NIR |
| Large / performance | Performance | Lab feed test mandatory, AFIA grade |

## Weighbridge Integration

4 ingestion paths supported:
1. **API** — Direct from weighbridge software (REST)
2. **CSV** — File upload/import from legacy systems
3. **OCR** — Phone photo of printed docket
4. **Manual** — Operator entry with verification workflow

## Order Flow

```
Listing created → Offers submitted → Offer accepted
→ Order created (payment held in escrow) → In transit
→ Delivered (weighbridge + photos) → Buyer confirms
→ Payment released (minus 5% platform fee) → Completed
```

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with feature overview |
| `/dashboard` | Activity overview, stats, quick actions |
| `/listings` | Browse with material/quality/pricing filters |
| `/listings/create` | Post a new listing |
| `/listings/[id]` | Listing detail + make offer |
| `/freight` | Browse freight jobs |
| `/freight/create` | Post a freight job |
| `/freight/[id]` | Freight job detail + accept/quote |
| `/quality` | Quality tiers + AFIA grade reference |
| `/quality/[id]` | Feed test results + certificate |
| `/offers` | Offers list with status tabs |
| `/offers/[id]` | Offer detail + accept/reject/withdraw |
| `/orders` | Orders list with escrow status tabs |
| `/orders/[id]` | Order detail + weigh events + POD |
| `/api/health` | Health check (Railway) |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `DATABASE_URL` | Postgres connection string (Railway auto-injects) |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://your-app.railway.app`) |
| `JWT_SECRET` | JWT signing secret |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (Railway sets this automatically) |

## Deploy to Railway

1. Create a Railway project and add a **PostgreSQL** service
2. Add a new service from this GitHub repo
3. Railway auto-detects the `Dockerfile` (multi-stage Next.js build)
4. `DATABASE_URL` is auto-injected from the linked Postgres service
5. Add the remaining environment variables in the Railway dashboard
6. Deploy — the Next.js app builds and starts on the assigned port

## Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# Start the dev server
npm run dev
# → http://localhost:3000

# Type-check
npm run type-check

# Lint
npm run lint
```

## License

Private — REALM Group Global
