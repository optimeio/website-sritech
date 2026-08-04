require('dotenv').config();
const connectDatabase = require('./config/db');
const Product = require('./models/Product');

async function removeDummyProducts() {
  try {
    const dbInfo = await connectDatabase();
    if (dbInfo.mode !== 'MongoDB') {
      console.log('Not connected to real MongoDB. Cannot remove dummy products.');
      process.exit(1);
    }
    
    console.log('Connected to real MongoDB. Removing the 7 dummy placeholder products...');
    
    const dummyNames = [
      'Rocket Stove',
      '10" Stove',
      'Rocket Stove Pro',
      'Stove Cooking Plate Kit',
      'Home Appliance Starter Kit',
      'Engraining Premium Pack',
      'SriTech Welding Torch'
    ];
    
    const result = await Product.deleteMany({ name: { $in: dummyNames } });
    console.log(`Successfully removed ${result.deletedCount} dummy products from the database.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error removing dummy products:', error);
    process.exit(1);
  }
}

removeDummyProducts();
