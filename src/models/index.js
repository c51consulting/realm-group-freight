const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
  }
});

// === USER MODEL ===
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  businessName: { type: DataTypes.STRING },
  abn: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('buyer', 'seller', 'carrier', 'admin'), defaultValue: 'buyer' },
  address: { type: DataTypes.JSONB },
  lat: { type: DataTypes.FLOAT },
  lng: { type: DataTypes.FLOAT },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// === LISTING MODEL ===
const Listing = sequelize.define('Listing', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.ENUM('sell', 'buy', 'freight_only'), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'paused', 'sold', 'expired', 'cancelled'), defaultValue: 'active' },
  materialType: { type: DataTypes.ENUM('hay', 'straw', 'silage', 'grain', 'seed', 'pellets', 'fertiliser', 'supplement', 'drums', 'bulk_liquid', 'other'), allowNull: false },
  materialSubtype: { type: DataTypes.STRING },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  unitType: { type: DataTypes.ENUM('bale_small', 'bale_large', 'bale_round', 'bag', 'drum', 'tonne', 'kg', 'load', 'pallet', 'cubic_metre', 'litre', 'custom'), allowNull: false },
  unitLabel: { type: DataTypes.STRING },
  pricePerUnit: { type: DataTypes.DECIMAL(10, 2) },
  pricePerTonneEquiv: { type: DataTypes.DECIMAL(10, 2) },
  quantityAvailable: { type: DataTypes.DECIMAL(10, 2) },
  quantityUnit: { type: DataTypes.STRING },
  minimumOrder: { type: DataTypes.DECIMAL(10, 2) },
  estimatedWeightPerUnit: { type: DataTypes.DECIMAL(10, 2) },
  pricingType: { type: DataTypes.ENUM('fixed', 'offers', 'auction', 'urgent'), defaultValue: 'fixed' },
  freightIncluded: { type: DataTypes.BOOLEAN, defaultValue: false },
  deliveryRadius: { type: DataTypes.INTEGER },
  pickupAddress: { type: DataTypes.JSONB },
  pickupLat: { type: DataTypes.FLOAT },
  pickupLng: { type: DataTypes.FLOAT },
  loadingAvailable: { type: DataTypes.BOOLEAN, defaultValue: false },
  images: { type: DataTypes.JSONB, defaultValue: [] },
  qualityLevel: { type: DataTypes.ENUM('basic', 'verified', 'performance'), defaultValue: 'basic' },
  expiresAt: { type: DataTypes.DATE }
});

// === FEED TEST MODEL ===
const FeedTest = sequelize.define('FeedTest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  source: { type: DataTypes.ENUM('lab', 'on_farm_nir', 'vendor_estimate'), allowNull: false },
  labName: { type: DataTypes.STRING },
  deviceId: { type: DataTypes.STRING },
  testDate: { type: DataTypes.DATE },
  certificateUrl: { type: DataTypes.STRING },
  dryMatter: { type: DataTypes.DECIMAL(5, 2) },
  moisture: { type: DataTypes.DECIMAL(5, 2) },
  crudeProtein: { type: DataTypes.DECIMAL(5, 2) },
  metabolisableEnergy: { type: DataTypes.DECIMAL(5, 2) },
  ndf: { type: DataTypes.DECIMAL(5, 2) },
  adf: { type: DataTypes.DECIMAL(5, 2) },
  digestibility: { type: DataTypes.DECIMAL(5, 2) },
  afiaGrade: { type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'ungraded') },
  rfv: { type: DataTypes.DECIMAL(6, 2) },
  fei: { type: DataTypes.DECIMAL(6, 2) },
  ash: { type: DataTypes.DECIMAL(5, 2) },
  rawData: { type: DataTypes.JSONB },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// === OFFER MODEL ===
const Offer = sequelize.define('Offer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired'), defaultValue: 'pending' },
  pricePerUnit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  totalPrice: { type: DataTypes.DECIMAL(12, 2) },
  freightIncluded: { type: DataTypes.BOOLEAN, defaultValue: false },
  freightPrice: { type: DataTypes.DECIMAL(10, 2) },
  deliveryDate: { type: DataTypes.DATE },
  message: { type: DataTypes.TEXT },
  expiresAt: { type: DataTypes.DATE }
});

// === ORDER MODEL ===
const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderNumber: { type: DataTypes.STRING, unique: true },
  status: { type: DataTypes.ENUM('pending_payment', 'paid', 'in_transit', 'delivered', 'confirmed', 'disputed', 'refunded', 'completed'), defaultValue: 'pending_payment' },
  totalAmount: { type: DataTypes.DECIMAL(12, 2) },
  freightAmount: { type: DataTypes.DECIMAL(10, 2) },
  platformFee: { type: DataTypes.DECIMAL(10, 2) },
  paymentHeld: { type: DataTypes.BOOLEAN, defaultValue: false },
  paymentReleasedAt: { type: DataTypes.DATE },
  stripePaymentIntentId: { type: DataTypes.STRING },
  qualityAssuranceLevel: { type: DataTypes.ENUM('basic', 'verified', 'performance'), defaultValue: 'basic' },
  contractTerms: { type: DataTypes.JSONB },
  deliveryEvidence: { type: DataTypes.JSONB, defaultValue: {} },
  confirmedAt: { type: DataTypes.DATE },
  disputeReason: { type: DataTypes.TEXT }
});

// === WEIGHBRIDGE EVENT MODEL ===
const WeighbridgeEvent = sequelize.define('WeighbridgeEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  source: { type: DataTypes.ENUM('api', 'csv_import', 'email_parse', 'ocr_upload', 'manual'), allowNull: false },
  sourceSystem: { type: DataTypes.STRING },
  sourceTicketId: { type: DataTypes.STRING },
  siteId: { type: DataTypes.STRING },
  siteName: { type: DataTypes.STRING },
  vehicleRego: { type: DataTypes.STRING },
  grossWeight: { type: DataTypes.DECIMAL(10, 2) },
  tareWeight: { type: DataTypes.DECIMAL(10, 2) },
  netWeight: { type: DataTypes.DECIMAL(10, 2) },
  weightUnit: { type: DataTypes.ENUM('kg', 'tonne'), defaultValue: 'kg' },
  weighedAt: { type: DataTypes.DATE },
  operatorName: { type: DataTypes.STRING },
  ticketImageUrl: { type: DataTypes.STRING },
  gpsLat: { type: DataTypes.FLOAT },
  gpsLng: { type: DataTypes.FLOAT },
  tradeApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
  rawData: { type: DataTypes.JSONB },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verifiedBy: { type: DataTypes.UUID },
  settlementStatus: { type: DataTypes.ENUM('pending', 'matched', 'disputed', 'settled'), defaultValue: 'pending' }
});

// === REVIEW MODEL ===
const Review = sequelize.define('Review', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
  role: { type: DataTypes.ENUM('buyer', 'seller', 'carrier') }
});

// === MESSAGE MODEL ===
const Message = sequelize.define('Message', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  readAt: { type: DataTypes.DATE }
});

// === ASSOCIATIONS ===
User.hasMany(Listing, { as: 'listings', foreignKey: 'sellerId' });
Listing.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });

Listing.hasMany(FeedTest, { as: 'feedTests', foreignKey: 'listingId' });
FeedTest.belongsTo(Listing, { foreignKey: 'listingId' });

Listing.hasMany(Offer, { as: 'offers', foreignKey: 'listingId' });
Offer.belongsTo(Listing, { foreignKey: 'listingId' });
User.hasMany(Offer, { as: 'offersMade', foreignKey: 'buyerId' });
Offer.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

Offer.hasOne(Order, { foreignKey: 'offerId' });
Order.belongsTo(Offer, { foreignKey: 'offerId' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
Order.belongsTo(User, { as: 'carrier', foreignKey: 'carrierId' });
Order.belongsTo(Listing, { foreignKey: 'listingId' });

Order.hasMany(WeighbridgeEvent, { as: 'weighEvents', foreignKey: 'orderId' });
WeighbridgeEvent.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(Review, { foreignKey: 'orderId' });
Review.belongsTo(Order, { foreignKey: 'orderId' });
Review.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewerId' });
Review.belongsTo(User, { as: 'reviewee', foreignKey: 'revieweeId' });

Order.hasMany(Message, { foreignKey: 'orderId' });
Message.belongsTo(Order, { foreignKey: 'orderId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

module.exports = {
  sequelize,
  User,
  Listing,
  FeedTest,
  Offer,
  Order,
  WeighbridgeEvent,
  Review,
  Message
};
