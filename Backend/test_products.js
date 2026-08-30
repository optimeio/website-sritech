require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    console.time('query');
    const p = await Product.find().select({
      name: 1, price: 1, category: 1, description: 1, specifications: 1, howToUse: 1,
      stock: 1, shippingCharge: 1, icon: 1, isNewArrival: 1, video: 1, createdAt: 1, sku: 1, slug: 1,
      images: { $slice: 1 }
    }).lean();
    console.timeEnd('query');
    console.log('Products:', p.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
});
