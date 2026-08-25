const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const dotenv = require('dotenv');
const fs = require('fs');

// Safety check: Delete oversized db.json to prevent OOM crashes on Render
try {
  const dbPath = path.join(__dirname, 'db.json');
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    if (stats.size > 5 * 1024 * 1024) { // 5MB limit
      console.warn(`⚠️ Warning: db.json is too large (${Math.round(stats.size / 1024 / 1024)}MB). Deleting to prevent OOM crash.`);
      fs.unlinkSync(dbPath);
    }
  }
} catch (e) {
  console.error('Error checking db.json size:', e);
}

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDatabase = require('./config/db');
const mongoose = require('mongoose');
require('./config/cloudinary');
require('./config/razorpay');
const errorHandler = require('./middleware/errorHandler');
const { ensureDemoUser } = require('./utils/ensureDemoUser');

const app = express();
const PORT = process.env.PORT || 5000;

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    const isSritechDomain = origin === 'https://website.sritechengg.in' || origin.endsWith('.sritechengg.in');
    const isRenderDomain = origin.endsWith('.onrender.com');

    if (isLocalhost || origin === clientUrl || isSritechDomain || isRenderDomain) {
      return callback(null, true);
    }
    return callback(null, true); // Allow origin to prevent CORS blocking on live
  },
  credentials: true
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  skip: (req) => req.method === 'OPTIONS' || req.method === 'GET',
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
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
  app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'SriTech Backend API is running' });
  });
  app.get('/api/debug-state', (req, res) => {
    res.json({
      readyState: mongoose.connection?.readyState,
      fallbackLength: require('./controllers/productController').fallbackProducts?.length
    });
  });
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
  // 404 middleware for API routes - must be after all routes
  app.use('/api', (req, res, next) => {
    const error = new Error('API Endpoint not found');
    error.statusCode = 404;
    next(error);
  });

  // Serve frontend in production for non-API routes
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../Frontend/dist')));
    app.use((req, res, next) => {
      if (req.method === 'GET') {
        res.sendFile(path.resolve(__dirname, '../Frontend/dist', 'index.html'));
      } else {
        next();
      }
    });
  } else {
    // 404 fallback for non-API routes in dev mode
    app.use((req, res, next) => {
      const error = new Error('Endpoint not found');
      error.statusCode = 404;
      next(error);
    });
  }

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
      console.log('🌱 No default products to seed (hardcoded defaults removed)');
      return;
    }

    await Product.insertMany(defaultProducts);
    console.log('🌱 Default products seeded');
  }
};

const startServer = async () => {
  // Setup routes and error handling first so server starts fast
  console.log('📍 Setting up routes...');
  setupRoutes();
  console.log('✅ Routes setup complete');
  console.log('📍 Setting up error handling...');
  setupErrorHandling();
  console.log('✅ Error handling setup complete');

  // Start listening immediately so proxy doesn't get ECONNREFUSED
  app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));

  // Connect to database in background (non-blocking)
  try {
    console.log('📍 Connecting to database...');
    await connectDatabase();

    const runWithTimeout = (promise, name) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after 12000ms`)), 12000))
      ]);
    };

    console.log('📍 Seeding default categories...');
    await runWithTimeout(seedCategories(), 'Category seeding').catch(e => {
      console.warn('⚠️ Category seed warning:', e.message);
    });

    console.log('📍 Seeding default products...');
    await runWithTimeout(seedProducts(), 'Product seeding').catch(e => {
      console.warn('⚠️ Product seed warning:', e.message);
    });

    console.log('📍 Ensuring demo user account...');
    await runWithTimeout(ensureDemoUser(), 'Ensuring demo user').catch(e => {
      console.warn('⚠️ Demo user warning:', e.message);
    });
  } catch (err) {
    // Database connection failed, app should still run but API will fail
    console.warn('⚠️ Database startup error (server still running):', err.message);
  }
};

startServer();

// Prevent clean exit behavior during local development
setInterval(() => { }, 1000 * 60 * 60);
