const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');
const connectDatabase = require('./config/db');

const buildCategory = categoryValue => {
  if (!categoryValue) return 'Uncategorized';
  const value = Array.isArray(categoryValue) ? categoryValue[0] : categoryValue;
  if (value == null) return 'Uncategorized';
  const text = String(value).trim();
  if (!text) return 'Uncategorized';

  const normalized = text.toLowerCase();
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

  return text
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const buildProductPayload = product => {
  return {
    sku: product.sku || null,
    slug: product.slug || null,
    name: product.name,
    price: product.price,
    category: buildCategory(product.category),
    icon: product.icon || 'fa-box',
    isNewArrival: !!product.isNewArrival,
    images: [], // Strip heavy base64 images to prevent connection timeout
    createdAt: product.createdAt ? new Date(product.createdAt) : new Date()
  };
};

const run = async () => {
  try {
    await connectDatabase();
    
    // Clear existing products
    console.log('🧹 Clearing existing products...');
    await Product.deleteMany({});
    
    // Read normalized products file
    const jsonPath = path.join(__dirname, 'products_normalized.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('products_normalized.json not found!');
      process.exit(1);
    }
    
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const products = Array.isArray(parsed) ? parsed : (parsed.products || parsed.Product || Object.values(parsed)[0]);
    
    console.log(`🚀 Importing ${products.length} products (stripped images)...`);
    for (const p of products) {
      const payload = buildProductPayload(p);
      const newProd = new Product(payload);
      await newProd.save();
      console.log(`✅ Saved: ${p.name}`);
    }
    
    console.log('🎉 Fast seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fast seeding failed:', err);
    process.exit(1);
  }
};

run();
