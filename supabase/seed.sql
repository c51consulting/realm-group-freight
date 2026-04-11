-- ============================================================
-- REALM Ag Marketplace — Seed Data
-- Creates test users, listings, feed tests, offers, orders,
-- freight jobs and weigh events for local development.
--
-- Run: psql $DATABASE_URL -f supabase/seed.sql
-- ============================================================

BEGIN;

-- ============================================================
-- USERS
-- Passwords are all "Password1!" hashed with bcrypt cost 12.
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky
-- ============================================================

INSERT INTO users (id, email, password_hash, business_name, abn, phone, role, address, lat, lng, verified, rating, review_count)
VALUES
  -- Admin
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@realm.ag',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky',
    'REALM Group Global',
    '12 345 678 901',
    '+61 400 000 001',
    'admin',
    '{"street":"1 Collins St","suburb":"Melbourne","state":"VIC","postcode":"3000","country":"AU"}',
    -37.8136, 144.9631,
    TRUE, 5.0, 10
  ),
  -- Seller 1 — hay & fodder
  (
    '00000000-0000-0000-0000-000000000002',
    'seller1@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky',
    'Green Valley Hay Co',
    '98 765 432 101',
    '+61 400 000 002',
    'seller',
    '{"street":"45 Farm Rd","suburb":"Shepparton","state":"VIC","postcode":"3630","country":"AU"}',
    -36.3833, 145.3978,
    TRUE, 4.7, 23
  ),
  -- Seller 2 — grain
  (
    '00000000-0000-0000-0000-000000000003',
    'seller2@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky',
    'Riverina Grain Traders',
    '11 222 333 444',
    '+61 400 000 003',
    'seller',
    '{"street":"12 Silo Rd","suburb":"Wagga Wagga","state":"NSW","postcode":"2650","country":"AU"}',
    -35.1082, 147.3598,
    TRUE, 4.5, 15
  ),
  -- Buyer 1
  (
    '00000000-0000-0000-0000-000000000004',
    'buyer1@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky',
    'Sunrise Cattle Co',
    '55 666 777 888',
    '+61 400 000 004',
    'buyer',
    '{"street":"88 Station Rd","suburb":"Dubbo","state":"NSW","postcode":"2830","country":"AU"}',
    -32.2569, 148.6011,
    TRUE, 4.8, 8
  ),
  -- Buyer 2
  (
    '00000000-0000-0000-0000-000000000005',
    'buyer2@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky',
    'Outback Feedlot Pty Ltd',
    '22 333 444 555',
    '+61 400 000 005',
    'buyer',
    '{"street":"1 Feedlot Dr","suburb":"Roma","state":"QLD","postcode":"4455","country":"AU"}',
    -26.5667, 148.7833,
    TRUE, 4.2, 5
  ),
  -- Carrier
  (
    '00000000-0000-0000-0000-000000000006',
    'carrier1@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o.k9Gy5Ky',
    'FastHaul Transport',
    '77 888 999 000',
    '+61 400 000 006',
    'carrier',
    '{"street":"3 Depot Rd","suburb":"Albury","state":"NSW","postcode":"2640","country":"AU"}',
    -36.0737, 146.9135,
    TRUE, 4.9, 31
  );

-- ============================================================
-- LISTINGS
-- ============================================================

INSERT INTO listings (
  id, seller_id, type, status, material_type, material_subtype, title, description,
  unit_type, price_per_unit, price_per_tonne_equiv, quantity_available, minimum_order,
  estimated_weight_per_unit, pricing_type, freight_included, delivery_radius,
  pickup_address, pickup_lat, pickup_lng, loading_available, quality_level, expires_at
)
VALUES
  -- Listing 1: Lucerne hay bales
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'sell', 'active', 'hay', 'Lucerne',
    'Premium Lucerne Hay — Large Square Bales',
    'High-quality lucerne hay, 3rd cut, excellent colour and smell. Tested A1 AFIA grade. Suitable for horses, dairy and beef cattle.',
    'bale_large', 28.00, 233.33, 500, 20,
    120.0, 'fixed', FALSE, 200,
    '{"street":"45 Farm Rd","suburb":"Shepparton","state":"VIC","postcode":"3630","country":"AU"}',
    -36.3833, 145.3978, TRUE, 'performance',
    NOW() + INTERVAL '90 days'
  ),
  -- Listing 2: Oaten hay
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'sell', 'active', 'hay', 'Oaten',
    'Oaten Hay — Round Bales, Excellent Quality',
    'Oaten hay round bales, approx 350kg each. Good colour, no mould. Ideal for horses and sheep.',
    'bale_round', 95.00, 271.43, 200, 10,
    350.0, 'offers', FALSE, 150,
    '{"street":"45 Farm Rd","suburb":"Shepparton","state":"VIC","postcode":"3630","country":"AU"}',
    -36.3833, 145.3978, TRUE, 'verified',
    NOW() + INTERVAL '60 days'
  ),
  -- Listing 3: Wheat grain
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'sell', 'active', 'grain', 'Wheat',
    'Feed Wheat — Bulk Tonnes, Wagga Wagga',
    'Feed wheat, protein 10.5%, moisture 11%. Available in bulk. Suitable for feedlot rations.',
    'tonne', 320.00, 320.00, 1000, 50,
    1000.0, 'fixed', FALSE, 300,
    '{"street":"12 Silo Rd","suburb":"Wagga Wagga","state":"NSW","postcode":"2650","country":"AU"}',
    -35.1082, 147.3598, FALSE, 'verified',
    NOW() + INTERVAL '120 days'
  ),
  -- Listing 4: Silage
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'sell', 'active', 'silage', 'Maize',
    'Maize Silage — Wrapped Bales',
    'Maize silage, well fermented, 35% DM. Wrapped bales approx 600kg. Excellent for dairy cows.',
    'bale_round', 75.00, 125.00, 300, 20,
    600.0, 'fixed', FALSE, 100,
    '{"street":"45 Farm Rd","suburb":"Shepparton","state":"VIC","postcode":"3630","country":"AU"}',
    -36.3833, 145.3978, FALSE, 'basic',
    NOW() + INTERVAL '30 days'
  ),
  -- Listing 5: Barley grain
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    'sell', 'active', 'grain', 'Barley',
    'Feed Barley — Ex-Silo Wagga Wagga',
    'Feed barley, good quality, available ex-silo. Protein 11%, moisture 10.5%.',
    'tonne', 290.00, 290.00, 500, 25,
    1000.0, 'offers', FALSE, 400,
    '{"street":"12 Silo Rd","suburb":"Wagga Wagga","state":"NSW","postcode":"2650","country":"AU"}',
    -35.1082, 147.3598, FALSE, 'verified',
    NOW() + INTERVAL '90 days'
  );

-- ============================================================
-- FEED TESTS
-- ============================================================

INSERT INTO feed_tests (
  id, listing_id, uploaded_by, source, lab_name, test_date,
  dry_matter, moisture, crude_protein, metabolisable_energy,
  ndf, adf, digestibility, afia_grade, rfv, fei, ash, verified
)
VALUES
  -- Lucerne listing — lab test (A1)
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'lab', 'AgriFoodTech Laboratories', '2024-11-15',
    90.5, 9.5, 22.3, 10.8, 38.2, 28.1, 72.4, 'A1', 185.2, 8.9, 8.1, TRUE
  ),
  -- Lucerne listing — on-farm NIR
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'on_farm_nir', NULL, '2024-11-20',
    89.8, 10.2, 21.8, 10.5, 39.1, 29.0, 71.2, 'A2', 178.4, 8.5, 8.3, FALSE
  ),
  -- Oaten hay — on-farm NIR
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'on_farm_nir', NULL, '2024-11-18',
    88.0, 12.0, 8.5, 8.2, 62.3, 38.5, 58.1, 'B2', 98.5, 5.2, 6.8, FALSE
  ),
  -- Wheat grain — lab test
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'lab', 'NSW DPI Analytical Lab', '2024-10-30',
    88.5, 11.5, 10.5, 13.2, 14.2, 4.8, 88.5, 'ungraded', NULL, NULL, 1.8, TRUE
  ),
  -- Barley grain — lab test
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    'lab', 'NSW DPI Analytical Lab', '2024-11-01',
    89.5, 10.5, 11.2, 13.5, 18.5, 6.2, 85.2, 'ungraded', NULL, NULL, 2.1, TRUE
  );

-- ============================================================
-- OFFERS
-- ============================================================

INSERT INTO offers (
  id, listing_id, buyer_id, status, price_per_unit, quantity,
  total_price, freight_included, delivery_date, message
)
VALUES
  -- Offer on lucerne (accepted)
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'accepted', 26.50, 100,
    2650.00, FALSE, '2024-12-15',
    'Happy to take 100 bales at $26.50 each. Can arrange own transport.'
  ),
  -- Offer on lucerne (rejected)
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000005',
    'rejected', 24.00, 50,
    1200.00, FALSE, '2024-12-20',
    'Offering $24 per bale for 50 bales.'
  ),
  -- Offer on wheat (pending)
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'pending', 310.00, 100,
    31000.00, FALSE, '2025-01-10',
    'Interested in 100 tonnes at $310/t. Please confirm availability.'
  ),
  -- Offer on barley (pending)
  (
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    'pending', 285.00, 50,
    14250.00, FALSE, '2025-01-15',
    'Can we do $285/t for 50 tonnes?'
  );

-- ============================================================
-- ORDERS
-- ============================================================

INSERT INTO orders (
  id, order_number, offer_id, listing_id, buyer_id, seller_id, carrier_id,
  status, total_amount, freight_amount, platform_fee,
  payment_held, stripe_payment_intent_id, quality_assurance_level,
  delivery_evidence, confirmed_at
)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    'RA-SEED001',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000006',
    'completed',
    2650.00, 0.00, 132.50,
    FALSE, 'pi_seed_test_001', 'performance',
    '{"photos":["https://example.com/pod1.jpg"],"notes":"Delivered in good condition"}',
    NOW() - INTERVAL '5 days'
  );

-- ============================================================
-- FREIGHT JOBS
-- ============================================================

INSERT INTO freight_jobs (
  id, order_id, posted_by, carrier_id, status,
  pickup_address, pickup_lat, pickup_lng,
  delivery_address, delivery_lat, delivery_lng,
  material_type, material_desc, weight_kg,
  required_by, price_offered, price_agreed,
  assigned_at, delivered_at
)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000006',
    'delivered',
    '{"street":"45 Farm Rd","suburb":"Shepparton","state":"VIC","postcode":"3630","country":"AU"}',
    -36.3833, 145.3978,
    '{"street":"88 Station Rd","suburb":"Dubbo","state":"NSW","postcode":"2830","country":"AU"}',
    -32.2569, 148.6011,
    'hay', '100 x large square lucerne bales', 12000.0,
    '2024-12-15', 850.00, 800.00,
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'
  ),
  -- Standalone freight job (open)
  (
    '50000000-0000-0000-0000-000000000002',
    NULL,
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'open',
    '{"street":"12 Silo Rd","suburb":"Wagga Wagga","state":"NSW","postcode":"2650","country":"AU"}',
    -35.1082, 147.3598,
    '{"street":"88 Station Rd","suburb":"Dubbo","state":"NSW","postcode":"2830","country":"AU"}',
    -32.2569, 148.6011,
    'grain', '50 tonnes feed wheat', 50000.0,
    '2025-01-20', 1200.00, NULL,
    NULL, NULL
  );

-- ============================================================
-- WEIGH EVENTS
-- ============================================================

INSERT INTO weigh_events (
  id, order_id, freight_job_id, recorded_by, source,
  source_system, source_ticket_id, site_name, vehicle_rego,
  gross_weight, tare_weight, net_weight, weight_unit,
  weighed_at, operator_name, trade_approved, verified,
  verified_by, verified_at, settlement_status
)
VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000006',
    'api',
    'Loadrite v3', 'TKT-20241210-001', 'Shepparton Weighbridge',
    'ABC123',
    32500.0, 20500.0, 12000.0, 'kg',
    NOW() - INTERVAL '10 days', 'J. Smith',
    TRUE, TRUE,
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '9 days',
    'settled'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000006',
    'manual',
    NULL, NULL, 'Dubbo Weighbridge',
    'ABC123',
    32450.0, 20500.0, 11950.0, 'kg',
    NOW() - INTERVAL '6 days', 'T. Jones',
    TRUE, TRUE,
    '00000000-0000-0000-0000-000000000004',
    NOW() - INTERVAL '5 days',
    'settled'
  );

-- ============================================================
-- PROOF OF DELIVERY
-- ============================================================

INSERT INTO proof_of_delivery (
  id, order_id, submitted_by, status, photo_urls, notes,
  gps_lat, gps_lng, weigh_event_id, reviewed_by, reviewed_at
)
VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000006',
    'accepted',
    '["https://example.com/pod1.jpg","https://example.com/pod2.jpg"]',
    'All 100 bales delivered in good condition. Stacked in shed as requested.',
    -32.2569, 148.6011,
    '60000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    NOW() - INTERVAL '5 days'
  );

-- ============================================================
-- REVIEWS
-- ============================================================

INSERT INTO reviews (id, order_id, reviewer_id, reviewee_id, rating, comment, role)
VALUES
  -- Buyer reviews seller
  (
    '80000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    5, 'Excellent quality hay, exactly as described. Would buy again.', 'seller'
  ),
  -- Seller reviews buyer
  (
    '80000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    5, 'Great buyer, prompt payment and communication.', 'buyer'
  ),
  -- Buyer reviews carrier
  (
    '80000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000006',
    5, 'FastHaul delivered on time and handled the bales carefully.', 'carrier'
  );

COMMIT;
