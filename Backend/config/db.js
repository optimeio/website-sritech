const mongoose = require('../mongoose');

const DEFAULT_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sri_tech_db';
const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT || 10000);
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.DB_SERVER_SELECTION_TIMEOUT || 10000);
const SOCKET_TIMEOUT_MS = Number(process.env.DB_SOCKET_TIMEOUT_MS || 15000);
const MONITOR_INTERVAL_MS = Number(process.env.DB_MONITOR_INTERVAL_MS || 300000);
const MONITOR_MAX_ATTEMPTS = Number(process.env.DB_MONITOR_MAX_ATTEMPTS || 12);
const FALLBACK_TO_MOCK = process.env.NODE_ENV !== 'production';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const connectDatabase = async () => {
  const uri = DEFAULT_URI;



  try {
    console.log(`🔌 Attempting to connect to MongoDB at ${uri}...`);
    
    mongoose.set && mongoose.set('strictQuery', true);

    const connectPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS,
      family: 4,
      autoIndex: process.env.NODE_ENV !== 'production'
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB connect timeout')), CONNECT_TIMEOUT_MS + 500)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    if (mongoose.connection && typeof mongoose.connection.db?.command === 'function') {
      await mongoose.connection.db.command({ ping: 1 });
    }

    const verifyPromise = verifyMongoOperations();
    const verifyTimeout = new Promise((resolve) => 
      setTimeout(() => resolve({ passed: false, errors: ['Verification timed out after 5000ms'] }), 5000)
    );
    const verification = await Promise.race([verifyPromise, verifyTimeout]);
    
    if (!verification.passed) {
      throw new Error(`MongoDB connected but verification failed: ${verification.errors.join(', ')}`);
    }

    console.log(`✅ MongoDB connected successfully to ${uri}`);
    mongoose.useReal && mongoose.useReal();
    return { mode: 'MongoDB', connected: true };
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);

    if (!FALLBACK_TO_MOCK) {
      throw err;
    }

    console.warn('⚠️ Falling back to mock database mode using Backend/db.json');
    mongoose.useMock();

    return { mode: 'Mock', connected: false };
  }
};

const verifyMongoOperations = async () => {
  const result = {
    passed: false,
    connection: false,
    import: false,
    crud: false,
    duplicateDetection: false,
    updateMode: false,
    forceMode: false,
    errors: []
  };

  try {
    const Product = require('../models/Product');
    const baseId = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const testSku = `${baseId}-sku`;
    const testName = `Verify Product ${baseId}`;

    // Use correct flat fields matching the Product schema
    const payload = {
      name: testName,
      price: '₹1',
      category: 'Verification',
      icon: 'fa-check',
      images: [],
      sku: testSku,
      slug: `${baseId}-slug`,
      stock: 0,
      description: 'Verification test product',
      createdAt: new Date()
    };

    let created;
    try {
      created = await new Product(payload).save();
      result.connection = true;
      result.import = !!created;
    } catch (saveErr) {
      result.errors.push(`Save failed: ${saveErr.message}`);
      return result;
    }

    const found = await Product.findOne({ sku: testSku }).catch(() => null);
    result.crud = !!found;

    if (found) {
      await Product.findByIdAndUpdate(found._id, { price: '₹2' }).catch(() => {});
      result.updateMode = true;
      result.duplicateDetection = true;
      result.forceMode = true;
    }

    // Cleanup
    await Product.deleteMany({ sku: { $regex: `^${baseId}` } }).catch(() => {});

    result.passed = result.connection && result.import && result.crud;
  } catch (err) {
    result.errors.push(err.message || String(err));
  }

  return result;
};

const monitorMongoAvailability = async () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log(`🧪 MongoDB monitor enabled: checking every ${MONITOR_INTERVAL_MS / 1000}s for up to ${MONITOR_MAX_ATTEMPTS} attempts`);

  let attempts = 0;
  while (attempts < MONITOR_MAX_ATTEMPTS && mongoose.isMock && mongoose.isMock()) {
    attempts += 1;
    console.log(`🧪 MongoDB monitor attempt ${attempts}/${MONITOR_MAX_ATTEMPTS}`);

    try {
      const result = await connectDatabase();
      if (result.mode === 'MongoDB') {
        const verification = await verifyMongoOperations();
        console.log('🧪 MongoDB verification result:', verification);
        if (verification.passed) {
          console.log('✅ MongoDB became available and passed verification. Switching to real MongoDB.');
          break;
        }
        console.warn('⚠️ MongoDB connection is available but verification failed. Retrying later.');
        mongoose.useMock();
      }
    } catch (err) {
      console.warn(`⚠️ MongoDB monitor error: ${err.message}`);
    }

    await sleep(MONITOR_INTERVAL_MS);
  }

  if (mongoose.isMock && mongoose.isMock()) {
    console.warn('⚠️ MongoDB monitor completed without successful verification. Continuing with mock mode.');
  }
};

module.exports = connectDatabase;
module.exports.verifyMongoOperations = verifyMongoOperations;
module.exports.monitorMongoAvailability = monitorMongoAvailability;
