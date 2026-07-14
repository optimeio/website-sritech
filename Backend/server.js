const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDatabase = require('./config/db');
require('./config/cloudinary');
require('./config/razorpay');
const errorHandler = require('./middleware/errorHandler');
const { ensureDemoUser } = require('./utils/ensureDemoUser');

const app = express();
const PORT = process.env.PORT || 5000;

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === clientUrl) {
      return callback(null, true);
    }

    callback(null, false);
  },
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));
app.use('/uploads', express.static('uploads'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(apiLimiter);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SriTech E-Commerce API',
      version: '1.0.0',
      description: 'Production-ready backend API for SriTech e-commerce platform.'
    },
    servers: [{ url: `http://localhost:${PORT}` }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SriTech Backend is running smoothly', timestamp: new Date() });
});

const { normalizeProducts } = require('./normalize_products');

const setupRoutes = () => {
  console.log('🔧 Loading route modules...');
  const authRoutes = require('./routes/authRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const userRoutes = require('./routes/userRoutes');
  const categoryRoutes = require('./routes/categoryRoutes');
  const productRoutes = require('./routes/productRoutes');
  const reviewRoutes = require('./routes/reviewRoutes');
  const orderRoutes = require('./routes/orderRoutes');
  const offerRoutes = require('./routes/offerRoutes');
  const supportRoutes = require('./routes/supportRoutes');
  const subscriberRoutes = require('./routes/subscriberRoutes');
  const leadRoutes = require('./routes/leadRoutes');
  const couponRoutes = require('./routes/couponRoutes');
  const heroBannerRoutes = require('./routes/heroBannerRoutes');
  const logRoutes = require('./routes/logRoutes');
  const paymentRoutes = require('./routes/paymentRoutes');
  const invoiceRoutes = require('./routes/invoiceRoutes');
  const returnRoutes = require('./routes/returnRoutes');
  const refundRoutes = require('./routes/refundRoutes');

  console.log('🔌 Registering routes...');
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/products/:productId/reviews', reviewRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/returns', returnRoutes);
  app.use('/api/refunds', refundRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/subscribers', subscriberRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/hero-banners', heroBannerRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/logs', logRoutes);
  console.log('✅ All routes registered');
};

const setupErrorHandling = () => {
  // 404 middleware - must be after all routes
  app.use((req, res, next) => {
    const error = new Error('Endpoint not found');
    error.statusCode = 404;
    next(error);
  });

  // Global error handler
  app.use(errorHandler);
};

const seedCategories = async () => {
  const Category = require('./models/Category');
  const count = await Category.countDocuments();
  if (count === 0) {
    const defaultCategories = [
      { name: 'Engraining Products', slug: 'engraining-products' },
      { name: 'Stoves', slug: 'stoves' },
      { name: 'Home Appliances', slug: 'home-appliances' },
      { name: 'Welding Products', slug: 'welding-products' }
    ];
    await Category.insertMany(defaultCategories);
    console.log('🌱 Default categories seeded');
  }
};

const buildCategoryLabel = categoryValue => {
  if (!categoryValue) return 'Uncategorized';
  const value = String(categoryValue).trim();
  const normalized = value.toLowerCase();
  const mapping = {
    'stoves': 'Stoves',
    'welding-products': 'Welding Products',
    'welding products': 'Welding Products',
    'home-appliances': 'Home Appliances',
    'home appliances': 'Home Appliances',
    'engraining-products': 'Engraining Products',
    'engraining products': 'Engraining Products'
  };
  if (mapping[normalized]) return mapping[normalized];

  return value
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const seedProducts = async () => {
  const Product = require('./models/Product');
  try {
    await Product.schema.index({ createdAt: -1 });
    if (Product.ensureIndexes) {
      await Product.ensureIndexes().catch(err => console.warn('Index creation warning:', err));
    }
  } catch (err) {
    console.warn('Unable to create products index:', err.message);
  }
  const count = await Product.countDocuments();
  if (count === 0) {
    let defaultProducts = [];

    try {
      const jsonProducts = normalizeProducts();
      if (Array.isArray(jsonProducts) && jsonProducts.length > 0) {
        defaultProducts = jsonProducts.map(p => ({
          name: p.name,
          price: p.price,
          category: buildCategoryLabel(Array.isArray(p.category) ? p.category[0] : p.category),
          icon: p.icon || 'fa-box',
          images: Array.isArray(p.images) ? p.images : [],
          isNewArrival: !!p.isNewArrival,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
        }));
        console.log(`🌱 Seeding ${defaultProducts.length} products from db.json`);
      }
    } catch (err) {
      console.warn('⚠️ Failed to normalize db.json products:', err.message);
    }

    if (defaultProducts.length === 0) {
      defaultProducts = [
        {
          name: 'Rocket Stove',
          price: '₹3,999',
          category: 'Stoves',
          icon: 'fa-fire',
          isNewArrival: true,
          images: ['/rocket-stove.png']
        },
        {
          name: '10" Stove',
          price: '₹4,499',
          category: 'Stoves',
          icon: 'fa-burn',
          images: ['/hero-image.png']
        },
        {
          name: 'Rocket Stove Pro',
          price: '₹5,499',
          category: 'Stoves',
          icon: 'fa-fire-flame-simple',
          images: ['/rocket-stove.png']
        },
        {
          name: 'Stove Cooking Plate Kit',
          price: '₹1,299',
          category: 'Stoves',
          icon: 'fa-hot-tub-person',
          images: ['/hero-image.png']
        },
        {
          name: 'Home Appliance Starter Kit',
          price: '₹1,999',
          category: 'Home Appliances',
          icon: 'fa-house',
          images: ['/hero-banner.png']
        },
        {
          name: 'Engraining Premium Pack',
          price: '₹2,999',
          category: 'Engraining Products',
          icon: 'fa-screwdriver-wrench',
          images: ['/rocket-stove.png']
        },
        {
          name: 'SriTech Welding Torch',
          price: '₹2,499',
          category: 'Welding Products',
          icon: 'fa-fire-flame-curved',
          isNewArrival: true,
          images: ['/hero-image.png']
        }
      ];
    }

    await Product.insertMany(defaultProducts);
    console.log('🌱 Default products seeded');
  }
};

const startServer = async () => {
  try {
    console.log('📍 Connecting to database...');
    const dbInfo = await connectDatabase();
    console.log('📍 Setting up routes...');
    setupRoutes();
    console.log('✅ Routes setup complete');
    
    console.log('📍 Setting up error handling...');
    setupErrorHandling();
    console.log('✅ Error handling setup complete');

    if (dbInfo.mode === 'Mock') {
      console.warn('⚠️ MongoDB unavailable: running in mock fallback mode with Backend/db.json');
      connectDatabase.monitorMongoAvailability && connectDatabase.monitorMongoAvailability();
    }

    if (dbInfo.mode === 'MongoDB' || dbInfo.mode === 'Mock') {
      console.log('📍 Seeding default categories...');
      await seedCategories();
      console.log('📍 Seeding default products...');
      await seedProducts();
      console.log('📍 Ensuring demo user account...');
      await ensureDemoUser();
    } else {
      console.warn('⚠️ Skipping category and product seeding because no usable database mode is available.');
    }

    app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

startServer();
