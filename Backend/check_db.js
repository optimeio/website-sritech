const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'n:/website-sritech/Backend/.env' });
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const products = await mongoose.connection.collection('products').find({}).toArray();
    console.log('Total products in DB:', products.length);
    
    const fakeProducts = products.filter(p => p.name.includes('Insulation Bakery Stove') || p.name.includes('Bakery Stove 3MM'));
    if (fakeProducts.length > 0) {
      console.log('FOUND FAKE PRODUCTS IN DB:', fakeProducts.length);
      const res = await mongoose.connection.collection('products').deleteMany({ name: { $regex: 'Bakery Stove|Insulation Stove', $options: 'i' } });
      console.log('DELETED FROM DB:', res.deletedCount);
    } else {
      console.log('No fake products found in DB.');
    }
    
    // Also delete the JSON fallback files to completely prevent fallback!
    const fs = require('fs');
    const path = require('path');
    try { fs.unlinkSync(path.join(__dirname, 'products_light.json')); console.log('Deleted products_light.json'); } catch(e) {}
    try { fs.unlinkSync(path.join(__dirname, 'products_normalized.json')); console.log('Deleted products_normalized.json'); } catch(e) {}
    
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
