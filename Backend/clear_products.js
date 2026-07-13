const mongoose = require('./mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Category = require('./models/Category');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}

// Custom mongoose file connects internally, but let's connect it here
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB database.");
    
    // Clear products using proxy model
    const deletedProducts = await Product.deleteMany({});
    console.log(`Successfully deleted ${deletedProducts.deletedCount} products from database.`);
    
    // Clear categories
    const deletedCategories = await Category.deleteMany({});
    console.log(`Successfully deleted ${deletedCategories.deletedCount} categories from database.`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
