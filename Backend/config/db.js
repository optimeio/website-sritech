const mongoose = require('mongoose');

const DEFAULT_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sri_tech_db';
const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT || 10000);
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.DB_SERVER_SELECTION_TIMEOUT || 10000);
const SOCKET_TIMEOUT_MS = Number(process.env.DB_SOCKET_TIMEOUT_MS || 15000);

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

    console.log(`✅ MongoDB connected successfully to ${uri}`);
    return { mode: 'MongoDB', connected: true };
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

module.exports = connectDatabase;
