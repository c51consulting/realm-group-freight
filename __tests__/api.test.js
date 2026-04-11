/**
 * Integration tests for the REALM Ag Marketplace API.
 *
 * Run with: npm test
 *
 * Requires a running PostgreSQL database. Set TEST_DATABASE_URL in your
 * environment, or the tests will use DATABASE_URL with a '_test' suffix.
 *
 * Tests are ordered to exercise the full user journey:
 *   register → login → create listing → submit offer → accept offer
 *   → create order → update status → weigh events → reviews
 */

'use strict';

const http = require('http');
const assert = require('assert');

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

/**
 * Minimal fetch-like helper using Node's built-in http module.
 * Returns { status, body } where body is parsed JSON.
 */
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const get = (path, token) => request('GET', path, null, token);
const post = (path, body, token) => request('POST', path, body, token);
const put = (path, body, token) => request('PUT', path, body, token);
const del = (path, token) => request('DELETE', path, null, token);

// ─── Test State ───────────────────────────────────────────────────────────────

let sellerToken, buyerToken, carrierToken;
let sellerId, buyerId, carrierId;
let listingId, offerId, orderId, weighEventId;

const timestamp = Date.now();
const sellerEmail = `seller_${timestamp}@test.realm.ag`;
const buyerEmail = `buyer_${timestamp}@test.realm.ag`;
const carrierEmail = `carrier_${timestamp}@test.realm.ag`;

// ─── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function suite(name) {
  console.log(`\n📋 ${name}`);
}

function assertStatus(res, expected, context = '') {
  assert.strictEqual(
    res.status,
    expected,
    `${context} Expected status ${expected}, got ${res.status}. Body: ${JSON.stringify(res.body)}`
  );
}

function assertField(obj, field, context = '') {
  assert.ok(
    obj[field] !== undefined && obj[field] !== null,
    `${context} Expected field '${field}' to exist. Got: ${JSON.stringify(obj)}`
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n🌾 REALM Ag Marketplace — Integration Tests');
  console.log(`   API: ${BASE_URL}\n`);

  // ── Health Check ────────────────────────────────────────────────────────────

  suite('Health Check');

  await test('GET /health returns 200', async () => {
    const res = await get('/health');
    assertStatus(res, 200, 'Health check:');
    assert.strictEqual(res.body.status, 'ok');
    assertField(res.body, 'service');
  });

  await test('GET / returns API info', async () => {
    const res = await get('/');
    assertStatus(res, 200, 'Root:');
    assertField(res.body, 'name');
    assertField(res.body, 'endpoints');
  });

  // ── Auth Flow ───────────────────────────────────────────────────────────────

  suite('Auth — Register');

  await test('Register seller account', async () => {
    const res = await post('/api/auth/register', {
      email: sellerEmail,
      password: 'TestPass123!',
      businessName: 'Smith Farms',
      abn: '12345678901',
      phone: '0412345678',
      role: 'seller',
    });
    assertStatus(res, 201, 'Register seller:');
    assertField(res.body, 'token');
    assertField(res.body, 'user');
    sellerToken = res.body.token;
    sellerId = res.body.user.id;
    assert.strictEqual(res.body.user.role, 'seller');
  });

  await test('Register buyer account', async () => {
    const res = await post('/api/auth/register', {
      email: buyerEmail,
      password: 'TestPass123!',
      businessName: 'Jones Livestock',
      role: 'buyer',
    });
    assertStatus(res, 201, 'Register buyer:');
    buyerToken = res.body.token;
    buyerId = res.body.user.id;
  });

  await test('Register carrier account', async () => {
    const res = await post('/api/auth/register', {
      email: carrierEmail,
      password: 'TestPass123!',
      businessName: 'FastFreight Pty Ltd',
      role: 'carrier',
    });
    assertStatus(res, 201, 'Register carrier:');
    carrierToken = res.body.token;
    carrierId = res.body.user.id;
  });

  await test('Reject duplicate email registration', async () => {
    const res = await post('/api/auth/register', {
      email: sellerEmail,
      password: 'TestPass123!',
      role: 'seller',
    });
    assertStatus(res, 400, 'Duplicate email:');
    assertField(res.body, 'error');
  });

  suite('Auth — Login');

  await test('Login with valid credentials', async () => {
    const res = await post('/api/auth/login', {
      email: sellerEmail,
      password: 'TestPass123!',
    });
    assertStatus(res, 200, 'Login:');
    assertField(res.body, 'token');
    assert.strictEqual(res.body.user.email, sellerEmail);
  });

  await test('Reject invalid password', async () => {
    const res = await post('/api/auth/login', {
      email: sellerEmail,
      password: 'wrongpassword',
    });
    assertStatus(res, 401, 'Invalid password:');
  });

  await test('Reject unknown email', async () => {
    const res = await post('/api/auth/login', {
      email: 'nobody@test.realm.ag',
      password: 'TestPass123!',
    });
    assertStatus(res, 401, 'Unknown email:');
  });

  suite('Auth — Profile');

  await test('GET /api/auth/me returns current user', async () => {
    const res = await get('/api/auth/me', sellerToken);
    assertStatus(res, 200, 'Me:');
    assert.strictEqual(res.body.email, sellerEmail);
    assert.ok(!res.body.passwordHash, 'passwordHash should not be exposed');
  });

  await test('GET /api/auth/me rejects missing token', async () => {
    const res = await get('/api/auth/me');
    assertStatus(res, 401, 'No token:');
  });

  // ── Listings CRUD ───────────────────────────────────────────────────────────

  suite('Listings — CRUD');

  await test('Create a hay listing', async () => {
    const res = await post('/api/listings', {
      userId: sellerId,
      type: 'sell',
      materialType: 'hay',
      title: 'Premium Lucerne Hay — Small Bales',
      description: 'High-quality lucerne hay, freshly baled. Excellent for horses and cattle.',
      unitType: 'bale_small',
      pricePerUnit: 12.50,
      quantityAvailable: 500,
      minimumOrder: 50,
      estimatedWeightPerUnit: 25,
      pricingType: 'fixed',
      freightIncluded: false,
      qualityLevel: 'basic',
      pickupAddress: { suburb: 'Dubbo', state: 'NSW', postcode: '2830' },
    }, sellerToken);
    assertStatus(res, 201, 'Create listing:');
    assertField(res.body, 'id');
    listingId = res.body.id;
    assert.strictEqual(res.body.materialType, 'hay');
    assert.strictEqual(res.body.status, 'active');
    // Auto-calculated price per tonne
    assert.ok(res.body.pricePerTonneEquiv, 'pricePerTonneEquiv should be calculated');
  });

  await test('GET /api/listings returns active listings', async () => {
    const res = await get('/api/listings');
    assertStatus(res, 200, 'List listings:');
    assertField(res.body, 'listings');
    assertField(res.body, 'total');
    assert.ok(Array.isArray(res.body.listings));
  });

  await test('Filter listings by materialType', async () => {
    const res = await get('/api/listings?materialType=hay');
    assertStatus(res, 200, 'Filter by material:');
    assert.ok(res.body.listings.every((l) => l.materialType === 'hay'));
  });

  await test('GET /api/listings/:id returns listing detail', async () => {
    const res = await get(`/api/listings/${listingId}`);
    assertStatus(res, 200, 'Get listing:');
    assert.strictEqual(res.body.id, listingId);
    assertField(res.body, 'seller');
  });

  await test('GET /api/listings/:id returns 404 for unknown ID', async () => {
    const res = await get('/api/listings/00000000-0000-0000-0000-000000000000');
    assertStatus(res, 404, 'Unknown listing:');
  });

  await test('PUT /api/listings/:id updates listing', async () => {
    const res = await put(`/api/listings/${listingId}`, {
      description: 'Updated description — now with delivery available.',
      freightIncluded: true,
    }, sellerToken);
    assertStatus(res, 200, 'Update listing:');
    assert.strictEqual(res.body.freightIncluded, true);
  });

  // ── Offer Workflow ──────────────────────────────────────────────────────────

  suite('Offers — Workflow');

  await test('Submit offer on listing', async () => {
    const res = await post('/api/offers', {
      listingId,
      buyerId,
      pricePerUnit: 11.00,
      quantity: 100,
      freightIncluded: false,
      message: 'Happy to collect from farm.',
    }, buyerToken);
    assertStatus(res, 201, 'Create offer:');
    assertField(res.body, 'id');
    offerId = res.body.id;
    assert.strictEqual(res.body.status, 'pending');
    assert.strictEqual(Number(res.body.totalPrice), 1100);
  });

  await test('Submit second offer on same listing', async () => {
    const res = await post('/api/offers', {
      listingId,
      buyerId,
      pricePerUnit: 11.50,
      quantity: 50,
      freightIncluded: false,
    }, buyerToken);
    assertStatus(res, 201, 'Second offer:');
  });

  await test('GET /api/offers/listing/:id returns all offers', async () => {
    const res = await get(`/api/offers/listing/${listingId}`, sellerToken);
    assertStatus(res, 200, 'List offers:');
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2);
  });

  await test('Reject offer on non-existent listing', async () => {
    const res = await post('/api/offers', {
      listingId: '00000000-0000-0000-0000-000000000000',
      buyerId,
      pricePerUnit: 10,
      quantity: 10,
    }, buyerToken);
    assertStatus(res, 400, 'Offer on bad listing:');
  });

  await test('Accept offer (auto-rejects others)', async () => {
    const res = await put(`/api/offers/${offerId}/accept`, {}, sellerToken);
    assertStatus(res, 200, 'Accept offer:');
    assert.strictEqual(res.body.status, 'accepted');
  });

  await test('Reject offer', async () => {
    // Create a fresh offer to reject
    const offerRes = await post('/api/offers', {
      listingId,
      buyerId,
      pricePerUnit: 10.00,
      quantity: 20,
    }, buyerToken);
    const newOfferId = offerRes.body.id;

    const res = await put(`/api/offers/${newOfferId}/reject`, {}, sellerToken);
    assertStatus(res, 200, 'Reject offer:');
    assert.strictEqual(res.body.status, 'rejected');
  });

  // ── Order Creation & Status ─────────────────────────────────────────────────

  suite('Orders — Creation & Status Transitions');

  await test('Create order from accepted offer', async () => {
    const res = await post('/api/orders', { offerId }, sellerToken);
    assertStatus(res, 201, 'Create order:');
    assertField(res.body, 'id');
    orderId = res.body.id;
    assertField(res.body, 'orderNumber');
    assert.ok(res.body.orderNumber.startsWith('RA-'));
    assert.strictEqual(res.body.status, 'pending_payment');
    // Platform fee should be 5%
    const expectedFee = Number(res.body.totalAmount) * 0.05;
    assert.ok(
      Math.abs(Number(res.body.platformFee) - expectedFee) < 0.01,
      `Platform fee should be 5%. Got ${res.body.platformFee}, expected ~${expectedFee}`
    );
  });

  await test('Reject order creation from non-accepted offer', async () => {
    // Create a new offer (pending status)
    const offerRes = await post('/api/offers', {
      listingId,
      buyerId,
      pricePerUnit: 9.00,
      quantity: 10,
    }, buyerToken);
    const pendingOfferId = offerRes.body.id;

    const res = await post('/api/orders', { offerId: pendingOfferId }, sellerToken);
    assertStatus(res, 400, 'Order from pending offer:');
  });

  await test('GET /api/orders/:id returns order detail', async () => {
    const res = await get(`/api/orders/${orderId}`, sellerToken);
    assertStatus(res, 200, 'Get order:');
    assert.strictEqual(res.body.id, orderId);
    assertField(res.body, 'buyer');
    assertField(res.body, 'seller');
  });

  await test('Update order status to paid', async () => {
    const res = await put(`/api/orders/${orderId}/status`, { status: 'paid' }, sellerToken);
    assertStatus(res, 200, 'Status → paid:');
    assert.strictEqual(res.body.status, 'paid');
  });

  await test('Update order status to in_transit', async () => {
    const res = await put(`/api/orders/${orderId}/status`, { status: 'in_transit' }, carrierToken);
    assertStatus(res, 200, 'Status → in_transit:');
    assert.strictEqual(res.body.status, 'in_transit');
  });

  await test('Update order status to delivered with evidence', async () => {
    const res = await put(`/api/orders/${orderId}/status`, {
      status: 'delivered',
      deliveryEvidence: {
        receiverName: 'John Jones',
        deliveredAt: new Date().toISOString(),
        photoCount: 2,
      },
    }, carrierToken);
    assertStatus(res, 200, 'Status → delivered:');
    assert.strictEqual(res.body.status, 'delivered');
    assertField(res.body.deliveryEvidence, 'receiverName');
  });

  await test('Confirm delivery (buyer)', async () => {
    const res = await put(`/api/orders/${orderId}/status`, { status: 'confirmed' }, buyerToken);
    assertStatus(res, 200, 'Status → confirmed:');
    assert.strictEqual(res.body.status, 'confirmed');
    assert.ok(res.body.confirmedAt);
  });

  await test('Complete order (payment release)', async () => {
    const res = await put(`/api/orders/${orderId}/status`, { status: 'completed' }, sellerToken);
    assertStatus(res, 200, 'Status → completed:');
    assert.strictEqual(res.body.status, 'completed');
    assert.ok(res.body.paymentReleasedAt);
  });

  await test('GET /api/orders/user/:userId returns user orders', async () => {
    const res = await get(`/api/orders/user/${buyerId}`, buyerToken);
    assertStatus(res, 200, 'User orders:');
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
  });

  // ── Weigh Event Ingestion ───────────────────────────────────────────────────

  suite('Weighbridge — Event Ingestion');

  await test('Ingest weigh event via API', async () => {
    const res = await post('/api/weighbridge/api', {
      orderId,
      sourceSystem: 'ScaleLink Pro',
      sourceTicketId: `TKT-${timestamp}`,
      siteId: 'SITE-001',
      siteName: 'Dubbo Weighbridge',
      vehicleRego: 'ABC123',
      grossWeight: 42500,
      tareWeight: 18000,
      netWeight: 24500,
      weightUnit: 'kg',
      weighedAt: new Date().toISOString(),
      operatorName: 'Dave Smith',
      tradeApproved: true,
    }, sellerToken);
    assertStatus(res, 201, 'API weigh event:');
    assertField(res.body, 'id');
    weighEventId = res.body.id;
    assert.strictEqual(res.body.source, 'api');
    assert.strictEqual(Number(res.body.netWeight), 24500);
  });

  await test('Submit manual weigh event', async () => {
    const res = await post('/api/weighbridge/manual', {
      orderId,
      vehicleRego: 'XYZ789',
      grossWeight: 38000,
      tareWeight: 16000,
      netWeight: 22000,
      weightUnit: 'kg',
      weighedAt: new Date().toISOString(),
    }, sellerToken);
    assertStatus(res, 201, 'Manual weigh event:');
    assert.strictEqual(res.body.source, 'manual');
    assert.strictEqual(res.body.verified, false);
  });

  await test('GET /api/weighbridge/order/:orderId returns events', async () => {
    const res = await get(`/api/weighbridge/order/${orderId}`, sellerToken);
    assertStatus(res, 200, 'Order weigh events:');
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2);
  });

  await test('Verify a weigh event', async () => {
    const res = await put(`/api/weighbridge/${weighEventId}/verify`, {
      userId: sellerId,
    }, sellerToken);
    assertStatus(res, 200, 'Verify event:');
    assert.strictEqual(res.body.verified, true);
    assert.strictEqual(res.body.settlementStatus, 'matched');
  });

  // ── Feed Tests ──────────────────────────────────────────────────────────────

  suite('Feed Tests');

  await test('Add on-farm NIR feed test to listing', async () => {
    const res = await post('/api/feedtests', {
      listingId,
      source: 'on_farm_nir',
      testDate: new Date().toISOString(),
      dryMatter: 88.5,
      moisture: 11.5,
      crudeProtein: 18.2,
      metabolisableEnergy: 10.8,
      ndf: 42.1,
      adf: 28.3,
    }, sellerToken);
    assertStatus(res, 201, 'NIR feed test:');
    assertField(res.body, 'id');
    assert.strictEqual(res.body.source, 'on_farm_nir');
  });

  await test('Add lab feed test upgrades listing to verified', async () => {
    const res = await post('/api/feedtests', {
      listingId,
      source: 'lab',
      labName: 'Feedtest Australia',
      testDate: new Date().toISOString(),
      dryMatter: 89.1,
      crudeProtein: 18.8,
      metabolisableEnergy: 11.2,
      afiaGrade: 'A1',
      rfv: 185,
    }, sellerToken);
    assertStatus(res, 201, 'Lab feed test:');
    assert.strictEqual(res.body.verified, true);

    // Listing should now be 'verified' quality
    const listingRes = await get(`/api/listings/${listingId}`);
    assert.strictEqual(listingRes.body.qualityLevel, 'verified');
  });

  await test('GET /api/feedtests/listing/:id returns tests', async () => {
    const res = await get(`/api/feedtests/listing/${listingId}`);
    assertStatus(res, 200, 'List feed tests:');
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2);
  });

  // ── Users & Reviews ─────────────────────────────────────────────────────────

  suite('Users — Profiles & Reviews');

  await test('GET /api/users/:id returns public profile', async () => {
    const res = await get(`/api/users/${sellerId}`);
    assertStatus(res, 200, 'User profile:');
    assert.strictEqual(res.body.id, sellerId);
    assert.ok(!res.body.passwordHash, 'passwordHash must not be exposed');
    assertField(res.body, 'businessName');
  });

  await test('PUT /api/users/:id updates profile', async () => {
    const res = await put(`/api/users/${sellerId}`, {
      businessName: 'Smith Premium Farms',
      phone: '0412999888',
    }, sellerToken);
    assertStatus(res, 200, 'Update profile:');
    assert.strictEqual(res.body.businessName, 'Smith Premium Farms');
  });

  await test('POST /api/users/:id/reviews creates review and updates rating', async () => {
    const res = await post(`/api/users/${sellerId}/reviews`, {
      orderId,
      reviewerId: buyerId,
      rating: 5,
      comment: 'Excellent hay, exactly as described. Fast loading.',
      role: 'seller',
    }, buyerToken);
    assertStatus(res, 201, 'Create review:');
    assertField(res.body, 'id');
    assert.strictEqual(res.body.rating, 5);

    // Seller rating should be updated
    const userRes = await get(`/api/users/${sellerId}`);
    assert.ok(userRes.body.rating > 0, 'Seller rating should be updated');
    assert.strictEqual(userRes.body.reviewCount, 1);
  });

  await test('GET /api/users/:id/reviews returns reviews', async () => {
    const res = await get(`/api/users/${sellerId}/reviews`);
    assertStatus(res, 200, 'User reviews:');
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
    assertField(res.body[0], 'rating');
  });

  await test('DELETE /api/listings/:id cancels listing', async () => {
    const res = await del(`/api/listings/${listingId}`, sellerToken);
    assertStatus(res, 200, 'Cancel listing:');
    assertField(res.body, 'message');
  });

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failures.length > 0) {
    console.log('Failed tests:');
    failures.forEach(({ name, error }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${error}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exit(1);
});
